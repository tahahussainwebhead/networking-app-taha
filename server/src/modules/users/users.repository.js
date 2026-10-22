const pool = require("../../config/db");

const SAFE =
  "id, username, email, full_name, bio, avatar_url, role, is_active, last_seen_at, created_at";

async function findPublicById(id) {
  const [rows] = await pool.query(
    `SELECT ${SAFE} FROM users WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function updateProfile(id, fields) {
  const current = await findPublicById(id);
  const merged = Object.assign(
    { fullName: current.full_name, bio: current.bio, avatarUrl: current.avatar_url },
    fields
  );
  await pool.query(
    "UPDATE users SET full_name = ?, bio = ?, avatar_url = ? WHERE id = ?",
    [merged.fullName, merged.bio || null, merged.avatarUrl || null, id]
  );
  return findPublicById(id);
}

async function postCount(userId) {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM posts WHERE user_id = ?", [userId]);
  return rows[0].total;
}

async function getRelationship(meId, targetId) {
  const [rows] = await pool.query(
    "SELECT id, requester_id, status FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)",
    [meId, targetId, targetId, meId]
  );
  const row = rows[0];
  if (!row) return { friendshipId: null, status: "none", direction: null };
  return {
    friendshipId: row.id,
    status: row.status,
    direction: row.requester_id === meId ? "outgoing" : "incoming",
  };
}

async function upsertFollowRequest(requesterId, addresseeId) {
  const [result] = await pool.query(
    "INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?,?,?) ON DUPLICATE KEY UPDATE status = IF(status = 'accepted', status, 'pending')",
    [requesterId, addresseeId, "pending"]
  );
  return result.insertId || 0;
}

async function removeFriendship(meId, targetId) {
  await pool.query(
    "DELETE FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)",
    [meId, targetId, targetId, meId]
  );
}

async function listConnections(userId, kind) {
  if (kind === "following") {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, f.created_at AS since
       FROM friendships f JOIN users u ON u.id = f.addressee_id
       WHERE f.requester_id = ? AND f.status = 'accepted' ORDER BY u.full_name`,
      [userId]
    );
    return rows;
  }
  if (kind === "followers") {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, f.created_at AS since
       FROM friendships f JOIN users u ON u.id = f.requester_id
       WHERE f.addressee_id = ? AND f.status = 'accepted' ORDER BY u.full_name`,
      [userId]
    );
    return rows;
  }
  // friends = mutual accepted
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.avatar_url
     FROM friendships f1
     JOIN friendships f2 ON f1.requester_id = f2.addressee_id AND f1.addressee_id = f2.requester_id
     JOIN users u ON u.id = f1.addressee_id
     WHERE f1.requester_id = ? AND f1.status = 'accepted' AND f2.status = 'accepted'
     ORDER BY u.full_name`,
    [userId]
  );
  return rows;
}

module.exports = {
  findPublicById,
  updateProfile,
  postCount,
  getRelationship,
  upsertFollowRequest,
  removeFriendship,
  listConnections,
};
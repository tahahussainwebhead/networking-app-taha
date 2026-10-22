const pool = require("../../config/db");

async function listIncoming(userId) {
  const [rows] = await pool.query(
    `SELECT f.id AS friendship_id, f.created_at,
            u.id, u.username, u.full_name, u.avatar_url, u.bio
     FROM friendships f JOIN users u ON u.id = f.requester_id
     WHERE f.addressee_id = ? AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
}

async function listOutgoing(userId) {
  const [rows] = await pool.query(
    `SELECT f.id AS friendship_id, f.status, f.created_at,
            u.id, u.username, u.full_name, u.avatar_url
     FROM friendships f JOIN users u ON u.id = f.addressee_id
     WHERE f.requester_id = ? AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM friendships WHERE id = ?", [id]);
  return rows[0] || null;
}

async function accept(id) {
  await pool.query("UPDATE friendships SET status = 'accepted' WHERE id = ?", [id]);
}

async function removeById(id) {
  await pool.query("DELETE FROM friendships WHERE id = ?", [id]);
}

async function listFriends(userId) {
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
  listIncoming,
  listOutgoing,
  listFriends,
  findById,
  accept,
  removeById,
};
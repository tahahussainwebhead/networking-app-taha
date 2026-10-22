const pool = require("../../config/db");

async function create(userId, { content, imageUrl }) {
  const [result] = await pool.query(
    "INSERT INTO posts (user_id, content, image_url) VALUES (?,?,?)",
    [userId, content, imageUrl || null]
  );
  return findById(result.insertId, userId);
}

async function findById(id, viewerId) {
  const [rows] = await pool.query(
    `SELECT p.id, p.content, p.image_url, p.created_at, p.updated_at,
            u.id AS user_id, u.username, u.full_name, u.avatar_url,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
            EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS is_liked
     FROM posts p JOIN users u ON u.id = p.user_id
     WHERE p.id = ?`,
    [viewerId, id]
  );
  if (!rows.length) return null;
  return { ...rows[0], is_liked: rows[0].is_liked === 1 };
}

async function listFeed(userId, { limit = 10, offset = 0 } = {}) {
  const [rows] = await pool.query(
    `SELECT p.id, p.content, p.image_url, p.created_at,
            u.id AS user_id, u.username, u.full_name, u.avatar_url,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
            EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS is_liked
     FROM posts p JOIN users u ON u.id = p.user_id
     WHERE p.user_id = ?
        OR p.user_id IN (
            SELECT f.addressee_id FROM friendships f
            WHERE f.requester_id = ? AND f.status = 'accepted'
            UNION
            SELECT f.requester_id FROM friendships f
            WHERE f.addressee_id = ? AND f.status = 'accepted'
        )
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT ? OFFSET ?`,
    [userId, userId, userId, userId, limit, offset]
  );
  return rows.map((r) => ({ ...r, is_liked: r.is_liked === 1 }));
}

async function countFeed(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM posts p
     WHERE p.user_id = ?
        OR p.user_id IN (
            SELECT f.addressee_id FROM friendships f
            WHERE f.requester_id = ? AND f.status = 'accepted'
            UNION
            SELECT f.requester_id FROM friendships f
            WHERE f.addressee_id = ? AND f.status = 'accepted'
        )`,
    [userId, userId, userId]
  );
  return rows[0].total;
}

async function listByUser(userId, viewerId, { limit = 10, offset = 0 } = {}) {
  const [rows] = await pool.query(
    `SELECT p.id, p.content, p.image_url, p.created_at,
            u.id AS user_id, u.username, u.full_name, u.avatar_url,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
            EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS is_liked
     FROM posts p JOIN users u ON u.id = p.user_id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT ? OFFSET ?`,
    [viewerId, userId, limit, offset]
  );
  return rows.map((r) => ({ ...r, is_liked: r.is_liked === 1 }));
}

async function countByUser(userId) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS total FROM posts WHERE user_id = ?",
    [userId]
  );
  return rows[0].total;
}

async function update(id, userId, { content, imageUrl }) {
  await pool.query(
    "UPDATE posts SET content = ?, image_url = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
    [content, imageUrl || null, id, userId]
  );
}

async function remove(id, userId) {
  await pool.query("DELETE FROM posts WHERE id = ? AND user_id = ?", [id, userId]);
}

async function exists(id) {
  const [rows] = await pool.query("SELECT id, user_id FROM posts WHERE id = ?", [id]);
  return rows[0] || null;
}

async function searchContent(q, viewerId) {
  const [rows] = await pool.query(
    `SELECT p.id, p.content, p.image_url, p.created_at,
            u.id AS user_id, u.username, u.full_name, u.avatar_url,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
            EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS is_liked
     FROM posts p JOIN users u ON u.id = p.user_id
     WHERE p.content LIKE ?
     ORDER BY p.created_at DESC LIMIT 50`,
    [viewerId, `%${q}%`]
  );
  return rows.map((r) => ({ ...r, is_liked: r.is_liked === 1 }));
}

module.exports = {
  create,
  findById,
  listFeed,
  countFeed,
  listByUser,
  countByUser,
  update,
  remove,
  exists,
  searchContent,
};
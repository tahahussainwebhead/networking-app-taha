const pool = require("../../config/db");

async function create(postId, userId, content) {
  const [result] = await pool.query(
    "INSERT INTO comments (post_id, user_id, content) VALUES (?,?,?)",
    [postId, userId, content]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT c.id, c.content, c.created_at,
            u.id AS user_id, u.username, u.full_name, u.avatar_url
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function listByPost(postId) {
  const [rows] = await pool.query(
    `SELECT c.id, c.content, c.created_at,
            u.id AS user_id, u.username, u.full_name, u.avatar_url
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC`,
    [postId]
  );
  return rows;
}

async function update(id, userId, content) {
  const [result] = await pool.query(
    "UPDATE comments SET content = ? WHERE id = ? AND user_id = ?",
    [content, id, userId]
  );
  return result.affectedRows;
}

async function remove(id, userId) {
  const [result] = await pool.query(
    "DELETE FROM comments WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return result.affectedRows;
}

async function removeAsAdmin(id) {
  const [result] = await pool.query("DELETE FROM comments WHERE id = ?", [id]);
  return result.affectedRows;
}

module.exports = { create, findById, listByPost, update, remove, removeAsAdmin };
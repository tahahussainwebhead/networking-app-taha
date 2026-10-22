const pool = require("../../config/db");

async function list(userId, limit) {
  const [rows] = await pool.query(
    `SELECT n.id, n.type, n.entity_id, n.is_read, n.created_at,
            a.id AS actor_id, a.username, a.full_name, a.avatar_url
     FROM notifications n
     LEFT JOIN users a ON a.id = n.actor_id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC
     LIMIT ?`,
    [userId, limit || 50]
  );
  return rows;
}

async function unreadCount(userId) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0",
    [userId]
  );
  return rows[0].total;
}

async function markAllRead(userId) {
  await pool.query(
    "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
    [userId]
  );
}

module.exports = { list, unreadCount, markAllRead };
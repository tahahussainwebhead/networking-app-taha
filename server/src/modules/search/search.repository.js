const pool = require("../../config/db");

async function searchUsers(q, limit) {
  const [rows] = await pool.query(
    `SELECT id, username, full_name, avatar_url, bio
     FROM users
     WHERE is_active = 1 AND (username LIKE ? OR full_name LIKE ?)
     ORDER BY full_name LIMIT ?`,
    [`%${q}%`, `%${q}%`, limit || 20]
  );
  return rows;
}

module.exports = { searchUsers };
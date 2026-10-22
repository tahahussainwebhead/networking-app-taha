const pool = require("../config/db");

async function logActivity(userId, action, details, ip) {
  try {
    await pool.query(
      "INSERT INTO activity_logs (user_id, action, details, ip) VALUES (?,?,?,?)",
      [userId || null, action, details || null, ip || null]
    );
  } catch (err) {
    // logging must never break the request flow
  }
}

module.exports = { logActivity };
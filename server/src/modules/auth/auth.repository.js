const pool = require("../../config/db");

const SAFE_COLUMNS =
  "id, username, email, full_name, bio, avatar_url, role, is_active, created_at";

async function findByUsernameOrEmail(identifier) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1",
    [identifier, identifier]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function create({ username, email, passwordHash, fullName }) {
  const [result] = await pool.query(
    "INSERT INTO users (username, email, password_hash, full_name) VALUES (?,?,?,?)",
    [username, email, passwordHash, fullName]
  );
  return findById(result.insertId);
}

async function usernameExists(username) {
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE username = ? LIMIT 1",
    [username]
  );
  return rows.length > 0;
}

async function emailExists(email) {
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows.length > 0;
}

module.exports = { findById, findByUsernameOrEmail, create, usernameExists, emailExists };
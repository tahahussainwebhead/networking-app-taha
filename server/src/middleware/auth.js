const jwt = require("jsonwebtoken");
const pool = require("../config/db");

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      "SELECT id, username, email, full_name, bio, avatar_url, role, is_active, created_at FROM users WHERE id = ?",
      [decoded.id]
    );
    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ message: "Account is not active" });
    }
    req.user = rows[0];
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
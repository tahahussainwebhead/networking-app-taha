const pool = require("../../config/db");

async function listUsers({ q, role, status, limit, offset }) {
  const where = [];
  const params = [];
  if (q) {
    where.push("(username LIKE ? OR full_name LIKE ? OR email LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (role) {
    where.push("role = ?");
    params.push(role);
  }
  if (status !== undefined && status !== "") {
    where.push("is_active = ?");
    params.push(status === "1" || status === "active" ? 1 : 0);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT SQL_CALC_FOUND_ROWS id, username, full_name, email, role, is_active, created_at,
            (SELECT COUNT(*) FROM posts p WHERE p.user_id = users.id) AS post_count
     FROM users ${whereSql}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit || 50, offset || 0]
  );
  const [[countRow]] = await pool.query("SELECT FOUND_ROWS() AS total");
  return { users: rows, total: countRow.total };
}

async function setRole(userId, role) {
  const [result] = await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
  return result.affectedRows;
}

async function setStatus(userId, isActive) {
  const [result] = await pool.query("UPDATE users SET is_active = ? WHERE id = ?", [isActive, userId]);
  return result.affectedRows;
}

async function listPosts({ q, limit, offset }) {
  const where = [];
  const params = [];
  if (q) {
    where.push("p.content LIKE ?");
    params.push(`%${q}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT SQL_CALC_FOUND_ROWS p.id, p.content, p.image_url, p.created_at,
            p.user_id, u.username, u.full_name, u.avatar_url,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
     FROM posts p JOIN users u ON u.id = p.user_id ${whereSql}
     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit || 50, offset || 0]
  );
  const [[countRow]] = await pool.query("SELECT FOUND_ROWS() AS total");
  return { posts: rows, total: countRow.total };
}

async function deletePost(id) {
  const [result] = await pool.query("DELETE FROM posts WHERE id = ?", [id]);
  return result.affectedRows;
}

async function stats() {
  const [
    [users],
    [posts],
    [likes],
    [comments],
    [messages],
    [friendships],
    [notifications],
  ] = await Promise.all([
    pool.query("SELECT COUNT(*) AS total FROM users"),
    pool.query("SELECT COUNT(*) AS total FROM posts"),
    pool.query("SELECT COUNT(*) AS total FROM likes"),
    pool.query("SELECT COUNT(*) AS total FROM comments"),
    pool.query("SELECT COUNT(*) AS total FROM messages"),
    pool.query("SELECT COUNT(*) AS total FROM friendships WHERE status = 'accepted'"),
    pool.query("SELECT COUNT(*) AS total FROM notifications"),
  ]);
  return {
    users: users[0].total,
    posts: posts[0].total,
    likes: likes[0].total,
    comments: comments[0].total,
    messages: messages[0].total,
    friendships: friendships[0].total,
    notifications: notifications[0].total,
  };
}

module.exports = { listUsers, setRole, setStatus, listPosts, deletePost, stats };
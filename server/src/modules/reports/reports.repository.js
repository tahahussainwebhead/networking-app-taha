const pool = require("../../config/db");

async function activity(limit, offset) {
  const [rows] = await pool.query(
    `SELECT al.id, al.action, al.details, al.ip, al.created_at,
            u.id AS user_id, u.username, u.full_name
     FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
    [limit || 100, offset || 0]
  );
  return rows;
}

async function topActiveUsers(limit) {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.avatar_url,
            (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) AS posts,
            (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id) AS comments,
            (SELECT COUNT(*) FROM likes l WHERE l.user_id = u.id) AS likes,
            (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) +
            (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id) +
            (SELECT COUNT(*) FROM likes l WHERE l.user_id = u.id) AS activity_score
     FROM users u
     ORDER BY activity_score DESC
     LIMIT ?`,
    [limit || 10]
  );
  return rows;
}

async function signupsLast7Days() {
  const [rows] = await pool.query(
    `SELECT DATE(created_at) AS day, COUNT(*) AS total
     FROM users
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(created_at)
     ORDER BY day`
  );
  return rows;
}

async function engagementByDay(limit) {
  const [rows] = await pool.query(
    `SELECT DATE(created_at) AS day,
            SUM(CASE WHEN action = 'post.create' THEN 1 ELSE 0 END) AS posts,
            SUM(CASE WHEN action = 'like' THEN 1 ELSE 0 END) AS likes,
            SUM(CASE WHEN action = 'comment.create' THEN 1 ELSE 0 END) AS comments,
            SUM(CASE WHEN action = 'message.send' THEN 1 ELSE 0 END) AS messages,
            COUNT(*) AS total
     FROM activity_logs
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(created_at)
     ORDER BY day`
  );
  return rows;
}

module.exports = { activity, topActiveUsers, signupsLast7Days, engagementByDay };
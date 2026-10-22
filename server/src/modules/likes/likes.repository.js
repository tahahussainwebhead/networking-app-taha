const pool = require("../../config/db");

async function toggleLike(userId, postId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query(
      "SELECT id FROM likes WHERE user_id = ? AND post_id = ?",
      [userId, postId]
    );
    if (existing.length) {
      await conn.query("DELETE FROM likes WHERE id = ?", [existing[0].id]);
    } else {
      await conn.query(
        "INSERT INTO likes (user_id, post_id) VALUES (?,?)",
        [userId, postId]
      );
    }
    const [[countRow]] = await conn.query(
      "SELECT COUNT(*) AS total FROM likes WHERE post_id = ?",
      [postId]
    );
    await conn.commit();
    return { liked: existing.length === 0, count: countRow.total };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function listLikers(postId) {
  const [rows] = await pool.query(
    "SELECT u.id, u.username, u.full_name, u.avatar_url FROM likes l JOIN users u ON u.id = l.user_id WHERE l.post_id = ? ORDER BY l.created_at DESC",
    [postId]
  );
  return rows;
}

async function existsLike(postId, userId) {
  const [rows] = await pool.query(
    "SELECT id FROM likes WHERE user_id = ? AND post_id = ?",
    [userId, postId]
  );
  return rows.length > 0;
}

module.exports = { toggleLike, listLikers, existsLike };
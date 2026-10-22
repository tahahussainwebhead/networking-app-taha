const pool = require("../../config/db");

async function getConversation(meId, otherId) {
  const [rows] = await pool.query(
    `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at
     FROM messages m
     WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC`,
    [meId, otherId, otherId, meId]
  );
  return rows;
}

async function markRead(meId, otherId) {
  await pool.query(
    "UPDATE messages SET is_read = 1, read_at = NOW() WHERE sender_id = ? AND receiver_id = ? AND is_read = 0",
    [otherId, meId]
  );
}

async function createMessage(senderId, receiverId, content) {
  const [result] = await pool.query(
    "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?,?,?)",
    [senderId, receiverId, content]
  );
  const [rows] = await pool.query(
    `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
            u.username, u.full_name, u.avatar_url
     FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE m.id = ?`,
    [result.insertId]
  );
  return rows[0];
}

async function listConversations(userId) {
  const [rows] = await pool.query(
    `SELECT m.*, u.id AS other_id, u.username, u.full_name, u.avatar_url, u.last_seen_at
     FROM messages m
     JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
     WHERE m.sender_id = ? OR m.receiver_id = ?
     ORDER BY m.created_at DESC`,
    [userId, userId, userId]
  );

  const map = new Map();
  for (const m of rows) {
    const otherId = String(m.other_id);
    if (!map.has(otherId)) {
      map.set(otherId, {
        id: m.other_id,
        username: m.username,
        full_name: m.full_name,
        avatar_url: m.avatar_url,
        last_seen_at: m.last_seen_at,
        last_message: m.content,
        last_message_at: m.created_at,
        last_sender_id: m.sender_id,
        unread: String(m.sender_id) !== String(userId) && Number(m.is_read) === 0 ? 1 : 0,
      });
    } else {
      const c = map.get(otherId);
      if (String(m.sender_id) !== String(userId) && Number(m.is_read) === 0) {
        c.unread += 1;
      }
    }
  }
  return Array.from(map.values());
}

module.exports = {
  getConversation,
  markRead,
  createMessage,
  listConversations,
};
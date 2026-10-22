const pool = require("../config/db");
const { emitToUser } = require("./socket");

async function notify(recipientId, actorId, type, entityId) {
  if (recipientId && String(recipientId) !== String(actorId)) {
    const [result] = await pool.query(
      "INSERT INTO notifications (user_id, actor_id, type, entity_id) VALUES (?,?,?,?)",
      [recipientId, actorId || null, type, entityId || null]
    );
    emitToUser(recipientId, "notification:new", {
      id: result.insertId,
      type,
      actorId: actorId || null,
      entityId: entityId || null,
    });
  }
}

module.exports = { notify };
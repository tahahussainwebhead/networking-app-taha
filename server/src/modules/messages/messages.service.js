const repo = require("./messages.repository");
const { AppError } = require("../../utils/AppError");
const { notify } = require("../../utils/notify");
const { logActivity } = require("../../utils/activity");
const { emitToUser } = require("../../utils/socket");

async function conversationsList(userId) {
  return repo.listConversations(userId);
}

async function list(userId, otherId) {
  if (String(userId) === String(otherId)) {
    throw new AppError(400, "Cannot open a conversation with yourself");
  }
  const messages = await repo.getConversation(userId, otherId);
  await repo.markRead(userId, otherId);
  return messages;
}

async function send(userId, otherId, body) {
  const content = body.content && String(body.content).trim();
  if (!content) {
    throw new AppError(400, "Message content is required");
  }
  if (content.length > 4000) {
    throw new AppError(400, "Message is too long");
  }
  if (String(userId) === String(otherId)) {
    throw new AppError(400, "Cannot message yourself");
  }
  const message = await repo.createMessage(userId, otherId, content);
  logActivity(userId, "message.send", `Message to user #${otherId}`);
  await notify(otherId, userId, "message", message.id);
  emitToUser(otherId, "message:new", message);
  emitToUser(userId, "message:new", { ...message, receiver_id: parseInt(otherId, 10) });
  return message;
}

module.exports = { conversationsList, list, send };
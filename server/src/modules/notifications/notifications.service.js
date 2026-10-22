const repo = require("./notifications.repository");

async function list(userId, limit) {
  return repo.list(userId, limit);
}

async function unreadCount(userId) {
  return repo.unreadCount(userId);
}

async function markAllRead(userId) {
  await repo.markAllRead(userId);
  return { message: "All notifications marked as read" };
}

module.exports = { list, unreadCount, markAllRead };
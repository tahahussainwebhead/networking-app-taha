const repo = require("./friendships.repository");
const { AppError } = require("../../utils/AppError");
const { notify } = require("../../utils/notify");
const { logActivity } = require("../../utils/activity");

async function incoming(userId) {
  return repo.listIncoming(userId);
}

async function outgoing(userId) {
  return repo.listOutgoing(userId);
}

async function friends(userId) {
  return repo.listFriends(userId);
}

async function accept(userId, friendshipId) {
  const row = await repo.findById(friendshipId);
  if (!row) {
    throw new AppError(404, "Friend request not found");
  }
  if (String(row.addressee_id) !== String(userId)) {
    throw new AppError(403, "This request is not addressed to you");
  }
  if (row.status === "accepted") {
    return { message: "Already connected" };
  }
  await repo.accept(friendshipId);
  logActivity(userId, "friend.accept", `Accepted request #${friendshipId}`);
  await notify(row.requester_id, userId, "friend_accepted", null);
  return { message: "Friend request accepted" };
}

async function reject(userId, friendshipId) {
  const row = await repo.findById(friendshipId);
  if (!row) {
    throw new AppError(404, "Friend request not found");
  }
  const isAddressee = String(row.addressee_id) === String(userId);
  const isRequester = String(row.requester_id) === String(userId);
  if (!isAddressee && !isRequester) {
    throw new AppError(403, "Not allowed");
  }
  await repo.removeById(friendshipId);
  logActivity(userId, "friend.reject", `Removed request #${friendshipId}`);
  return { message: "Request removed" };
}

module.exports = { incoming, outgoing, friends, accept, reject };
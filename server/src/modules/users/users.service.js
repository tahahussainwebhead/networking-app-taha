const repo = require("./users.repository");
const { AppError } = require("../../utils/AppError");
const { logActivity } = require("../../utils/activity");
const { notify } = require("../../utils/notify");

async function getProfile(meId, id) {
  const user = await repo.findPublicById(id);
  if (!user) {
    throw new AppError(404, "User not found");
  }
  const [posts, followers, following, friends, relationship] = await Promise.all([
    repo.postCount(id),
    repo.listConnections(id, "followers"),
    repo.listConnections(id, "following"),
    repo.listConnections(id, "friends"),
    meId && String(meId) !== String(id) ? repo.getRelationship(meId, id) : null,
  ]);
  return {
    ...user,
    stats: { posts, followers: followers.length, following: following.length, friends: friends.length },
    followers,
    following,
    friends,
    relationship: meId && String(meId) === String(id)
      ? { status: "self", friendshipId: null, direction: null }
      : relationship,
  };
}

async function updateProfile(userId, body) {
  const fields = {};
  if (body.fullName !== undefined) fields.fullName = String(body.fullName).trim();
  if (body.bio !== undefined) fields.bio = String(body.bio).trim() || null;
  if (body.avatarUrl !== undefined) fields.avatarUrl = String(body.avatarUrl).trim() || null;
  if (Object.keys(fields).length === 0) {
    throw new AppError(400, "Nothing to update");
  }
  if (fields.fullName && fields.fullName.length < 2) {
    throw new AppError(400, "Full name must be at least 2 characters");
  }
  const user = await repo.updateProfile(userId, fields);
  logActivity(userId, "profile.update", "Profile updated");
  return user;
}

async function follow(targetId, userId, ip) {
  if (String(targetId) === String(userId)) {
    throw new AppError(400, "You cannot follow yourself");
  }
  const target = await repo.findPublicById(targetId);
  if (!target) {
    throw new AppError(404, "User not found");
  }
  const rel = await repo.getRelationship(userId, targetId);
  if (rel.status === "pending" && rel.direction === "outgoing") {
    throw new AppError(409, "Follow request already sent");
  }
  if (rel.status === "accepted") {
    throw new AppError(409, "Already connected");
  }
  await repo.upsertFollowRequest(userId, targetId);
  logActivity(userId, `follow.sent:${targetId}`, `Follow request -> ${target.username}`, ip);
  await notify(targetId, userId, "friend_request", null);
  return { message: rel.status === "accepted" ? "Connected" : "Follow request sent" };
}

async function unfollow(targetId, userId) {
  const rel = await repo.getRelationship(userId, targetId);
  if (rel.status === "none") {
    throw new AppError(404, "No relationship to remove");
  }
  await repo.removeFriendship(userId, targetId);
  logActivity(userId, `unfollow:${targetId}`, "Removed connection");
  return { message: "Connection removed" };
}

async function connections(userId, id, kind) {
  const target = await repo.findPublicById(id);
  if (!target) {
    throw new AppError(404, "User not found");
  }
  if (!["following", "followers", "friends"].includes(kind)) {
    throw new AppError(400, "Invalid connection kind");
  }
  const rows = await repo.listConnections(id, kind);
  if (kind === "friends" && String(userId) !== String(id)) {
    // only show friends to the profile owner / or public? Keep public for prototype.
  }
  return rows;
}

module.exports = { getProfile, updateProfile, follow, unfollow, connections };
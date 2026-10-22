const repo = require("./admin.repository");
const { AppError } = require("../../utils/AppError");
const { logActivity } = require("../../utils/activity");

async function listUsers(body) {
  return repo.listUsers(body);
}

async function changeRole(adminId, userId, role) {
  if (!["user", "admin"].includes(role)) {
    throw new AppError(400, "Invalid role");
  }
  if (String(adminId) === String(userId)) {
    throw new AppError(400, "You cannot change your own role");
  }
  const affected = await repo.setRole(userId, role);
  if (!affected) {
    throw new AppError(404, "User not found");
  }
  logActivity(adminId, "admin.role", `Set user #${userId} role to ${role}`);
  return { message: `Role updated to ${role}` };
}

async function changeStatus(userId, isActive) {
  const affected = await repo.setStatus(userId, isActive ? 1 : 0);
  if (!affected) {
    throw new AppError(404, "User not found");
  }
  logActivity(null, "admin.status", `Set user #${userId} active=${isActive}`);
  return { message: isActive ? "User activated" : "User deactivated" };
}

async function listPosts(body) {
  return repo.listPosts(body);
}

async function deletePost(postId) {
  const affected = await repo.deletePost(postId);
  if (!affected) {
    throw new AppError(404, "Post not found");
  }
  logActivity(null, "admin.post.delete", `Admin deleted post #${postId}`);
  return { message: "Post deleted" };
}

async function getStats() {
  return repo.stats();
}

module.exports = { listUsers, changeRole, changeStatus, listPosts, deletePost, getStats };
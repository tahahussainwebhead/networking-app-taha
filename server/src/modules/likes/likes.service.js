const repo = require("./likes.repository");
const postRepo = require("../posts/posts.repository");
const { AppError } = require("../../utils/AppError");
const { notify } = require("../../utils/notify");
const { logActivity } = require("../../utils/activity");

async function toggle(userId, postId) {
  const post = await postRepo.exists(postId);
  if (!post) {
    throw new AppError(404, "Post not found");
  }
  const wasLiked = await repo.existsLike(postId, userId);
  const result = await repo.toggleLike(userId, postId);
  if (!wasLiked) {
    logActivity(userId, "like", `Liked post #${postId}`);
    await notify(post.user_id, userId, "like", parseInt(postId, 10));
  } else {
    logActivity(userId, "unlike", `Unliked post #${postId}`);
  }
  return result;
}

async function list(postId) {
  const post = await postRepo.exists(postId);
  if (!post) {
    throw new AppError(404, "Post not found");
  }
  return repo.listLikers(postId);
}

module.exports = { toggle, list };
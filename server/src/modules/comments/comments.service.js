const repo = require("./comments.repository");
const postRepo = require("../posts/posts.repository");
const { AppError } = require("../../utils/AppError");
const { notify } = require("../../utils/notify");
const { logActivity } = require("../../utils/activity");

async function create(postId, userId, body) {
  const content = body.content && String(body.content).trim();
  if (!content) {
    throw new AppError(400, "Comment content is required");
  }
  if (content.length > 2000) {
    throw new AppError(400, "Comment is too long");
  }
  const post = await postRepo.exists(postId);
  if (!post) {
    throw new AppError(404, "Post not found");
  }
  const comment = await repo.create(postId, userId, content);
  logActivity(userId, "comment.create", `Commented on post #${postId}`);
  await notify(post.user_id, userId, "comment", parseInt(postId, 10));
  return comment;
}

async function list(postId) {
  const post = await postRepo.exists(postId);
  if (!post) {
    throw new AppError(404, "Post not found");
  }
  return repo.listByPost(postId);
}

async function updateComment(userId, commentId, body) {
  const content = body.content && String(body.content).trim();
  if (!content) {
    throw new AppError(400, "Comment content is required");
  }
  const affected = await repo.update(commentId, userId, content);
  if (!affected) {
    const comment = await repo.findById(commentId);
    if (!comment) {
      throw new AppError(404, "Comment not found");
    }
    throw new AppError(403, "You can only edit your own comments");
  }
  logActivity(userId, "comment.update", `Edited comment #${commentId}`);
  return repo.findById(commentId);
}

async function deleteComment(userId, commentId) {
  const affected = await repo.remove(commentId, userId);
  if (!affected) {
    const comment = await repo.findById(commentId);
    if (!comment) {
      throw new AppError(404, "Comment not found");
    }
    throw new AppError(403, "You can only delete your own comments");
  }
  logActivity(userId, "comment.delete", `Deleted comment #${commentId}`);
  return { message: "Comment deleted" };
}

async function deleteCommentAsAdmin(commentId) {
  const affected = await repo.removeAsAdmin(commentId);
  if (!affected) {
    throw new AppError(404, "Comment not found");
  }
  logActivity(null, "admin.comment.delete", `Admin deleted comment #${commentId}`);
  return { message: "Comment deleted" };
}

module.exports = {
  create,
  list,
  updateComment,
  deleteComment,
  deleteCommentAsAdmin,
};
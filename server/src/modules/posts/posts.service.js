const repo = require("./posts.repository");
const { AppError } = require("../../utils/AppError");
const { logActivity } = require("../../utils/activity");

async function createPost(userId, body) {
  const content = body.content && String(body.content).trim();
  if (!content) {
    throw new AppError(400, "Post content is required");
  }
  if (content.length > 10000) {
    throw new AppError(400, "Post content is too long");
  }
  const post = await repo.create(userId, { content, imageUrl: body.imageUrl });
  logActivity(userId, "post.create", `Created post #${post.id}`);
  return post;
}

function parsePage(value, fallback) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return n;
}

function parseLimit(value, fallback) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return Math.min(n, 50);
}

async function getFeed(userId, query = {}) {
  const page = parsePage(query.page, 1);
  const limit = parseLimit(query.limit, 10);
  const offset = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    repo.listFeed(userId, { limit, offset }),
    repo.countFeed(userId),
  ]);
  return { posts, total, page, limit, hasMore: offset + posts.length < total };
}

async function getUserPosts(userId, viewerId, query = {}) {
  const page = parsePage(query.page, 1);
  const limit = parseLimit(query.limit, 10);
  const offset = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    repo.listByUser(userId, viewerId, { limit, offset }),
    repo.countByUser(userId),
  ]);
  return { posts, total, page, limit, hasMore: offset + posts.length < total };
}

async function getPost(id, viewerId) {
  const post = await repo.findById(id, viewerId);
  if (!post) {
    throw new AppError(404, "Post not found");
  }
  return post;
}

async function updatePost(userId, id, body) {
  const post = await repo.exists(id);
  if (!post) {
    throw new AppError(404, "Post not found");
  }
  if (String(post.user_id) !== String(userId)) {
    throw new AppError(403, "You can only edit your own posts");
  }
  const content = body.content !== undefined ? String(body.content).trim() : null;
  if (body.content !== undefined && !content) {
    throw new AppError(400, "Post content is required");
  }
  const imageUrl =
    body.imageUrl !== undefined ? String(body.imageUrl).trim() || null : undefined;
  await repo.update(id, userId, {
    content: content ?? undefined,
    imageUrl: imageUrl ?? undefined,
  });
  logActivity(userId, "post.update", `Edited post #${id}`);
  return repo.findById(id, userId);
}

async function deletePost(userId, id) {
  const post = await repo.exists(id);
  if (!post) {
    throw new AppError(404, "Post not found");
  }
  if (String(post.user_id) !== String(userId)) {
    throw new AppError(403, "You can only delete your own posts");
  }
  await repo.remove(id, userId);
  logActivity(userId, "post.delete", `Deleted post #${id}`);
  return { message: "Post deleted" };
}

module.exports = { createPost, getFeed, getUserPosts, getPost, updatePost, deletePost };
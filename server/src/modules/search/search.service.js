const userRepo = require("./search.repository");
const postRepo = require("../posts/posts.repository");
const { AppError } = require("../../utils/AppError");

async function search(q, userId) {
  if (!q || !String(q).trim()) {
    throw new AppError(400, "Search query is required");
  }
  const query = String(q).trim();
  const [users, posts] = await Promise.all([
    userRepo.searchUsers(query),
    postRepo.searchContent(query, userId),
  ]);
  return { users, posts };
}

module.exports = { search };
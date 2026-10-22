const service = require("./posts.service");
const { catchAsync } = require("../../utils/AppError");

exports.create = catchAsync(async (req, res) => {
  const post = await service.createPost(req.user.id, req.body);
  res.status(201).json({ post });
});

exports.feed = catchAsync(async (req, res) => {
  const data = await service.getFeed(req.user.id, req.query);
  res.json(data);
});

exports.byUser = catchAsync(async (req, res) => {
  const data = await service.getUserPosts(req.params.id, req.user.id, req.query);
  res.json(data);
});

exports.detail = catchAsync(async (req, res) => {
  const post = await service.getPost(req.params.id, req.user.id);
  res.json({ post });
});

exports.update = catchAsync(async (req, res) => {
  const post = await service.updatePost(req.user.id, req.params.id, req.body);
  res.json({ post });
});

exports.remove = catchAsync(async (req, res) => {
  const result = await service.deletePost(req.user.id, req.params.id);
  res.json(result);
});
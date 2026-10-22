const service = require("./admin.service");
const { catchAsync } = require("../../utils/AppError");

exports.stats = catchAsync(async (req, res) => {
  const stats = await service.getStats();
  res.json(stats);
});

exports.users = catchAsync(async (req, res) => {
  const result = await service.listUsers(req.query);
  res.json(result);
});

exports.role = catchAsync(async (req, res) => {
  const result = await service.changeRole(req.user.id, req.params.id, req.body.role);
  res.json(result);
});

exports.status = catchAsync(async (req, res) => {
  const result = await service.changeStatus(
    req.params.id,
    req.body.isActive !== undefined ? Boolean(req.body.isActive) : true
  );
  res.json(result);
});

exports.posts = catchAsync(async (req, res) => {
  const result = await service.listPosts(req.query);
  res.json(result);
});

exports.deletePost = catchAsync(async (req, res) => {
  const result = await service.deletePost(req.params.id);
  res.json(result);
});
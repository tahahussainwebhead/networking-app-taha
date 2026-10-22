const service = require("./users.service");
const { catchAsync } = require("../../utils/AppError");

exports.getMe = catchAsync(async (req, res) => {
  const profile = await service.getProfile(req.user.id, req.user.id);
  res.json({ user: profile });
});

exports.getProfile = catchAsync(async (req, res) => {
  const profile = await service.getProfile(req.user.id, req.params.id);
  res.json({ user: profile });
});

exports.updateMe = catchAsync(async (req, res) => {
  const user = await service.updateProfile(req.user.id, req.body);
  res.json({ user });
});

exports.follow = catchAsync(async (req, res) => {
  const result = await service.follow(req.params.id, req.user.id, req.ip);
  res.json(result);
});

exports.unfollow = catchAsync(async (req, res) => {
  const result = await service.unfollow(req.params.id, req.user.id);
  res.json(result);
});

exports.connections = catchAsync(async (req, res) => {
  const rows = await service.connections(req.user.id, req.params.id, req.params.kind);
  res.json({ users: rows });
});
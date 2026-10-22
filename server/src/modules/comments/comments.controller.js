const service = require("./comments.service");
const { catchAsync } = require("../../utils/AppError");

exports.create = catchAsync(async (req, res) => {
  const comment = await service.create(req.params.id, req.user.id, req.body);
  res.status(201).json({ comment });
});

exports.list = catchAsync(async (req, res) => {
  const comments = await service.list(req.params.id);
  res.json({ comments });
});

exports.update = catchAsync(async (req, res) => {
  const comment = await service.updateComment(req.user.id, req.params.id, req.body);
  res.json({ comment });
});

exports.remove = catchAsync(async (req, res) => {
  const result = await service.deleteComment(req.user.id, req.params.id);
  res.json(result);
});
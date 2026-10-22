const service = require("./likes.service");
const { catchAsync } = require("../../utils/AppError");

exports.toggle = catchAsync(async (req, res) => {
  const result = await service.toggle(req.user.id, req.params.id);
  res.json(result);
});

exports.list = catchAsync(async (req, res) => {
  const users = await service.list(req.params.id);
  res.json({ users });
});
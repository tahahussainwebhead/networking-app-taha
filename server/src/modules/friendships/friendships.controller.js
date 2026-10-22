const service = require("./friendships.service");
const { catchAsync } = require("../../utils/AppError");

exports.incoming = catchAsync(async (req, res) => {
  const requests = await service.incoming(req.user.id);
  res.json({ requests });
});

exports.outgoing = catchAsync(async (req, res) => {
  const requests = await service.outgoing(req.user.id);
  res.json({ requests });
});

exports.friends = catchAsync(async (req, res) => {
  const friends = await service.friends(req.user.id);
  res.json({ friends });
});

exports.accept = catchAsync(async (req, res) => {
  const result = await service.accept(req.user.id, req.params.id);
  res.json(result);
});

exports.reject = catchAsync(async (req, res) => {
  const result = await service.reject(req.user.id, req.params.id);
  res.json(result);
});
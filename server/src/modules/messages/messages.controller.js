const service = require("./messages.service");
const { catchAsync } = require("../../utils/AppError");

exports.conversations = catchAsync(async (req, res) => {
  const conversations = await service.conversationsList(req.user.id);
  res.json({ conversations });
});

exports.list = catchAsync(async (req, res) => {
  const messages = await service.list(req.user.id, req.params.userId);
  res.json({ messages });
});

exports.send = catchAsync(async (req, res) => {
  const message = await service.send(req.user.id, req.params.userId, req.body);
  res.status(201).json({ message });
});
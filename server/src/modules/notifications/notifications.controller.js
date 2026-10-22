const service = require("./notifications.service");
const { catchAsync } = require("../../utils/AppError");

exports.list = catchAsync(async (req, res) => {
  const notifications = await service.list(req.user.id, req.query.limit);
  const unread = await service.unreadCount(req.user.id);
  res.json({ notifications, unread });
});

exports.unreadCount = catchAsync(async (req, res) => {
  const unread = await service.unreadCount(req.user.id);
  res.json({ unread });
});

exports.markAllRead = catchAsync(async (req, res) => {
  const result = await service.markAllRead(req.user.id);
  res.json(result);
});
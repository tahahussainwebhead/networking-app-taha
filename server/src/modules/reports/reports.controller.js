const service = require("./reports.service");
const { catchAsync } = require("../../utils/AppError");

exports.overview = catchAsync(async (req, res) => {
  const report = await service.fullReport();
  res.json(report);
});

exports.activity = catchAsync(async (req, res) => {
  const activity = await service.activity(req.query.limit);
  res.json({ activity });
});

exports.topActive = catchAsync(async (req, res) => {
  const users = await service.topActiveUsers(req.query.limit);
  res.json({ users });
});
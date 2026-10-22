const service = require("./search.service");
const { catchAsync } = require("../../utils/AppError");

exports.search = catchAsync(async (req, res) => {
  const results = await service.search(req.query.q, req.user.id);
  res.json(results);
});
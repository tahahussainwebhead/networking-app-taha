const service = require("./auth.service");
const { catchAsync } = require("../../utils/AppError");

exports.register = catchAsync(async (req, res) => {
  const { token, user } = await service.register(req.body, req.ip);
  res.status(201).json({ token, user });
});

exports.login = catchAsync(async (req, res) => {
  const { token, user } = await service.login(
    req.body.identifier,
    req.body.password,
    req.ip
  );
  res.json({ token, user });
});

exports.me = catchAsync(async (req, res) => {
  const user = await service.me(req.user.id);
  res.json({ user });
});
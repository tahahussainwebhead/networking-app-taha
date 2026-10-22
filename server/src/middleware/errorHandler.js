const { AppError } = require("../utils/AppError");

module.exports = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Resource already exists" });
  }
  console.error("Unhandled error:", err);
  return res.status(500).json({ message: "Internal server error" });
};
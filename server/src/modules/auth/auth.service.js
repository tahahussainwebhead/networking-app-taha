const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const repo = require("./auth.repository");
const { AppError } = require("../../utils/AppError");
const { logActivity } = require("../../utils/activity");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
}

async function register({ username, email, password, fullName }, ip) {
  if (!username || !email || !password || !fullName) {
    throw new AppError(400, "All fields are required");
  }
  username = String(username).trim().toLowerCase();
  email = String(email).trim().toLowerCase();
  fullName = String(fullName).trim();

  if (username.length < 3 || username.length > 50) {
    throw new AppError(400, "Username must be between 3 and 50 characters");
  }
  if (!EMAIL_RE.test(email)) {
    throw new AppError(400, "Invalid email address");
  }
  if (password.length < 8) {
    throw new AppError(400, "Password must be at least 8 characters");
  }

  if (await repo.usernameExists(username)) {
    throw new AppError(409, "Username is already taken");
  }
  if (await repo.emailExists(email)) {
    throw new AppError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await repo.create({ username, email, passwordHash, fullName });
  logActivity(user.id, "auth.register", `New account created: ${username}`, ip);
  return { token: signToken(user), user };
}

async function login(identifier, password, ip) {
  if (!identifier || !password) {
    throw new AppError(400, "Username/email and password are required");
  }
  const user = await repo.findByUsernameOrEmail(String(identifier).trim());
  if (!user || !user.is_active) {
    throw new AppError(401, "Invalid credentials");
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError(401, "Invalid credentials");
  }
  logActivity(user.id, "auth.login", `Logged in as ${user.username}`, ip);
  const { password_hash, ...safeUser } = user;
  return { token: signToken(user), user: safeUser };
}

async function me(id) {
  const user = await repo.findById(id);
  if (!user) {
    throw new AppError(404, "User not found");
  }
  return user;
}

module.exports = { register, login, me };
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;
const userSockets = new Map(); // userId -> Set of socket ids

function initSocket(server, clientUrl) {
  io = new Server(server, {
    cors: { origin: clientUrl, methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    let uid = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      uid = String(decoded.id);
    } catch (err) {
      socket.disconnect();
      return;
    }

    socket.join(`user:${uid}`);
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);

    socket.on("disconnect", () => {
      const set = userSockets.get(uid);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(uid);
      }
    });
  });

  return io;
}

function emitToUser(userId, event, data) {
  if (io) io.to(`user:${String(userId)}`).emit(event, data);
}

function getIo() {
  return io;
}

module.exports = { initSocket, emitToUser, getIo, userSockets };
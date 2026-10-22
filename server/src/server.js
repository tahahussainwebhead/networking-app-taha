require("dotenv").config();
const http = require("http");
const app = require("./app");
const { initSocket } = require("./utils/socket");

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const server = http.createServer(app);
initSocket(server, CLIENT_URL);

server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Socket.IO ready, allowing origin ${CLIENT_URL}`);
});
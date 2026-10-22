require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "social_app";

async function run() {
  console.log(`Connecting to MySQL at ${DB_HOST}...`);
  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  console.log(`Creating database '${DB_NAME}' if missing...`);
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.query(`USE \`${DB_NAME}\``);

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const statements = schema
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await conn.query(stmt);
  }
  console.log("Schema applied.");

  const demoHash = await bcrypt.hash("password123", 10);
  const adminHash = await bcrypt.hash("admin123", 10);

  const seedUsers = [
    [1, "admin", "admin@demo.com", adminHash, "System Admin", "Platform administrator",
      null, "admin", 1],
    [2, "alice", "alice@demo.com", demoHash, "Alice Johnson", "Frontend developer who loves clean UI.",
      "https://i.pravatar.cc/150?img=47", "user", 1],
    [3, "bob", "bob@demo.com", demoHash, "Bob Smith", "Node.js enthusiast and coffee addict.",
      "https://i.pravatar.cc/150?img=12", "user", 1],
    [4, "carol", "carol@demo.com", demoHash, "Carol Davis", "Product designer @ Studio X.",
      "https://i.pravatar.cc/150?img=32", "user", 1],
    [5, "dave", "dave@demo.com", demoHash, "Dave Wilson", "Just here to share memes.",
      "https://i.pravatar.cc/150?img=59", "user", 1],
  ];

  await conn.query(`DELETE FROM activity_logs`);
  await conn.query(`DELETE FROM notifications`);
  await conn.query(`DELETE FROM messages`);
  await conn.query(`DELETE FROM friendships`);
  await conn.query(`DELETE FROM likes`);
  await conn.query(`DELETE FROM comments`);
  await conn.query(`DELETE FROM posts`);
  await conn.query(`DELETE FROM users`);
  for (const table of [
    "users",
    "posts",
    "likes",
    "comments",
    "friendships",
    "messages",
    "notifications",
    "activity_logs",
  ]) {
    await conn.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
  }

  for (const u of seedUsers) {
    await conn.query(
      "INSERT INTO users (id, username, email, password_hash, full_name, bio, avatar_url, role, is_active) VALUES (?,?,?,?,?,?,?,?,?)",
      u
    );
  }
  console.log("Seeded users.");

  const seedPosts = [
    [2, "Hello world! Excited to be on this new social platform. What is everyone up to today?", null],
    [3, "Just shipped a new REST API at work. Layered architecture pays off every single time.",
      "https://picsum.photos/seed/api/640/400"],
    [4, "Design tip: whitespace is not wasted space. Your users will thank you.",
      null],
    [2, "Coffee first, code later. Anyone else?",
      "https://picsum.photos/seed/coffee/640/400"],
    [5, "Rust or Go for the next microservice? Asking for a friend.",
      null],
  ];
  for (const p of seedPosts) {
    await conn.query(
      "INSERT INTO posts (user_id, content, image_url) VALUES (?,?,?)",
      p
    );
  }
  console.log("Seeded posts.");

  const seedLikes = [
    [3, 1], [4, 1], [5, 1], [2, 2], [4, 2], [5, 2], [2, 3], [3, 3], [2, 4], [3, 5],
  ];
  for (const l of seedLikes) {
    await conn.query(
      "INSERT INTO likes (user_id, post_id) VALUES (?,?)",
      l
    );
  }
  console.log("Seeded likes.");

  const seedComments = [
    [3, 1, "Welcome! Great to see you here."],
    [4, 1, "Hey Alice! Looking forward to your posts."],
    [2, 2, "Totally agree, clean boundaries make testing a breeze."],
    [5, 2, "I've been using the same pattern. Works wonders."],
    [5, 3, "Wish more designers thought like this."],
    [2, 5, "Go for Rust, you can't go wrong."],
  ];
  for (const c of seedComments) {
    await conn.query(
      "INSERT INTO comments (user_id, post_id, content) VALUES (?,?,?)",
      c
    );
  }
  console.log("Seeded comments.");

  const seedFriendships = [
    [2, 3, "accepted"],
    [3, 2, "accepted"],
    [2, 4, "accepted"],
    [4, 2, "accepted"],
    [3, 4, "accepted"],
    [4, 3, "accepted"],
    [5, 2, "pending"],
  ];
  for (const f of seedFriendships) {
    await conn.query(
      "INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?,?,?)",
      f
    );
  }
  console.log("Seeded friendships.");

  const seedMessages = [
    [3, 2, "Hey Alice! How is the new React project going?"],
    [2, 3, "Hey Bob, going great! Just deployed the feed component."],
    [3, 2, "Nice! Wanna hop on a call later this week?"],
    [2, 3, "Sure, Thursday works for me."],
  ];
  for (const m of seedMessages) {
    await conn.query(
      "INSERT INTO messages (sender_id, receiver_id, content, is_read, read_at) VALUES (?,?,?,1,NOW())",
      m
    );
  }
  console.log("Seeded messages.");

  const seedNotifications = [
    [2, 3, "friend_request", null],
    [2, 4, "comment", 1],
    [3, 2, "like", 1],
    [4, 3, "friend_accepted", null],
  ];
  for (const n of seedNotifications) {
    await conn.query(
      "INSERT INTO notifications (user_id, actor_id, type, entity_id) VALUES (?,?,?,?)",
      n
    );
  }
  console.log("Seeded notifications.");

  await conn.end();
  console.log("\nDatabase initialized successfully!");
  console.log("Demo logins:");
  console.log("  admin  -> admin@demo.com / admin123");
  console.log("  alice  -> alice@demo.com / password123");
  console.log("  bob    -> bob@demo.com   / password123");
  console.log("  carol  -> carol@demo.com / password123");
  console.log("  dave   -> dave@demo.com  / password123");
}

run().catch((err) => {
  console.error("Database init failed:", err.message);
  process.exit(1);
});
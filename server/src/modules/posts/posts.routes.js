const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const controller = require("./posts.controller");
const likesController = require("../likes/likes.controller");
const commentsController = require("../comments/comments.controller");

router.get("/feed", auth, controller.feed);
router.get("/", auth, controller.feed);
router.post("/", auth, controller.create);

// likes: /api/posts/:id/likes...
router.use("/:id/likes", auth, require("../likes/likes.routes"));
// comments: /api/posts/:id/comments...
router.use("/:id/comments", auth, require("../comments/comments.routes"));

router.get("/user/:id", auth, controller.byUser);
router.get("/:id", auth, controller.detail);
router.patch("/:id", auth, controller.update);
router.delete("/:id", auth, controller.remove);

module.exports = router;
const router = require("express").Router();
const auth = require("../middleware/auth");
const commentsController = require("../modules/comments/comments.controller");

router.use("/auth", require("../modules/auth/auth.routes"));
router.use("/users", require("../modules/users/users.routes"));
router.use("/posts", require("../modules/posts/posts.routes"));
router.use("/friendships", require("../modules/friendships/friendships.routes"));
router.use("/messages", require("../modules/messages/messages.routes"));
router.use("/notifications", require("../modules/notifications/notifications.routes"));
router.use("/search", require("../modules/search/search.routes"));
router.use("/admin", require("../modules/admin/admin.routes"));
router.use("/reports", require("../modules/reports/reports.routes"));

// standalone comment moderation (owned by the commenter)
router.patch("/comments/:id", auth, commentsController.update);
router.delete("/comments/:id", auth, commentsController.remove);

module.exports = router;
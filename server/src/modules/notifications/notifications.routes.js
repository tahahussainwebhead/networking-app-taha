const router = require("express").Router();
const auth = require("../../middleware/auth");
const controller = require("./notifications.controller");

router.get("/", auth, controller.list);
router.get("/unread-count", auth, controller.unreadCount);
router.patch("/read-all", auth, controller.markAllRead);

module.exports = router;
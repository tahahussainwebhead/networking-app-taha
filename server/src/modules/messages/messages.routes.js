const router = require("express").Router();
const auth = require("../../middleware/auth");
const controller = require("./messages.controller");

router.get("/", auth, controller.conversations);
router.get("/:userId", auth, controller.list);
router.post("/:userId", auth, controller.send);

module.exports = router;
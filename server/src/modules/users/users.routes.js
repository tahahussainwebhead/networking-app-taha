const router = require("express").Router();
const auth = require("../../middleware/auth");
const controller = require("./users.controller");

router.get("/me", auth, controller.getMe);
router.patch("/me", auth, controller.updateMe);
router.get("/:id", auth, controller.getProfile);
router.get("/:id/:kind", auth, controller.connections);
router.post("/:id/follow", auth, controller.follow);
router.delete("/:id/follow", auth, controller.unfollow);

module.exports = router;
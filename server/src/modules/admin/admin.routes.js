const router = require("express").Router();
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");
const controller = require("./admin.controller");

router.use(auth, admin);

router.get("/stats", controller.stats);
router.get("/users", controller.users);
router.patch("/users/:id/role", controller.role);
router.patch("/users/:id/status", controller.status);
router.get("/posts", controller.posts);
router.delete("/posts/:id", controller.deletePost);

module.exports = router;
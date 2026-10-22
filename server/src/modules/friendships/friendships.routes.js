const router = require("express").Router();
const auth = require("../../middleware/auth");
const controller = require("./friendships.controller");

router.get("/", auth, controller.friends);
router.get("/requests", auth, controller.incoming);
router.get("/requests/outgoing", auth, controller.outgoing);
router.post("/:id/accept", auth, controller.accept);
router.delete("/:id", auth, controller.reject);

module.exports = router;
const router = require("express").Router({ mergeParams: true });
const controller = require("./comments.controller");

router.get("/", controller.list);
router.post("/", controller.create);

module.exports = router;
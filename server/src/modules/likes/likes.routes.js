const router = require("express").Router({ mergeParams: true });
const controller = require("./likes.controller");

router.get("/", controller.list);
router.post("/", controller.toggle);

module.exports = router;
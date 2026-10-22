const router = require("express").Router();
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");
const controller = require("./reports.controller");

router.use(auth, admin);

router.get("/", controller.overview);
router.get("/activity", controller.activity);
router.get("/top-active", controller.topActive);

module.exports = router;
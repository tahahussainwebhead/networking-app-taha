const router = require("express").Router();
const auth = require("../../middleware/auth");
const controller = require("./search.controller");

router.get("/", auth, controller.search);

module.exports = router;
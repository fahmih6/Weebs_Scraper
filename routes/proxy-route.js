const router = require("express").Router();
const localProxy = require("../services/local-proxy.js");

router.get("/", (req, res) => localProxy.stream(req, res));

module.exports = router;

const router = require("express").Router();

const animeService = require("../services/dorama-service.js");

router.get("/", (req, res) => animeService.getDorama(req, res));

module.exports = router;

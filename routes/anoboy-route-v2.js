const router = require("express").Router();

const animeService = require("../services/anoboy-service-v2.js");

router.get("/", (req, res) => animeService.getLatestAnimeV2(req, res));
router.get("/:param", (req, res) => animeService.getAnimeByParamV2(req, res));

module.exports = router;

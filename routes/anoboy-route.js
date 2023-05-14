const router = require("express").Router();

const animeService = require("../services/anoboy-service.js");

router.get("/", (req, res) => animeService.getLatestAnime(req, res));
router.get("/:param", (req, res) => animeService.getAnimeByParam(req, res));

module.exports = router;

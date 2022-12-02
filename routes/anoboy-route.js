const router = require("express").Router();

const animeService = require("../services/anoboy-service.js");

router.get("/", (req, res) => animeService.getLatestAnime(req, res));
router.get("/v2", (req, res) => animeService.getLatestAnimeV2(req, res));
router.get("/v2/:param", (req, res) =>
  animeService.getAnimeByParamV2(req, res)
);
router.get("/:param", (req, res) => animeService.getAnimeByParam(req, res));
router.post("/video-direct-link", (req, res) =>
  animeService.getAnimeDirectLinks(req, res)
);
// router.get("/ayaya/dorama", (req, res) => animeService.getDorama(req, res));

module.exports = router;
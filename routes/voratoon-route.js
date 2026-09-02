const router = require("express").Router();

const voratoonService = require("../services/voratoon-service.js");

router.get("/", (req, res) => voratoonService.getLatestManga(req, res));
router.get("/:param", (req, res) => voratoonService.getMangaByParam(req, res));
router.get("/chapter/:param/:chapter", (req, res) =>
  voratoonService.getMangaChapterByParam(req, res)
);

module.exports = router;

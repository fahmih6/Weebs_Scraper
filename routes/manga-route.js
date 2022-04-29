const router = require("express").Router();

const mangaService = require("../services/manga-service.js");

router.get("/", (req, res) => mangaService.getLatestManga(req, res));
router.get("/:param", (req, res) => mangaService.getMangaByParam(req, res));
router.get("/chapter/:param", (req, res) =>
  mangaService.getMangaChapterByParam(req, res)
);

module.exports = router;

const router = require("express").Router();

const komikuService = require("../services/komiku-service.js");

router.get("/", (req, res) => komikuService.getLatestManga(req, res));
router.get("/:param", (req, res) => komikuService.getMangaByParam(req, res));
router.get("/chapter/:param", (req, res) =>
  komikuService.getMangaChapterByParam(req, res)
);

module.exports = router;

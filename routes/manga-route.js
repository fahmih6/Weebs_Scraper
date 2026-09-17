const router = require("express").Router();

const mangaService = require("../services/manga-service-v2.js");

router.use((req, res, next) => {
  const apiKey = req.header("x-api-key");

  if (!process.env.API_KEY || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
});

router.get("/", (req, res) => mangaService.getLatestManga(req, res));
router.get("/:param", (req, res) => mangaService.getMangaByParam(req, res));
router.get("/chapter/:param/:chapter", (req, res) =>
  mangaService.getMangaChapterByParam(req, res),
);

module.exports = router;

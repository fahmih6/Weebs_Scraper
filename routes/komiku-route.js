const router = require("express").Router();

const komikuService = require("../services/komiku-service.js");

router.use((req, res, next) => {
  const apiKey = req.header("x-api-key");

  if (!process.env.API_KEY || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
});

router.get("/", (req, res) => komikuService.getLatestManga(req, res));
router.post("/", (req, res) => komikuService.getMangaByParamBatch(req, res));
router.get("/:param", (req, res) => komikuService.getMangaByParam(req, res));
router.get("/chapter/:param", (req, res) =>
  komikuService.getMangaChapterByParam(req, res)
);

module.exports = router;

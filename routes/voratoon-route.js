const router = require("express").Router();

const voratoonService = require("../services/voratoon-service.js");

router.use((req, res, next) => {
  const apiKey = req.header("x-api-key");

  if (!process.env.API_KEY || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
});

router.get("/", (req, res) => voratoonService.getLatestManga(req, res));
router.get("/:param", (req, res) => voratoonService.getMangaByParam(req, res));
router.get("/chapter/:param/:chapter", (req, res) =>
  voratoonService.getMangaChapterByParam(req, res)
);

module.exports = router;

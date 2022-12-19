const router = require("express").Router();

const doramaService = require("../services/dorama-service.js");

router.get("/", (req, res) => doramaService.getDorama(req, res));
router.get("/:param", (req, res) => doramaService.getDoramaDetail(req, res));
router.post("/get-video-link", (req, res) =>
  doramaService.getVideoLink(req, res)
);

module.exports = router;

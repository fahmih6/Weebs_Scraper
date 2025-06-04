const latestAnimeParser = require("./anoboy/latest_anime_parser.js");
const animeByParamParser = require("./anoboy/anime_by_param_parser.js");

module.exports.getLatestAnime = async (req, res) => {
  const page = req.query.page || 1;
  const keyword = req.query.s;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  /// Parse latest anime crawler
  let jsonResult = await latestAnimeParser.parseLatestAnime(keyword, url, page);

  /// Return the result
  return res.json(jsonResult);
};

module.exports.getAnimeByParam = async (req, res) => {
  const { param } = req.params;
  let tempParam = param.replace(/~/gi, "/");
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  /// JSON Result
  let jsonResult = await animeByParamParser.parseAnimeByParam(tempParam, url);

  return res.json(jsonResult);
};

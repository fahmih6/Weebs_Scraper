const latestAnimeParser = require("./anoboy/latest_anime_parser.js");
const animeByParamParser = require("./anoboy/anime_by_param_parser.js");
const cache = require("../helper/cache-helper.js");

module.exports.getLatestAnime = async (req, res) => {
  const page = req.query.page || 1;
  const keyword = req.query.s;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  const cacheKey = `latest-${keyword || "all"}-${page}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  /// Parse latest anime crawler
  let jsonResult = await latestAnimeParser.parseLatestAnime(keyword, url, page);

  /// Cache result for 1 day
  cache.set(cacheKey, jsonResult, 300000);

  /// Return the result
  return res.json(jsonResult);
};

module.exports.getAnimeByParam = async (req, res) => {
  const { param } = req.params;
  let tempParam = param.replace(/~/gi, "/");
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  const cacheKey = `anime-${tempParam}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  /// JSON Result
  let jsonResult = await animeByParamParser.parseAnimeByParam(tempParam, url);

  /// Cache result for 1 day
  cache.set(cacheKey, jsonResult, 86400000);

  return res.json(jsonResult);
};

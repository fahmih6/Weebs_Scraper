// @ts-nocheck
const Crawler = require("crawler");
const arrayHelper = require("../helper/array-helper.js");
const anoboyHelper = require("../helper/anoboy_helpers/anoboy_archive_helper.js");
const cheerio = require("cheerio");
const { default: axios } = require("axios");
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
  let jsonResult = await animeByParamParser.parseAnimeByParam(
    tempParam,
    url,
    res
  );

  return res.json(jsonResult);
};

/**  Parse anime direct links */
parseAnimeMirrorDirectLinks = async (link) => {
  /// Get the data
  const { data } = await axios.get(link, {
    proxy: false,
  });

  // Load HTML we fetched in the previous line
  const $ = cheerio.load(data);

  /// Get the script data
  const scriptData = $("script").eq(4).text();

  /// Parse the link
  link = anoboyHelper.parseAnoboyArchiveVideoLink(scriptData);

  /// Return the link
  return link;
};

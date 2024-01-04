// @ts-nocheck
const { default: axios } = require("axios");
const cheerio = require("cheerio");
const arrayHelper = require("../../helper/array-helper.js");
const bloggerHelper = require("../../helper/anoboy_helpers/anoboy_blogger_helper.js");
const AnoboyEmbedLinkHelper = require("../../helper/anoboy_helpers/anoboy_video_link_helper.js");
const AnoboyEpisodesHelper = require("../../helper/anoboy_helpers/anoboy_episodes_helper.js");
const AnoboyDownloadLinkHelper = require("../../helper/anoboy_helpers/anoboy_download_link_helper.js");
async function parseAnimeByParam(tempParam, url) {
  /// Json Result
  let jsonResult = {};

  try {
    /// Get URL
    const { data } = await axios.get(
      `${process.env.ANOBOY_LINK}/${tempParam}`,
      {
        proxy: false,
      }
    );

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    // Embed Links
    let embedLinks = await AnoboyEmbedLinkHelper.getVideoLinks(data);

    // Episode Links
    let episodeLinks = await AnoboyEpisodesHelper.getAllEpisodes(data, url);

    // Video Links
    var videoLinks =
      embedLinks.blogger.length > 1
        ? embedLinks.blogger
        : embedLinks.yup.length > 1
        ? embedLinks.yup
        : embedLinks.archiveEmbedLinks;
    // Download Links
    let downloadLinks = await AnoboyDownloadLinkHelper.getDownloadLink(data);

    // Name
    let name = $(".entry-content").find(".entry-title").text();

    // Synopsis
    let sinopsis = $(".contentdeks").text().trim();

    // Thumbnail
    let thumbnail = $(".entry-content").find("amp-img").attr("src");

    // Episode Navigation
    let episodeNavigation = [];
    let navigation = $(".column-three-fourth")
      .find("#navigasi")
      .find(".widget-title")
      .find("a");

    /// Loop through all navigation items
    navigation.each((i, el) => {
      let link = $(el).attr("href");
      let episodeName = $(el).attr("title");

      if (link != undefined) {
        let paramArray = link.split("/");
        paramArray = arrayHelper.removeAllItemFrom(paramArray, 2);

        // Param
        let param = paramArray.join("~");

        // Push to Navigation links array
        episodeNavigation.push({
          nav_name: episodeName,
          nav_link: `${url}/${param}`,
        });
      }
    });

    // Return the json data
    jsonResult = {
      data: {
        name: name,
        synopsis: sinopsis,
        thumbnail: `${process.env.ANOBOY_LINK}${thumbnail}`,
        episode_navigation:
          episodeLinks.length > 1 ? episodeLinks : episodeNavigation,
        video_embed_links: videoLinks,
      },
    };

    // Add Mirror links if available
    if (
      embedLinks.yup.length > 1 &&
      !arrayHelper.areEqual(videoLinks, embedLinks.yup)
    ) {
      jsonResult["data"]["video_mirrors"] = embedLinks.yup;
    }

    // Add Direct Links
    if (embedLinks.yupDirectLinks.length > 1) {
      jsonResult["data"]["video_direct_links"] = embedLinks.yupDirectLinks;
    }

    // Add Download Links
    if (downloadLinks.length > 0) {
      jsonResult["data"]["download_links"] = downloadLinks;
    }
  } catch (err) {
    /// Return error json data
    jsonResult = {
      data: {},
      error: {
        error: err.message ?? "Unknown Error",
      },
    };
  }

  /// return json Result
  return jsonResult;
}

module.exports = { parseAnimeByParam };

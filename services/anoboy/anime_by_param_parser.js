// @ts-nocheck
const http = require("../../helper/http-helper.js");
const cheerio = require("cheerio");
const arrayHelper = require("../../helper/array-helper.js");
const bloggerHelper = require("../../helper/anoboy_helpers/anoboy_blogger_helper.js");
const AnoboyEmbedLinkHelper = require("../../helper/anoboy_helpers/anoboy_video_link_helper.js");
const AnoboyEpisodesHelper = require("../../helper/anoboy_helpers/anoboy_episodes_helper.js");
const {
  wrapWithCorsProxy,
  wrapVideoLinksWithCorsProxy,
} = require("../../helper/url-helper.js");

async function parseAnimeByParam(tempParam, url) {
  /// Json Result
  let jsonResult = {};

  try {
    /// Get URL
    const { data } = await http.get(`${process.env.ANOBOY_LINK}/${tempParam}`);

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    // Fetch Embed Links and Episode Links in parallel
    const [embedLinks, episodeLinks] = await Promise.all([
      AnoboyEmbedLinkHelper.getVideoLinks($),
      tempParam.toLowerCase().includes("episode")
        ? AnoboyEpisodesHelper.getAllEpisodes($, url)
        : AnoboyEpisodesHelper.getEpisodesFromTitleOnly($, url),
    ]);

    // Video Links
    var videoLinks =
      embedLinks.blogger.length > 1
        ? embedLinks.blogger
        : embedLinks.yup.length > 1
        ? embedLinks.yup
        : embedLinks.archiveEmbedLinks;

    // Name
    let name = $(".entry-content").find(".entry-title").text();

    // Synopsis
    let sinopsis = "";
    if (tempParam.toLowerCase().includes("episode")) {
      sinopsis = $(".contentdeks").text().trim();
    } else {
      sinopsis = $("div.unduhan")
        .first()
        .text()
        .replace(/\n/g, " ") // Replace newlines with spaces
        .replace(/\s+/g, " ") // Collapse multiple spaces
        .trim();
    }

    // Image Thumbnail Tag
    const thumbnailTag = $(".entry-content").find("img, amp-img");

    // Search for possible image thumbnail attributes
    let thumbnail =
      thumbnailTag.attr("src") ||
      thumbnailTag.attr("data-src") ||
      thumbnailTag.attr("data-i-src") ||
      thumbnailTag.attr("srcset")?.split(" ")[0] ||
      null;

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
        thumbnail: wrapWithCorsProxy(
          `${process.env.ANOBOY_LINK}${thumbnail}`,
          url
        ),
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

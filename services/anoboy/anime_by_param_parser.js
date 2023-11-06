// @ts-nocheck
const { default: axios } = require("axios");
const cheerio = require("cheerio");
const arrayHelper = require("../../helper/array-helper.js");
const bloggerHelper = require("../../helper/anoboy_helpers/anoboy_blogger_helper.js");

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

    // Video Links
    var videoLinks = [];

    // Mirrors
    var mirrors = [];

    // Main links
    var mainLink = $("#mediaplayer").attr("src");

    /// Push Default Resolution
    videoLinks.push({
      resolution: "360p",
      link: mainLink,
    });

    // Main Link but 720p
    $(".vmiror")
      .eq(0)
      .find("a")
      .each((i, el) => {
        let mirrorURL = $(el).data("video");

        if ($(el).text().includes("720") && !mirrorURL.includes("token=none")) {
          videoLinks.push({
            resolution: "720p",
            link: mirrorURL,
          });
        }
      });

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
        episode_navigation: episodeNavigation,
        video_embed_links: videoLinks,
      },
    };
  } catch (err) {
    /// Return error json data
    jsonResult = {
      data: {},
      error: {
        error: err ?? "Unknown Error",
      },
    };
  }

  /// return json Result
  return jsonResult;
}

/// Get Your Upload Mirror Embed Links
async function getYUPEmbedLinks(url) {
  /// Json Result
  let jsonResult = [];

  try {
    /// Get URL
    const { data } = await axios.get(url, {
      proxy: false,
    });

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    /// Get the link elements
    const linkElements = $(".link");

    for (let index = 0; index < linkElements.length; index++) {
      const element = linkElements[index];
      /// Link
      const link = $(element).attr("href");
      /// Resolution
      const resolution = $(element).text().trim();

      /// Resolution + Link Map
      const resLinkMap = {
        resolution: resolution,
        link: link,
      };

      jsonResult.push(resLinkMap);
    }

    return jsonResult;
  } catch (err) {
    jsonResult = [{ error: err ?? "Unknown Error" }];
    return jsonResult;
  }
}

/// Get YUP Direct Link
async function getYUPDirectLink(resolution, url) {
  /// Json Result
  let jsonResult = {};

  try {
    /// Get URL
    const { data } = await axios.get(url, {
      proxy: false,
    });

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    /// Link
    const link = $('[property="og:video"]').attr("content");

    /// append the link
    jsonResult = {
      resolution: resolution,
      link: link,
      headers: { Referer: "https://www.yourupload.com/" },
    };

    /// Return
    return jsonResult;
  } catch (err) {
    jsonResult = { error: err ?? "Unknown Error" };
    return jsonResult;
  }
}

module.exports = { parseAnimeByParam };

// @ts-nocheck
const { default: axios } = require("axios");
const cheerio = require("cheerio");
const arrayHelper = require("../../helper/array-helper.js");

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

    if (mainLink?.includes("/uploads")) {
      videoLinks.push({
        resolution: "480p",
        link: `${process.env.ANOBOY_LINK}${mainLink}`,
      });
    } else {
      videoLinks.push({
        resolution: "360p",
        link: mainLink,
      });
    }

    const mirrorCount = $(".vmiror").length;

    if (mirrorCount >= 1) {
      // Main Link but 720p
      $(".vmiror")
        .eq(0)
        .find("a")
        .each((i, el) => {
          let mirrorURL = $(el).data("video");

          if (
            $(el).text().includes("720") &&
            !mirrorURL.includes("token=none")
          ) {
            if (mirrorURL?.includes("/uploads")) {
              videoLinks.push({
                resolution: "720p",
                link: `${process.env.ANOBOY_LINK}${mirrorURL}`,
              });
            } else {
              videoLinks.push({
                resolution: "720p",
                link: mirrorURL,
              });
            }
          }
        });

      /// Mirror link
      var mirrorLink = "";

      // Use mirrors
      $(".vmiror")
        .last()
        .find("a")
        .each((i, el) => {
          let mirrorURL = $(el).data("video");

          // Excludes all non-available resolutions
          if (!mirrorURL.includes("data=none")) {
            mirrorLink = `${process.env.ANOBOY_LINK}${mirrorURL}`;
          }
        });
    }

    /// Get YUP Embed Links
    mirrors = await getYUPEmbedLinks(mirrorLink);

    // Name
    let name = $(".entry-content").find(".entry-title").text();

    // Synopsis
    let sinopsis = $(".contentdeks").text().trim();

    // Episode Navigation
    let episodeNavigation = [];
    let navigation = $(".column-three-fourth")
      .find("#navigasi")
      .find(".widget-title")
      .find("a");
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

    /// Mirrors direct link
    let mirrorsDirectLink = [];

    /// Direct link promises
    let directLinkPromises = [];

    /// Loop through all mirrors
    for (let index = 0; index < mirrors.length; index++) {
      const element = mirrors[index];
      if (element.link.includes("yourupload.com")) {
        directLinkPromises.push(
          getYUPDirectLink(element.resolution, element.link)
        );
      }
    }

    /// Direct links
    mirrorsDirectLink = await Promise.all(directLinkPromises);

    // Return the json data
    jsonResult = {
      data: {
        name: name,
        synopsis: sinopsis,
        episode_navigation: episodeNavigation,
        video_embed_links: videoLinks,
        video_mirrors: mirrors,
        video_mirrors_direct_link: mirrorsDirectLink,
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

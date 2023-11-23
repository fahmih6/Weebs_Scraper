const { default: axios } = require("axios");
const cheerio = require("cheerio");

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
        resolution: resolution + "P",
        link: link,
      };

      jsonResult.push(resLinkMap);
    }

    return jsonResult;
  } catch (err) {
    jsonResult = [];
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
    jsonResult = { error: err.message ?? "Unknown Error" };
    return jsonResult;
  }
}

module.exports = { getYUPEmbedLinks, getYUPDirectLink };

const { default: axios } = require("axios");
const cheerio = require("cheerio");

/**
 * Get Anoboy Blogger Direct Link
 */
async function getAnoboyBloggerDirectLink(resolution, url) {
  /// Json Result
  let jsonResult = {};

  try {
    /// Get all the urls

    /// Get URL
    const { data } = await axios.get(url, {
      proxy: false,
    });

    console.log(data);

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    /// Get the link elements
    const htmlScripts = $("script");

    /// Script Text
    const scriptText = htmlScripts.eq(0).text();

    /// Video Config Body
    const videoConfigBody = scriptText
      .trim()
      .replace("var VIDEO_CONFIG = ", "");

    /// Video Config Json
    const videoConfigJson = JSON.parse(videoConfigBody);

    /// Play URL
    const playUrl = videoConfigJson.streams.pop().play_url;

    jsonResult = {
      resolution: resolution,
      link: playUrl,
    };

    console.log(playUrl);

    return jsonResult;
  } catch (err) {
    jsonResult = [{ error: err ?? "Unknown Error" }];
    return jsonResult;
  }
}

module.exports = { getAnoboyBloggerDirectLink };

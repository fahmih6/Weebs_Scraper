const { default: axios } = require("axios");
const cheerio = require("cheerio");

/**
 * Get Anoboy Blogger Direct Link
 */
async function getAnoboyBloggerDirectLink(resolution, url) {
  /// Json Result
  let jsonResult = {};

  try {
    /// Headers
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    };

    /// Get URL
    const { data } = await axios.get(url, {
      proxy: false,
      headers: headers,
    });

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
      headers: headers,
      resolution: resolution,
      link: playUrl,
    };

    return jsonResult;
  } catch (err) {
    jsonResult = [{ error: err ?? "Unknown Error" }];
    return jsonResult;
  }
}

/**
 * Get All Blogger Direct Link
 */
async function getBatchBloggerDirectLink(bloggerLinks) {
  /// Direct Link promises
  const directLinkPromises = [];

  /// Get the direct link promises
  for (let index = 0; index < bloggerLinks.length; index++) {
    const element = bloggerLinks[index];
    directLinkPromises.push(
      getAnoboyBloggerDirectLink(element.resolution, element.link)
    );
  }

  /// Run the promises
  const videoDirectLinks = await Promise.all(directLinkPromises);

  /// Video Direct Links
  return videoDirectLinks;
}

module.exports = { getAnoboyBloggerDirectLink, getBatchBloggerDirectLink };

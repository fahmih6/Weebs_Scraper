const { default: axios } = require("axios");
const cheerio = require("cheerio");

/**
 *
 * @param {String} url
 */
async function getBloggerEmbedLink(url) {
  /// Blogger placeholder
  let bloggerPlaceholder = "https://www.blogger.com/video.g?token=";

  /// Json Result
  let jsonResult = [];

  try {
    /// Get URL
    const { data } = await axios.get(url, {
      proxy: false,
    });

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    const link = $("#mediaplayer").attr("src");

    const res = url.split(".php")[0].split("adsbatch")[1];

    /// Get the link elements
    // const linkElements = $(".link");

    // for (let index = 0; index < linkElements.length; index++) {
    //   const element = linkElements[index];

    //   /// Link
    //   const link = $(element).attr("href")?.split("?url=")[1];

    //   /// Resolution
    //   const resolution = $(element).text().trim();

    //   /// Resolution + Link Map
    //   const resLinkMap = {
    //     resolution: resolution + "P",
    //     link: `${bloggerPlaceholder}${link}`,
    //   };

    //   jsonResult.push(resLinkMap);
    // }

    jsonResult.push({
      resolution: res + "P",
      link: link,
    });

    return jsonResult;
  } catch (err) {
    jsonResult = [];
    return jsonResult;
  }
}

/**
 * Get Anoboy Blogger Direct Link
 */
async function getAnoboyBloggerDirectLink(resolution, url) {
  let jsonResult = {};

  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    const tokenMatch = url.match(/[?&]token=([\w-]+)/);
    const tokenId = tokenMatch ? tokenMatch[1] : null;
    if (!tokenId) {
      throw new Error("Blogger token not found in URL");
    }

    /// Get URL
    const { data: html } = await axios.get(url, {
      proxy: false,
      headers: headers,
    });

    const wizMatch = html.match(/window\.WIZ_global_data\s*=\s*(\{[\s\S]*?\});/);
    if (!wizMatch) {
      throw new Error("Failed to find WIZ_global_data");
    }

    const wizData = JSON.parse(wizMatch[1]);
    const f_sid = wizData.FdrFJe;
    const bl = wizData.cfb2h;

    const rpcId = 'WcwnYd';
    const innerPayload = JSON.stringify([tokenId, null, 0]);
    const f_req = JSON.stringify([[[rpcId, innerPayload, null, 'generic']]]);

    const dataPayload = new URLSearchParams();
    dataPayload.append('f.req', f_req);

    const postUrl = `https://www.blogger.com/_/BloggerVideoPlayerUi/data/batchexecute?bl=${bl}&f.sid=${f_sid}&rpcids=${rpcId}`;

    const postResponse = await axios.post(postUrl, dataPayload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': headers['User-Agent'],
      }
    });

    const responseText = postResponse.data;
    const lines = responseText.split('\n');
    let playUrl = null;

    for (let line of lines) {
      line = line.trim();
      if (!line.startsWith('[')) continue;

      try {
        const parsedLine = JSON.parse(line);
        const element = parsedLine.find(el => Array.isArray(el) && el[0] === 'wrb.fr' && el[1] === rpcId);
        if (element && element[2]) {
          const payloadData = JSON.parse(element[2]);
          const streams = payloadData[2];
          if (streams && streams.length > 0) {
            let selectedStream = null;
            
            const itagMap = {
              '7': '240P',
              '18': '360P',
              '22': '720P',
              '37': '1080P',
            };
            
            for (const stream of streams) {
              if (Array.isArray(stream) && stream[0] && stream[0].startsWith('http')) {
                if (!selectedStream) selectedStream = stream[0];
                const itagMatch = stream[0].match(/[&?]itag=(\d+)/);
                const itag = itagMatch ? itagMatch[1] : null;
                const streamRes = itagMap[itag];
                if (streamRes && resolution.toLowerCase().includes(streamRes.toLowerCase())) {
                  selectedStream = stream[0];
                  break;
                }
              }
            }
            
            if (selectedStream) {
              playUrl = selectedStream;
              break;
            }
          }
        }
      } catch (e) {
        // Skip parsing errors
      }
    }

    if (!playUrl) {
      throw new Error("No play URL found in batchexecute response");
    }

    jsonResult = {
      headers: headers,
      resolution: resolution,
      link: playUrl,
    };

    return jsonResult;
  } catch (err) {
    jsonResult = { error: err.message ?? "Unknown Error" };
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

module.exports = {
  getAnoboyBloggerDirectLink,
  getBatchBloggerDirectLink,
  getBloggerEmbedLink,
};

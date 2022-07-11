const Crawler = require("crawler");
const puppeteer = require("puppeteer");
const arrayHelper = require("../helper/array-helper.js");

// module.exports.getDorama = async (req, res) => {
//   var c = new Crawler({
//     // This will be called for each crawled page
//     callback: (error, result, done) => {
//       if (error) {
//         console.log(error);

//         res.json({
//           error: error.message,
//         });
//       } else {
//         var $ = result.$;

//         var list = [];

//         $(".ep")
//           .find(".linkstream")
//           .each((i, el) => {
//             let map = {};

//             const text = $(el).find("h4").text();
//             const link = $(el).find("a").attr("link");

//             map[text] = link;

//             list.push(map);
//           });

//         res.json({
//           episodes: list,
//         });
//       }

//       done();
//     },
//   });

//   c.queue(
//     "https://dorama.doramaindo.ai/ase-to-sekken-2022-subtitle-indonesia.html"
//   );
// };

module.exports.getLatestAnime = async (req, res) => {
  const page = req.query.page || 1;
  const keyword = req.query.s;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  var c = new Crawler({
    rateLimit: 1000,
    // This will be called for each crawled page
    callback: function (error, result, done) {
      const animeList = [];
      if (error) {
        console.log(error);
        res.json({ error: error.message });
      } else {
        var $ = result.$;

        // Anime grid
        let animeGrid = $(".home_index a");

        // If search is used, then use different class
        if (keyword) {
          animeGrid = $(".column-content a");
        }

        // Loop through all anime grid
        animeGrid.each((i, el) => {
          // Select only links that is not halaman
          if (
            $(el).attr("title") != undefined &&
            !$(el).attr("title").toLowerCase().includes("halaman") &&
            $(el).parents("#jadwal").text() == ""
          ) {
            // Title
            let title = $(el).attr("title");

            let paramArray = $(el).attr("href").split("/");
            paramArray = arrayHelper.removeAllItemFrom(paramArray, 2);

            // Param
            let param = paramArray.join("~");

            // Image
            let image = $(el).find("amp-img").attr("src");

            // Upload time
            let uploadTime = $(el).find(".jamup").text();

            animeList.push({
              title: title,
              param: param,
              thumbnail: image,
              upload_time: uploadTime,
              detail_url: `${url}/${param}`,
            });
          }
        });

        // Page
        let pageString = $(".wp-pagenavi")
          .find(".pages")
          .text()
          .replace(`Halaman ${page} dari `, "");
        let maxPageTemp = parseInt(pageString);
        let maxPage = isNaN(maxPageTemp) ? 1 : maxPageTemp;
        let nextPage = parseInt(page) < maxPage ? parseInt(page) + 1 : null;
        let prevPage =
          parseInt(page) <= maxPage && parseInt(page) > 1
            ? parseInt(page) - 1
            : null;

        return res.json({
          max_page: isNaN(maxPage) ? 1 : maxPage,
          next_page:
            nextPage == null
              ? null
              : keyword
              ? `${url}?s=${keyword}&page=${nextPage}`
              : `${url}?page=${nextPage}`,
          prev_page:
            prevPage == null
              ? null
              : keyword
              ? `${url}?s=${keyword}&page=${prevPage}`
              : `${url}?page=${prevPage}`,
          data: animeList,
        });
      }
      done();
    },
  });

  if (keyword) {
    c.queue(`${process.env.ANOBOY_LINK}/page/${page}/?s=${keyword}`);
  } else {
    c.queue(`${process.env.ANOBOY_LINK}/page/${page}/`);
  }
};

module.exports.getAnimeByParam = async (req, res) => {
  const { param } = req.params;
  let tempParam = param.replace(/~/gi, "/");
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  const c = new Crawler({
    maxConnections: 16,
    // This will be called for each crawled page
    callback: (error, result, done) => {
      if (error) {
        console.log(error);

        res.json({
          error: error.message,
        });
      } else {
        const $ = result.$;

        // Video Links
        var videoLinks = [];

        // Mirrors
        var mirrors = [];

        // Main links
        var mainLink = $("#mediaplayer").attr("src");

        if (mainLink?.includes("/uploads")) {
          videoLinks.push({
            "480P": `${process.env.ANOBOY_LINK}${mainLink}`,
          });
        } else {
          videoLinks.push({
            "360P": mainLink,
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
                    "720P": `${process.env.ANOBOY_LINK}${mirrorURL}`,
                  });
                } else {
                  videoLinks.push({
                    "720P": mirrorURL,
                  });
                }
              }
            });

          // Use mirrors
          $(".vmiror")
            .eq(1)
            .find("a")
            .each((i, el) => {
              let mirrorURL = $(el).data("video");
              let reso = $(el).text();

              // Excludes all non-available resolutions
              if (!mirrorURL.includes("data=none")) {
                // Create a new map
                let mirrorMap = {};
                mirrorMap[reso] = `${process.env.ANOBOY_LINK}${mirrorURL}`;
                mirrors.push(mirrorMap);
              }
            });
        }

        // Name
        let name = $(".entry-content").find(".entry-title").text();

        // Synopsis
        let sinopsis = $(".contentdeks").text();

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

        // Return the json data
        res.json({
          data: {
            name: name,
            synopsis: sinopsis,
            episode_navigation: episodeNavigation,
            video_embed_links: videoLinks,
            video_mirrors: mirrors,
            message: `Main Link can only be opened via webview, while the others (resolution based) can be parsed using ${url}/video-direct-link`,
          },
        });
      }

      done();
    },
  });

  c.queue(`${process.env.ANOBOY_LINK}/${tempParam}`);
};

module.exports.getAnimeDirectLinks = async (req, res) => {
  const body = req.body;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  if (body.hasOwnProperty("url")) {
    const options = {
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
      ignoreDefaultArgs: ["--disable-extensions"],
    };

    try {
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(60000);
      // Go to URLs
      await page.goto(body["url"]);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Click the page
      page.click(".jw-video");

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      /// Evaluate
      let link = await page.evaluate(`$(".jw-video").attr("src")`);

      // Close the browser
      await browser.close();

      // If link is found, then return it.
      if (link != undefined) {
        return res.json({
          link: link,
        });
      } else {
        return res.json({
          error: "Error getting link, please try again.",
        });
      }
    } catch (error) {
      return res.json({
        error: error,
      });
    }
  } else {
    return res.json({
      error: "URL is not specified, cannot find video data.",
    });
  }
};

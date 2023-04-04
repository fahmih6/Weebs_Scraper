// @ts-nocheck
const Crawler = require("crawler");
const puppeteer = require("puppeteer");
const arrayHelper = require("../helper/array-helper.js");
const PuppeteerSingleton = require("../helper/puppeteer_singleton..js");

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
            !$(el).attr("title").toLowerCase().includes("page") &&
            $(el).parents("#jadwal").text() == ""
          ) {
            // Title
            let title = $(el).attr("title");

            let paramArray = $(el).attr("href").split("/");
            paramArray = arrayHelper.removeAllItemFrom(paramArray, 2);

            // Param
            let param = paramArray.join("~");

            // Image
            let image =
              `${process.env.ANOBOY_LINK}` + $(el).find("amp-img").attr("src");

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
          .find(".page")
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
    if (page == 1) {
      c.queue(`${process.env.ANOBOY_LINK}/?s=${keyword}`);
    } else {
      c.queue(`${process.env.ANOBOY_LINK}/page/${page}/?s=${keyword}`);
    }
  } else {
    if (page == 1) {
      c.queue(`${process.env.ANOBOY_LINK}/`);
    } else {
      c.queue(`${process.env.ANOBOY_LINK}/page/${page}/`);
    }
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
            resolution: "480P",
            link: `${process.env.ANOBOY_LINK}${mainLink}`,
          });
        } else {
          videoLinks.push({
            resolution: "360P",
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
                    resolution: "720P",
                    link: `${process.env.ANOBOY_LINK}${mirrorURL}`,
                  });
                } else {
                  videoLinks.push({
                    resolution: "720P",
                    link: mirrorURL,
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
                let mirrorMap = {
                  resolution: reso,
                  link: `${process.env.ANOBOY_LINK}${mirrorURL}`,
                };
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

  const browser = await PuppeteerSingleton.getBrowser();
  const page = await browser.newPage();

  if (body.hasOwnProperty("url")) {
    try {
      // Go to URLs
      await page.goto(body["url"], {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

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
  } else if (body.hasOwnProperty("urls")) {
    var results = [];

    for (let index = 0; index < body["urls"].length; index++) {
      const element = body["urls"][index];

      try {
        // Go to URLs
        await page.goto(element, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        /// Evaluate
        let link = await page.evaluate(`$(".jw-video").attr("src")`);

        // If link is found, then return it.
        if (link != undefined) {
          results.push(link);
        } else {
          results.push(link);
        }
      } catch (error) {
        return res.json({
          error: error,
        });
      }
    }

    // Close the tab
    await page.close();

    return res.json({
      links: results,
    });
  } else {
    return res.json({
      error: "URL is not specified, cannot find video data.",
    });
  }
};

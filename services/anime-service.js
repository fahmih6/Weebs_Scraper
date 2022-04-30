const Crawler = require("crawler");
const puppeteer = require("puppeteer");
const arrayHelper = require("../helper/array-helper.js");

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

        // Main links
        var mainLink = $("#mediaplayer").attr("src");
        videoLinks.push({
          main_link: mainLink,
        });

        const mirrorCount = $(".vmiror").length;

        if (mirrorCount >= 1) {
          // Use mirrors
          $(".vmiror")
            .eq(1)
            .find("a")
            .each((i, el) => {
              let mirrorURL = $(el).data("video");
              let reso = $(el).text();

              // Create a new map
              let mirrorMap = {};
              mirrorMap[reso] = `${process.env.ANOBOY_LINK}${mirrorURL}`;
              videoLinks.push(mirrorMap);
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

          episodeNavigation.push({ nav_name: episodeName, nav_link: link });
        });

        // Return the json data
        res.json({
          data: {
            name: name,
            synopsis: sinopsis,
            episode_navigation: episodeNavigation,
            video_embed_links: videoLinks,
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
      slowMo: 100,
    };
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
      res.json({
        link: link,
      });
    } else {
      res.json({
        error: "Error getting link, please try again.",
      });
    }
  } else {
    res.json({
      error: "URL is not specified, cannot find video data.",
    });
  }
};

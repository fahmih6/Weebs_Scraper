const Crawler = require("crawler");

module.exports.getLatestManga = async (req, res) => {
  const page = req.query.page || 1;
  const keyword = req.query.s;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  var c = new Crawler({
    rateLimit: 1000,
    maxConnections: 1,
    referer: "https://komikcast.com/",
    // This will be called for each crawled page
    callback: function (error, result, done) {
      const mangaList = [];
      if (error) {
        console.log(error);
        res.json(error);
      } else {
        var $ = result.$;

        const mangaCount = $(".list-update_items-wrapper").find(
          ".list-update_item"
        ).length;

        console.log(mangaCount);

        $(".list-update_items-wrapper")
          .find(".list-update_item")
          .each((i, el) => {
            const mangaTitle = $(el)
              .find(".list-update_item-info")
              .find(".title")
              .text();
            const mangaThumbnail = $(el)
              .find(".list-update_item-image")
              .find(".wp-post-image")
              .attr("data-cfsrc");
            const mangaParam = $(el).find("a").attr("href").split("/")[4];
            const mangaRating = $(el)
              .find(".list-update_item-info")
              .find(".rating")
              .find(".numscore")
              .text();

            mangaList.push({
              title: mangaTitle,
              thumbnail: mangaThumbnail,
              param: mangaParam,
              rating: mangaRating,
              detail_url: `${url}/${mangaParam}`,
            });
          });

        console.log(result.request.uri.href);

        return res.json({
          next_page: keyword
            ? mangaCount == 60
              ? `${url}?s=${keyword}&page=${parseInt(page) + 1}`
              : null
            : `${url}?page=${parseInt(page) + 1}`,
          prev_page:
            page == 1
              ? null
              : keyword
              ? `${url}?s=${keyword}&page=${parseInt(page) - 1}`
              : `${url}?page=${parseInt(page) - 1}`,
          data: mangaList,
        });
      }
      done();
    },
  });

  if (keyword) {
    c.queue(`https://komikcast.com/page/${page}/?s=${keyword}`);
  } else {
    c.queue(
      `https://komikcast.com/daftar-komik/page/${page}/?sortby=update&type=manga`
    );
  }
};

module.exports.getMangaByParam = async (req, res) => {
  const { param } = req.params;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  const c = new Crawler({
    maxConnections: 16,
    referer: "https://komikcast.com/",
    // This will be called for each crawled page
    callback: (error, result, done) => {
      if (error) {
        console.log(error);

        res.json({
          data: error.message,
        });
      } else {
        const $ = result.$;

        const mangaTitle = $(
          ".komik_info-content .komik_info-content-body .komik_info-content-body-title"
        ).text();
        const mangaThumbnail = $(
          ".komik_info-content .komik_info-content-thumbnail img"
        ).attr("src");
        const mangaMeta = {};
        const mangaGenre = [];
        const mangaSynopsis = $(
          ".komik_info-description .komik_info-description-sinopsis p"
        ).text();
        const mangaChapters = [];

        $(".komik_info-content-meta span").each((i, el) => {
          const metaKey = $(el)
            .text()
            .split(":")[0]
            .trim()
            .toLowerCase()
            .split(" ")
            .join("_");
          const metaVal = $(el).text().split(":")[1].trim().toLowerCase();

          mangaMeta[metaKey] = metaVal;
        });

        $(".komik_info-content-genre .genre-item").each((i, el) => {
          mangaGenre.push($(el).text());
        });

        $(".komik_info-chapters-wrapper li").each((i, el) => {
          const chapterNumber = $(el).find("a").text().replace("Chapter ", "");
          const chapterSlug = $(el).find("a").attr("href").split("/")[4];
          const chapterRelease = $(el).find(".chapter-link-time").text().trim();

          mangaChapters.push({
            chapter: chapterNumber,
            slug: chapterSlug,
            release: chapterRelease,
            detail_url: `${url}/chapter/${chapterSlug}`,
          });
        });

        res.json({
          data: {
            title: mangaTitle,
            thumbnail: mangaThumbnail,
            meta_info: mangaMeta,
            genre: mangaGenre,
            synopsis: mangaSynopsis,
            chapters: mangaChapters,
          },
        });
      }

      done();
    },
  });

  c.queue(`https://komikcast.com/manga/${param}`);
};

module.exports.getMangaChapterByParam = async (req, res) => {
  const { param } = req.params;
  const chapterImages = [];

  const c = new Crawler({
    maxConnections: 16,
    referer: "https://komikcast.com/",
    // This will be called for each crawled page
    callback: (error, result, done) => {
      if (error) {
        console.log(error);

        res.json({
          data: error.message,
        });
      } else {
        const $ = result.$;

        $(".main-reading-area img").each((i, el) => {
          const imageUrl = $(el).attr("src");

          if (imageUrl != undefined) {
            chapterImages.push(imageUrl);
          }
        });
      }

      res.json({
        data: chapterImages,
      });

      done();
    },
  });

  c.queue(`https://komikcast.com/chapter/${param}`);
};

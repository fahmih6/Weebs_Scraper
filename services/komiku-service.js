// @ts-nocheck
const Crawler = require("crawler");

module.exports.getLatestManga = async (req, res) => {
  const page = req.query.page || 1;
  const keyword = req.query.s;
  const tag = req.query.tag || "rekomendasi";
  const genre = req.query.genre;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  var c = new Crawler({
    rateLimit: 1000,
    maxConnections: 1,
    referer: "https://komiku.id/",
    // This will be called for each crawled page
    callback: function (error, result, done) {
      const mangaList = [];
      if (error) {
        console.log(error);
        res.json(error);
      } else {
        var $ = result.$;

        const mangaCount = $(".daftar").find(".bge").length;

        console.log(mangaCount);

        $(".daftar")
          .find(".bge")
          .each((i, el) => {
            const mangaTitle = $(el).find(".kan").find("h3").text();
            const mangaDescription = $(el).find(".kan").find("p").text();
            const mangaThumbnail = $(el).find(".bgei").find("img").data("src");
            let mangaParam = $(el)
              .find(".kan")
              .find("a")
              .eq(0)
              .attr("href")
              .split("/");
            const latestChapter = $(el)
              .find(".kan")
              .find(".new1")
              .last()
              .find("span")
              .last()
              .text();

            /// If genre exists, take the second index
            if (genre) {
              mangaParam = mangaParam[2];
            } else {
              mangaParam = mangaParam[4];
            }

            let trimmedTitle = mangaTitle;
            if (mangaTitle) {
              trimmedTitle = mangaTitle.trim();
            }

            let trimmedDescription = mangaDescription;
            if (mangaDescription) {
              trimmedDescription = mangaDescription.trim().replace("  ", " ");
            }

            mangaList.push({
              title: trimmedTitle,
              description: trimmedDescription,
              latest_chapter: latestChapter,
              thumbnail: mangaThumbnail.split("?")[0],
              param: mangaParam,
              detail_url: `${url}/${mangaParam}`,
            });
          });

        let prevLink = $(".loop-nav-inner").find(".prev").attr("href");
        let nextLink = $(".loop-nav-inner").find(".next").attr("href");

        let prev = "";
        let next = "";
        if (keyword) {
          if (prevLink != undefined && prevLink.includes("page")) {
            let pageKeyword = prevLink;
            pageKeyword = pageKeyword
              .replace("/page/", "")
              .replace("/?post_type=manga", "");

            prev = `${pageKeyword}`;
          } else {
            prev = `1&s=${keyword}`;
          }

          if (nextLink != undefined) {
            let pageKeyword = nextLink;
            pageKeyword = pageKeyword
              .replace("/page/", "")
              .replace("/?post_type=manga", "");

            next = `${pageKeyword}`;
          }
        }
        if (genre) {
          prev =
            prevLink != undefined
              ? prevLink
                  .replace("/genre/", "")
                  .replace(`${genre}`, "")
                  .replace("page/", "")
                  .replace("/", "")
                  .replace("/", "")
              : null;
          next =
            nextLink != undefined
              ? nextLink
                  .replace("/genre/", "")
                  .replace(`${genre}`, "")
                  .replace("page/", "")
                  .replace("/", "")
                  .replace("/", "")
              : null;

          next += `&genre=${genre}`;
          prev += `&genre=${genre}`;
        } else {
          prev =
            prevLink != undefined
              ? prevLink
                  .replace(`/${tag}/`, "")
                  .replace("other", "")
                  .replace("page/", "")
                  .replace("/", "")
              : null;
          next =
            nextLink != undefined
              ? nextLink
                  .replace(`/${tag}/`, "")
                  .replace("other", "")
                  .replace("page/", "")
                  .replace("/", "")
              : null;
        }

        console.log(result.request.uri.href);

        return res.json({
          next_page: nextLink != undefined ? `${url}?page=${next}` : null,
          prev_page: prevLink != undefined ? `${url}?page=${prev}` : null,
          data: mangaList,
        });
      }
      done();
    },
  });

  if (keyword) {
    if (page === 1) {
      c.queue(`https://data.komiku.id/cari/?post_type=manga&s=${keyword}`);
    } else {
      c.queue(
        `https://data.komiku.id/page/${page}/?post_type=manga&s=${keyword}`
      );
    }
  } else if (genre) {
    if (page === 1) {
      c.queue(`https://data.komiku.id/genre/${genre}`);
    } else {
      c.queue(`https://data.komiku.id/genre/${genre}/page/${page}`);
    }
  } else if (page === 1) {
    c.queue(`https://data.komiku.id/other/${tag}/`);
  } else {
    c.queue(`https://data.komiku.id/other/${tag}/page/${page}/`);
  }
};

module.exports.getMangaByParam = async (req, res) => {
  const { param } = req.params;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  const c = new Crawler({
    maxConnections: 16,
    referer: "https://komiku.id/",
    // This will be called for each crawled page
    callback: (error, result, done) => {
      if (error) {
        console.log(error);

        res.json({
          data: error.message,
        });
      } else {
        const $ = result.$;

        const mangaTitle = $("#Judul h1").text().trim();
        const mangaThumbnail = $(".ims img").attr("src");
        const mangaGenre = [];
        const mangaSynopsis = $("#Judul").find(".desc").text().trim();
        const mangaChapters = [];
        const mangaSimilar = [];

        $(".genre li a").each((i, el) => {
          mangaGenre.push($(el).text());
        });

        $("#Daftar_Chapter tbody tr").each((i, el) => {
          if (i > 0) {
            const chapterNumber = $(el).find(".judulseries").text().trim();
            const chapterSlug = $(el)
              .find(".judulseries")
              .find("a")
              .attr("href")
              .split("/")[2];
            const chapterRelease = $(el).find(".tanggalseries").text().trim();

            mangaChapters.push({
              chapter: chapterNumber,
              param: chapterSlug,
              release: chapterRelease,
              detail_url: `${url}/chapter/${chapterSlug}`,
            });
          }
        });

        let trimmedTitle = mangaTitle;
        if (mangaTitle) {
          trimmedTitle = mangaTitle.trim();
        }

        /// Similar mangas
        $("#Spoiler")
          .find(".grd")
          .each((i, el) => {
            /// Spoiler param
            const link = $(el).find("a").attr("href");
            const linkArray = link.split("/");
            const spoilerParam = linkArray[linkArray.length - 2];

            /// Spoiler title
            const spoilerTitle = $(el).find(".h4").text().trim();

            /// Thumbnail
            const spoilerThumbnail = $(el)
              .find("img")
              .attr("data-src")
              .split("?")[0];

            /// Synopsis
            const spoilerSynopsis = $(el).find("p").text().trim();

            /// Push to the mangaSimilar map
            mangaSimilar.push({
              title: spoilerTitle,
              thumbnail: spoilerThumbnail,
              synopsis: spoilerSynopsis,
              param: spoilerParam,
              detail_url: `${url}/${spoilerParam}`,
            });
          });

        res.json({
          data: {
            title: trimmedTitle,
            thumbnail: mangaThumbnail.split("?")[0],
            genre: mangaGenre,
            synopsis: mangaSynopsis,
            chapters: mangaChapters,
            similars: mangaSimilar,
          },
        });
      }

      done();
    },
  });

  c.queue(`https://komiku.id/manga/${param}`);
};

module.exports.getMangaChapterByParam = async (req, res) => {
  const { param } = req.params;
  const chapterImages = [];

  const c = new Crawler({
    maxConnections: 16,
    referer: "https://komiku.id/",
    // This will be called for each crawled page
    callback: (error, result, done) => {
      if (error) {
        console.log(error);

        res.json({
          data: error.message,
        });
      } else {
        const $ = result.$;

        $("#Baca_Komik img").each((i, el) => {
          const imageUrl = $(el).attr("src");

          if (imageUrl != undefined) {
            imageUrl.replace("img.komiku.id", "cdn.komiku.co.id");
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

  c.queue(`https://komiku.id/ch/${param}`);
};

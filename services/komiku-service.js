const KomikuHelpers = require("../helper/komiku_helpers/komiku_helpers.js");
const { default: axios } = require("axios");
const cheerio = require("cheerio");

module.exports.getLatestManga = async (req, res) => {
  const page = req.query.page || 1;
  const keyword = req.query.s;
  const tag = req.query.tag || "hot";
  const genre = req.query.genre;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  /// Crawl URL
  let crawlUrl = `https://api.komiku.org/other/${tag}/page/${page}/`;
  if (keyword) {
    if (page === 1) {
      crawlUrl = `https://api.komiku.org/?post_type=manga&s=${keyword}`;
    } else {
      crawlUrl = `https://api.komiku.org/page/${page}/?post_type=manga&s=${keyword}`;
    }
  } else if (genre) {
    if (page === 1) {
      crawlUrl = `https://api.komiku.org/genre/${genre}`;
    } else {
      crawlUrl = `https://api.komiku.org/genre/${genre}/page/${page}`;
    }
  } else if (page === 1) {
    crawlUrl = `https://api.komiku.org/other/${tag}/`;
  } else {
    crawlUrl = `https://api.komiku.org/other/${tag}/page/${page}/`;
  }

  /// Json Result
  let jsonResult = {};

  try {
    /// Get URL
    const { data } = await axios.get(crawlUrl, {
      proxy: false,
      headers: { referer: "https://komiku.org/" },
    });

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    /// Manga list
    let mangaList = [];

    $(".bge").each((i, el) => {
      const mangaTitle = $(el).find(".kan").find("h3").text();
      const mangaDescription = $(el).find(".kan").find("p").text();
      const mangaThumbnail = $(el).find(".bgei").find("img").attr("src");

      let mangaParams =
        $(el).find(".kan").find("a").eq(0).attr("href")?.split("/") ?? [];

      let mangaParam = "";

      const latestChapter = $(el)
        .find(".kan")
        .find(".new1")
        .last()
        .find("span")
        .last()
        .text();

      /// If genre exists, take the second index
      if (genre || keyword) {
        mangaParam = mangaParams[2];
      } else {
        mangaParam = mangaParams[4];
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
        thumbnail: mangaThumbnail?.split("?")[0],
        param: mangaParam,
        detail_url: `${url}/${mangaParam}`,
      });
    });

    // let prevLink = $(".loop-nav-inner").find(".prev").attr("href");
    // let nextLink = $(".loop-nav-inner").find(".next").attr("href");

    let prev = "";
    let next = "";

    if (keyword) {
      prev = `&s=${keyword}`;
      next = `&s=${keyword}`;
    } else if (genre) {
      next += `&genre=${genre}`;
      prev += `&genre=${genre}`;
    } else {
      next += `&tag=${tag}`;
      prev += `&tag=${tag}`;
    }

    jsonResult = {
      next_page: `${url}?page=${parseInt(page) + 1}${next}`,
      prev_page:
        parseInt(page) > 1 ? `${url}?page=${parseInt(page) - 1}${next}` : null,
      data: mangaList,
    };

    return res.json(jsonResult);
  } catch (err) {
    /// Return error json data
    jsonResult = {
      data: {},
      error: {
        error: err.message ?? "Unknown Error",
      },
    };
  }
};

module.exports.getMangaByParam = async (req, res) => {
  const { param } = req.params;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  let crawlUrl = `https://komiku.org/manga/${param}`;

  /// Json Result
  let jsonResult = {};

  try {
    /// Get URL
    const { data } = await axios.get(crawlUrl, {
      proxy: false,
      headers: { referer: "https://komiku.org/" },
    });

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

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

        let chapterSlug = $(el)
          .find(".judulseries")
          .find("a")
          .attr("href")
          ?.split("/")[1];

        if (chapterSlug == "ch") {
          chapterSlug = $(el)
            .find(".judulseries")
            .find("a")
            .attr("href")
            ?.split("ch/")[1];
        }

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
        const link = $(el).find("a").attr("href") ?? "";
        const linkArray = link.split("/");
        const spoilerParam = linkArray[linkArray.length - 2];

        /// Spoiler title
        const spoilerTitle = $(el).find(".h4").text().trim();

        /// Thumbnail
        const spoilerThumbnail = $(el)
          .find("img")
          .attr("data-src")
          ?.split("?")[0];

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

    jsonResult = {
      data: {
        title: trimmedTitle,
        param: param,
        thumbnail: mangaThumbnail?.split("?")[0],
        genre: mangaGenre,
        synopsis: mangaSynopsis,
        chapters: mangaChapters,
        similars: mangaSimilar,
      },
    };

    return res.json(jsonResult);
  } catch (err) {
    /// Return error json data
    jsonResult = {
      data: {},
      error: {
        error: err.message ?? "Unknown Error",
      },
    };
  }
};

module.exports.getMangaByParamBatch = async (req, res) => {
  const body = req.body;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  console.log(body);

  /// Json Result
  let jsonResult = {};

  try {
    /// Promises
    let promises = [];

    /// Create promises for all of the body data
    for (let index = 0; index < body.length; index++) {
      const element = body[index];

      /// Get Manga Detail
      promises.push(KomikuHelpers.getMangaDetail(element, url));
    }

    /// Run all promises
    const data = await Promise.all(promises);

    /// Json Data
    jsonResult = { data: data };
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
  return res.json(jsonResult);
};

module.exports.getMangaChapterByParam = async (req, res) => {
  const { param } = req.params;
  const chapterImages = [];

  let crawlUrl = `https://komiku.org/${param}`;

  console.log(crawlUrl);

  /// Json Result
  let jsonResult = {};

  try {
    /// Get URL
    const { data } = await axios.get(crawlUrl, {
      proxy: false,
      headers: { referer: "https://komiku.org/" },
    });

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    $("#Baca_Komik img").each((i, el) => {
      const imageUrl = $(el).attr("src");

      if (imageUrl != undefined) {
        imageUrl.replace("img.komiku.id", "cdn.komiku.co.id");
        chapterImages.push(imageUrl);
      }
    });

    jsonResult = {
      data: chapterImages,
    };

    res.json(jsonResult);
  } catch (err) {
    /// Return error json data
    jsonResult = {
      data: {},
      error: {
        error: err.message ?? "Unknown Error",
      },
    };
  }
};

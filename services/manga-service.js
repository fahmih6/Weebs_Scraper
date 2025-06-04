const { default: axios } = require("axios");
const cheerio = require("cheerio");

module.exports.getLatestManga = async (req, res) => {
  const page = req.query.page || 1;
  const keyword = req.query.s;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  /// Crawl URL
  let crawlUrl = `${process.env.KOMIKCAST_LINK}/daftar-komik/page/${page}/?sortby=update`;
  if (keyword) {
    crawlUrl = `${process.env.KOMIKCAST_LINK}/page/${page}/?s=${keyword}`;
  }

  /// Json Result
  let jsonResult = {};

  try {
    /// Get URL
    const { data } = await axios.get(crawlUrl, {
      proxy: false,
    });

    /// Manga list
    let mangaList = [];

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    /// Manga Count
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
          .text()
          .trim();
        const mangaThumbnail = $(el)
          .find(".list-update_item-image")
          .find(".wp-post-image")
          .attr("src");
        const mangaParam = $(el).find("a").attr("href")?.split("/")[4];
        const mangaRating = $(el)
          .find(".list-update_item-info")
          .find(".rating")
          .find(".numscore")
          .text();
        const mangaType = $(el)
          .find(".list-update_item-image")
          .find(".type")
          .text();
        const mangaFlag = $(el).find(".list-update_item-image").attr("src");

        mangaList.push({
          title: mangaTitle,
          thumbnail: mangaThumbnail,
          type: mangaType,
          flag: mangaFlag,
          param: mangaParam,
          rating: mangaRating,
          detail_url: `${url}/${mangaParam}`,
        });
      });

    jsonResult = {
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

  let crawlUrl = `${process.env.KOMIKCAST_LINK}/manga/${param}`;

  /// Json Result
  let jsonResult = {};

  try {
    /// Get URL
    const { data } = await axios.get(crawlUrl, {
      proxy: false,
    });

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    const mangaTitle = $(
      ".komik_info-content .komik_info-content-body .komik_info-content-body-title"
    )
      .text()
      .trim();
    const mangaThumbnail = $(
      ".komik_info-content .komik_info-content-thumbnail img"
    ).attr("src");
    const mangaMeta = {};
    const mangaGenre = [];
    const mangaSynopsis = $(
      ".komik_info-description .komik_info-description-sinopsis p"
    )
      .text()
      .trim();
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
      const chapterNumber = $(el)
        .find("a")
        .text()
        .replace("Chapter", "")
        .trim();
      const chapterSlug = $(el).find("a").attr("href")?.split("/")[4];
      const chapterRelease = $(el).find(".chapter-link-time").text().trim();

      mangaChapters.push({
        chapter: chapterNumber,
        slug: chapterSlug,
        release: chapterRelease,
        detail_url: `${url}/chapter/${chapterSlug}`,
      });
    });

    jsonResult = {
      data: {
        title: mangaTitle,
        thumbnail: mangaThumbnail,
        meta_info: mangaMeta,
        genre: mangaGenre,
        synopsis: mangaSynopsis,
        chapters: mangaChapters,
      },
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

module.exports.getMangaChapterByParam = async (req, res) => {
  const { param } = req.params;
  const chapterImages = [];

  let crawlUrl = `${process.env.KOMIKCAST_LINK}/chapter/${param}`;

  /// Json Result
  let jsonResult = {};

  try {
    /// Get URL
    const { data } = await axios.get(crawlUrl, {
      proxy: false,
    });

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    $(".main-reading-area img").each((i, el) => {
      const imageUrl = $(el).attr("src");

      if (imageUrl != undefined) {
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

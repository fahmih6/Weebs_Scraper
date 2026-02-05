const { default: axios } = require("axios");
const {
  wrapWithCorsProxy,
  wrapArrayWithCorsProxy,
} = require("../helper/url-helper.js");

/**
 * Komikcast Manga Service V2
 *
 * This service interacts with the Komikcast backend API at be.komikcast.fit
 * using direct JSON requests instead of HTML scraping.
 */

const KOMIKCAST_API = "https://be.komikcast.fit";
const KOMIKCAST_REFERER = process.env.KOMIKCAST_LINK;

const axiosConfig = {
  proxy: false,
  timeout: 15000,
  headers: {
    origin: KOMIKCAST_REFERER,
    referer: KOMIKCAST_REFERER,
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
  },
};

/**
 * Get latest manga updates or search for manga
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports.getLatestManga = async (req, res) => {
  const page = req.query.page || 1;
  const keyword = req.query.s;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  let crawlUrl = `${KOMIKCAST_API}/series?preset=rilisan_terbaru&take=20&takeChapter=3&page=${page}`;
  if (keyword) {
    crawlUrl = `${KOMIKCAST_API}/series?search=${encodeURIComponent(
      keyword,
    )}&take=20&page=${page}`;
  }

  try {
    const { data } = await axios.get(crawlUrl, axiosConfig);
    const mangaItems = data.data || [];

    const mangaList = mangaItems.map((item) => {
      const coverUrl = item.data?.coverImage || item.data?.cover || item.cover;
      return {
        title: item.data?.title || item.title,
        thumbnail: wrapWithCorsProxy(coverUrl, url, KOMIKCAST_REFERER),
        type: item.data?.format || item.data?.type || item.type,
        param: item.data?.slug || item.slug,
        rating: (item.data?.rating || item.rating)?.toString() || "0",
        detail_url: `${url}/${item.data?.slug || item.slug}`,
      };
    });

    const jsonResult = {
      next_page:
        mangaItems.length === 20
          ? `${url}?${keyword ? `s=${keyword}&` : ""}page=${parseInt(page) + 1}`
          : null,
      prev_page:
        page == 1
          ? null
          : `${url}?${keyword ? `s=${keyword}&` : ""}page=${
              parseInt(page) - 1
            }`,
      data: mangaList,
    };

    return res.json(jsonResult);
  } catch (err) {
    console.error(`Error in getLatestManga (v2): ${err.message}`);
    return res.status(err.response?.status || 500).json({
      data: [],
      error: err.message,
    });
  }
};

/**
 * Get manga details by slug/param
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports.getMangaByParam = async (req, res) => {
  const { param } = req.params;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  try {
    // 1. Fetch Series Detail
    const detailResponse = await axios.get(
      `${KOMIKCAST_API}/series/${param}?includeMeta=true`,
      axiosConfig,
    );
    const series = detailResponse.data.data;

    if (!series) {
      return res.status(404).json({ data: {}, error: "Manga not found" });
    }

    // 2. Fetch Chapters
    const chaptersResponse = await axios.get(
      `${KOMIKCAST_API}/series/${param}/chapters`,
      axiosConfig,
    );
    const chapters = chaptersResponse.data.data || [];

    const mangaChapters = chapters.map((ch) => ({
      chapter: ch.data.index.toString(),
      slug: ch.data.index.toString(), // Use index as slug for the next API call
      release: ch.createdAt,
      detail_url: `${url}/chapter/${param}/${ch.data.index}`,
    }));

    const jsonResult = {
      data: {
        title: series.data?.title || series.title,
        thumbnail: wrapWithCorsProxy(
          series.data?.coverImage || series.data?.cover || series.cover,
          url,
          KOMIKCAST_REFERER,
        ),
        meta_info: {
          status: series.data?.status || series.status,
          author: series.data?.author || series.author,
          type: series.data?.format || series.data?.type || series.type,
          rating: (series.data?.rating || series.rating)?.toString(),
        },
        genre:
          series.data?.genres?.map((g) => g.data?.name || g.name) ||
          series.genres?.map((g) => g.data?.name || g.name) ||
          [],
        synopsis: series.data?.summary || series.summary,
        chapters: mangaChapters,
      },
    };

    return res.json(jsonResult);
  } catch (err) {
    console.error(`Error fetching manga ${param} (v2): ${err.message}`);
    return res.status(err.response?.status || 500).json({
      data: {},
      error: err.message,
    });
  }
};

/**
 * Get chapter images/content by manga slug and chapter index
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports.getMangaChapterByParam = async (req, res) => {
  const { param, chapter } = req.params;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  let mangaSlug = param;
  let chIndex = chapter;

  // Fallback for old single param route if it's still used
  if (!chapter && param.includes("/")) {
    const parts = param.split("/");
    mangaSlug = parts[0];
    chIndex = parts[1];
  }

  if (!mangaSlug || !chIndex) {
    return res
      .status(400)
      .json({ error: "Missing manga slug or chapter index" });
  }

  try {
    const { data } = await axios.get(
      `${KOMIKCAST_API}/series/${mangaSlug}/chapters/${chIndex}`,
      axiosConfig,
    );

    // Images can be in 'images' array or 'dataImages' map
    let chapterImages = data.data?.images || [];
    if (chapterImages.length === 0 && data.data?.dataImages) {
      chapterImages = Object.values(data.data?.dataImages);
    }

    return res.json({
      data: wrapArrayWithCorsProxy(chapterImages, url, KOMIKCAST_REFERER),
    });
  } catch (err) {
    console.error(`Error in getMangaChapterByParam (v2): ${err.message}`);
    return res.status(err.response?.status || 500).json({
      data: [],
      error: err.message,
    });
  }
};

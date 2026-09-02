const { default: axios } = require("axios");
const cache = require("../helper/cache-helper.js");
const {
  wrapWithCorsProxy,
  wrapArrayWithCorsProxy,
} = require("../helper/url-helper.js");

/**
 * Voratoon Manga Service
 *
 * Voratoon runs the same backend as Komikcast, so this service talks to the
 * JSON API at api.voratoon.com directly instead of scraping the Next.js pages.
 */

const VORATOON_LINK =
  process.env.VORATOON_LINK ||
  process.env.VORAATOON_LINK ||
  "https://v1.voratoon.com";
const VORATOON_API = process.env.VORATOON_API_LINK || "https://api.voratoon.com";

const TAKE_PER_PAGE = 20;

const axiosConfig = {
  proxy: false,
  timeout: 15000,
  headers: {
    origin: VORATOON_LINK,
    referer: VORATOON_LINK,
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
  },
};

/**
 * Build the cache key for a request, scoped by host so proxied URLs
 * baked into the cached payload stay valid.
 * @param {import('express').Request} req
 * @param {string} suffix
 */
function cacheKeyOf(req, suffix) {
  return `voratoon-${req.get("host")}-${suffix}`;
}

/**
 * Chapter index lives on `chapterIndex` when chapters are embedded in a series
 * and on `data.index` when they come from the chapters endpoint.
 * @param {object} chapter
 * @returns {number|null}
 */
function chapterIndexOf(chapter) {
  return chapter?.chapterIndex ?? chapter?.data?.index ?? null;
}

/**
 * Get latest manga updates or search for manga
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports.getLatestManga = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const keyword = req.query.s;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  const cacheKey = cacheKeyOf(req, `latest-${keyword || "all"}-${page}`);
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  // `ilike` is the case-insensitive matcher; `like` only matches exact casing.
  const crawlUrl = keyword
    ? `${VORATOON_API}/series?take=${TAKE_PER_PAGE}&takeChapter=1&page=${page}&filter=${encodeURIComponent(
        `title=ilike="${keyword}",nativeTitle=ilike="${keyword}"`
      )}`
    : `${VORATOON_API}/series?preset=rilisan_terbaru&take=${TAKE_PER_PAGE}&takeChapter=1&page=${page}`;

  try {
    const { data } = await axios.get(crawlUrl, axiosConfig);
    const seriesItems = data.data || [];

    const mangaList = seriesItems.map((item) => {
      const slug = item.data?.slug || item.slug;
      const latestChapter = chapterIndexOf(item.chapters?.[0]);

      return {
        title: item.data?.title || item.title,
        thumbnail: wrapWithCorsProxy(
          item.data?.coverImage || item.data?.cover || item.cover,
          url,
          VORATOON_LINK
        ),
        type: item.data?.format || item.data?.type || item.type,
        param: slug,
        status: item.data?.status || item.status,
        author: item.data?.author || item.author,
        rating: (item.data?.rating || item.rating)?.toString() || "0",
        latest_chapter: latestChapter?.toString() || null,
        detail_url: `${url}/${slug}`,
      };
    });

    const lastPage = data.meta?.lastPage;
    const pageQuery = keyword ? `s=${encodeURIComponent(keyword)}&` : "";

    const jsonResult = {
      next_page:
        lastPage && page >= lastPage
          ? null
          : `${url}?${pageQuery}page=${page + 1}`,
      prev_page: page <= 1 ? null : `${url}?${pageQuery}page=${page - 1}`,
      data: mangaList,
    };

    cache.set(cacheKey, jsonResult, 300000);
    return res.json(jsonResult);
  } catch (err) {
    console.error(`Error in getLatestManga (voratoon): ${err.message}`);
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

  const cacheKey = cacheKeyOf(req, `detail-${param}`);
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    // 1. Fetch Series Detail
    const detailResponse = await axios.get(
      `${VORATOON_API}/series/${param}?includeMeta=true`,
      axiosConfig
    );
    const series = detailResponse.data.data;

    if (!series) {
      return res.status(404).json({ data: {}, error: "Manga not found" });
    }

    // 2. Fetch Chapters (the detail response only carries the latest few)
    const chaptersResponse = await axios.get(
      `${VORATOON_API}/series/${param}/chapters`,
      axiosConfig
    );
    const chapters = chaptersResponse.data.data || [];

    const mangaChapters = chapters
      .map((ch) => {
        const index = chapterIndexOf(ch);
        return {
          chapter: index?.toString(),
          param: index?.toString(),
          release: ch.createdAt,
          detail_url: `${url}/chapter/${param}/${index}`,
        };
      })
      .filter((ch) => ch.chapter);

    const jsonResult = {
      data: {
        title: series.data?.title || series.title,
        param,
        thumbnail: wrapWithCorsProxy(
          series.data?.coverImage || series.data?.cover || series.cover,
          url,
          VORATOON_LINK
        ),
        synopsis: series.data?.synopsis?.trim() || series.synopsis?.trim(),
        meta_info: {
          status: series.data?.status || series.status,
          author: series.data?.author || series.author,
          type: series.data?.format || series.data?.type || series.type,
          rating: (series.data?.rating || series.rating)?.toString(),
          total_chapters: (
            series.data?.totalChapters || chapters.length
          )?.toString(),
        },
        genre:
          series.data?.genres?.map((g) => g.data?.name || g.name) ||
          series.genres?.map((g) => g.data?.name || g.name) ||
          [],
        chapters: mangaChapters,
      },
    };

    cache.set(cacheKey, jsonResult, 300000);
    return res.json(jsonResult);
  } catch (err) {
    console.error(`Error fetching manga ${param} (voratoon): ${err.message}`);
    return res.status(err.response?.status || 500).json({
      data: {},
      error: err.message,
    });
  }
};

/**
 * Get chapter images by manga slug and chapter index
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports.getMangaChapterByParam = async (req, res) => {
  const { param, chapter } = req.params;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  if (!param || !chapter) {
    return res
      .status(400)
      .json({ data: [], error: "Missing manga slug or chapter index" });
  }

  const cacheKey = cacheKeyOf(req, `chapter-${param}-${chapter}`);
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const { data } = await axios.get(
      `${VORATOON_API}/series/${param}/chapters/${chapter}`,
      axiosConfig
    );

    // Images can be in the 'images' array or the 'dataImages' map
    let chapterImages = data.data?.data?.images || [];
    if (chapterImages.length === 0 && data.data?.data?.dataImages) {
      chapterImages = Object.values(data.data.data.dataImages);
    }

    const jsonResult = {
      data: wrapArrayWithCorsProxy(chapterImages, url, VORATOON_LINK),
    };

    cache.set(cacheKey, jsonResult, 300000);
    return res.json(jsonResult);
  } catch (err) {
    console.error(
      `Error in getMangaChapterByParam (voratoon): ${err.message}`
    );
    return res.status(err.response?.status || 500).json({
      data: [],
      error: err.message,
    });
  }
};

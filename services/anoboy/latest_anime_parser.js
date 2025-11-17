const { default: axios } = require("axios");
const cheerio = require("cheerio");
const arrayHelper = require("../../helper/array-helper.js");

/// Parse latest anime using cheerio
async function parseLatestAnime(keyword, url, page) {
  /// Get URL Based on query params
  let getUrl = "";

  /// Set the query params if any
  if (keyword) {
    if (page == 1) {
      getUrl = `${process.env.ANOBOY_LINK}/?s=${keyword}`;
    } else {
      getUrl = `${process.env.ANOBOY_LINK}/page/${page}/?s=${keyword}`;
    }
  } else {
    if (page == 1) {
      getUrl = `${process.env.ANOBOY_LINK}/`;
    } else {
      getUrl = `${process.env.ANOBOY_LINK}/page/${page}/`;
    }
  }

  /// Json Result
  let jsonResult = {};

  try {
    /// Get URL
    const { data } = await axios.get(getUrl, {
      proxy: false,
    });

    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    // Anime grid
    let animeGrid = $(".home_index a");

    // If search is used, then use different class
    if (keyword) {
      animeGrid = $(".column-content a");
    }

    const animeList = [];

    // Loop through all anime grid
    animeGrid.each((i, el) => {
      // Select only links that is not halaman
      if (
        $(el).attr("title") != undefined &&
        $(el).attr("title")?.toLowerCase().includes("halaman") == false &&
        $(el).attr("title")?.toLowerCase().includes("page") == false &&
        $(el).parents("#jadwal").text() == "" &&
        !$(el).attr("title")?.toLowerCase().includes("[download") &&
        !$(el).attr("title")?.toLowerCase().includes("[streaming")
      ) {
        // Title
        let title = $(el).attr("title");

        let paramArray = $(el).attr("href")?.split("/");
        paramArray = arrayHelper.removeAllItemFrom(paramArray, 2);

        // Param
        let param = paramArray?.join("~");

        // Image Thumbnail Tag
        const imageTag = $(el).find("img, amp-img");

        // Search for possible image thumbnail attributes
        let image =
          imageTag.attr("src") ||
          imageTag.attr("data-src") ||
          imageTag.attr("data-i-src") ||
          imageTag.attr("srcset")?.split(" ")[0] ||
          null;

        // If thumbnail is valid, assign the link
        if (image && !image.startsWith("http")) {
          image = process.env.ANOBOY_LINK + image;
        } else {
          image = "";
        }

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

    jsonResult = {
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
    };
  } catch (err) {
    /// Return error json data
    jsonResult = {
      data: {},
      error: {
        error: err ?? "Unknown Error",
      },
    };
  }

  /// Run again if data is less than 4
  if (jsonResult.data.length < 4 && keyword == undefined) {
    /// Result
    const res = await parseLatestAnime(keyword, url, page + 1);

    /// New anime list
    let newAnimeList = [];

    /// Append to the new anime list
    newAnimeList.push(...jsonResult.data);

    if (res.data.length >= 1) {
      newAnimeList.push(...res.data);
    }

    /// Alter the anime data
    res.data = newAnimeList;

    /// Alter the Json Result
    jsonResult = res;
  }

  return jsonResult;
}

module.exports = { parseLatestAnime };

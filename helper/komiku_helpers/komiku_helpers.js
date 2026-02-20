// @ts-ignore
const cheerio = require("cheerio");
const { default: axios } = require("axios");

// @ts-ignore
class KomikuHelpers {
  /// Get Manga Detail
  static getMangaDetail = async (param, url) => {
    try {
      /// Get the data
      const { data } = await axios.get(`https://komiku.org/manga/${param}/`, {
        proxy: false,
        headers: { referer: "https://komiku.org/" },
      });

      // Load HTML we fetched in the previous line
      const $ = cheerio.load(data);

      const mangaTitle = $("h1").text().trim();
      const mangaThumbnail = $(".ims img").attr("src");
      const mangaGenre = [];
      const mangaSynopsis = $(".sinopsis").text().trim();
      const mangaChapters = [];
      const mangaSimilar = [];

      // @ts-ignore
      $(".genre a").each((i, el) => {
        mangaGenre.push($(el).text().trim());
      });

      $("#Daftar_Chapter tr").each((i, el) => {
        const chapterNumber = $(el).find(".judulseries").text().trim();
        if (chapterNumber && !chapterNumber.includes("Nomor Chapter")) {
          const chapterLink = $(el).find("a").attr("href") ?? "";
          const chapterSlug = chapterLink.split("/").filter(Boolean).pop();
          const chapterRelease = $(el).find(".tanggalseries").text().trim();

          if (chapterSlug) {
            mangaChapters.push({
              chapter: chapterNumber,
              param: chapterSlug,
              release: chapterRelease,
              detail_url: `${url}/chapter/${chapterSlug}`,
            });
          }
        }
      });

      let trimmedTitle = mangaTitle;
      if (mangaTitle) {
        trimmedTitle = mangaTitle.trim();
      }

      /// Similar mangas
      $("#Spoiler")
        .find(".grd")
        // @ts-ignore
        .each((i, el) => {
          /// Spoiler param
          const link = $(el).find("a").attr("href") ?? "";
          const linkArray = link.split("/").filter(Boolean);
          const spoilerParam = linkArray.pop();

          /// Spoiler title
          const spoilerTitle = $(el).find(".h4").text().trim();

          /// Thumbnail
          // @ts-ignore
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

      return {
        title: trimmedTitle,
        // @ts-ignore
        thumbnail: mangaThumbnail?.split("?")[0],
        genre: mangaGenre,
        synopsis: mangaSynopsis,
        chapters: mangaChapters,
        similars: mangaSimilar,
      };
    } catch (err) {
      /// Return error json data
      return {
        data: {},
        error: {
          error: err.message ?? "Unknown Error",
        },
      };
    }
  };
}

module.exports = KomikuHelpers;

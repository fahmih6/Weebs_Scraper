const cheerio = require("cheerio");
const { default: axios } = require("axios");
const arrayHelper = require("../../helper/array-helper.js");

/** Anoboy Episodes Helper
 *
 * Use this class to call any functions related to getting anime full episodes data.
 */
class AnoboyEpisodesHelper {
  /// Get all episodes
  static getAllEpisodes = async (data, url) => {
    // Assign root of HTML DOM.
    const parentDOM = cheerio.load(data);

    /// Parent Link
    const parentLink = parentDOM(".breadcrumb")
      .find("*[itemtype = 'https://schema.org/WebPage']")
      .attr("href");

    /// Anime Episode Links
    let animeEpisodeLinks = [];

    /// Make sure parent link is not empty
    if (parentLink != undefined) {
      /// Visit the parent link
      const res = await axios.get(`${parentLink}`, {
        proxy: false,
      });

      /// Get the DOM data
      const $ = cheerio.load(res.data);

      /// Get anime grid data
      const animeGrid = $(".column-content a");

      /// Loop through anime grid to get title and link.
      animeGrid.each((i, el) => {
        // Select only links that is not halaman
        if (
          $(el).attr("title") != undefined &&
          $(el).attr("title")?.toLowerCase().includes("halaman") == false &&
          $(el).attr("title")?.toLowerCase().includes("page") == false &&
          $(el).parents("#jadwal").text() == "" &&
          !$(el).attr("title")?.toLowerCase().includes("[download]") &&
          !$(el).attr("title")?.toLowerCase().includes("[streaming]")
        ) {
          // Title
          let title = $(el).attr("title");

          /// Param array
          let paramArray = $(el).attr("href")?.split("/");
          paramArray = arrayHelper.removeAllItemFrom(paramArray, 2);

          // Param
          let param = paramArray?.join("~");

          animeEpisodeLinks.push({
            nav_name: title,
            nav_link: `${url}/${param}`,
          });
        }
      });
    }

    /// Anime Episode Links
    return animeEpisodeLinks.reverse();
  };
}

module.exports = AnoboyEpisodesHelper;

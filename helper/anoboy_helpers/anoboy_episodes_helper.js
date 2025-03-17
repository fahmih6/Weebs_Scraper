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

      /// Parse Result
      const parseResult = this.parseEpisodesDOM(res.data, url);

      /// Next Link
      var nextLink = parseResult.nextLink;

      /// Parse Episodes
      animeEpisodeLinks.push(...parseResult.episodeList);

      /// Peform next episode fetch if the next link is not empty
      while (nextLink != undefined && !nextLink.includes("category/anime/")) {
        /// Get the next episodes
        const nextRes = await this.getNextEpisodes(nextLink, url);

        /// Set the next link
        nextLink = nextRes.nextLink;

        /// Push the Episode List
        animeEpisodeLinks.push(...nextRes.episodeList);
      }
    }

    /// Anime Episode Links
    return animeEpisodeLinks.reverse();
  };

  /// Get next episodes if exists.
  static getNextEpisodes = async (nextURL, localURL) => {
    /// Visit the URL
    const res = await axios.get(`${nextURL}`, {
      proxy: false,
    });

    /// Return the List.
    return this.parseEpisodesDOM(res.data, localURL);
  };

  /// Parse Episodes DOM
  static parseEpisodesDOM = (data, url) => {
    /// Episode List
    var animeEpisodeLinks = [];

    /// Get the DOM data
    const $ = cheerio.load(data);

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

    /// Next Post Link
    const nextPostLink = $(".nextpostslink").attr("href");

    /// Return the result
    if (nextPostLink != undefined) {
      return {
        nextLink: nextPostLink,
        episodeList: animeEpisodeLinks,
      };
    } else {
      return { episodeList: animeEpisodeLinks };
    }
  };
}

module.exports = AnoboyEpisodesHelper;

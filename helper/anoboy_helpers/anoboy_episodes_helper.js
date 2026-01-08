const cheerio = require("cheerio");
const http = require("../../helper/http-helper.js");
const arrayHelper = require("../../helper/array-helper.js");

/** Anoboy Episodes Helper
 *
 * Use this class to call any functions related to getting anime full episodes data.
 */
class AnoboyEpisodesHelper {
  /// Get all episodes
  static getAllEpisodes = async (data, url) => {
    // Assign root of HTML DOM.
    const parentDOM = typeof data === "string" ? cheerio.load(data) : data;

    /// Parent Link
    const parentLink = parentDOM(".breadcrumb")
      .find(
        "a[itemtype='https://schema.org/WebPage'], a[itemtype = 'https://schema.org/WebPage']"
      )
      .attr("href");

    /// Anime Episode Links
    let animeEpisodeLinks = [];

    /// Make sure parent link is not empty
    if (parentLink != undefined) {
      /// Visit the parent link
      const res = await http.get(`${parentLink}`);

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
    const res = await http.get(`${nextURL}`);

    /// Return the List.
    return this.parseEpisodesDOM(res.data, localURL);
  };

  /// Parse Episodes DOM
  static parseEpisodesDOM = (data, url) => {
    /// Episode List
    var animeEpisodeLinks = [];

    /// Get the DOM data
    const $ = typeof data === "string" ? cheerio.load(data) : data;

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

  /// Get episodes from title only
  static getEpisodesFromTitleOnly = async (data, url) => {
    // Load HTML into Cheerio
    const $ = typeof data === "string" ? cheerio.load(data) : data;

    // Array to store episodes
    const episodes = [];

    // Select all episode links
    $("div.singlelink ul.lcp_catlist li a").each((index, element) => {
      /// Param array
      let paramArray = $(element).attr("href")?.split("/");
      paramArray = arrayHelper.removeAllItemFrom(paramArray, 2);

      // Param
      let param = paramArray?.join("~");

      const episode = {
        nav_name: $(element).text().trim(),
        nav_link: `${url}/${param}`,
      };
      episodes.push(episode);
    });

    // Reverse the array to get episodes from 1 to 25 in order
    episodes.reverse();

    return episodes;
  };
}

module.exports = AnoboyEpisodesHelper;

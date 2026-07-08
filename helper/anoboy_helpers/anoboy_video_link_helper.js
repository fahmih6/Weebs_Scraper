const {
  getYUPEmbedLinks,
  getYUPDirectLink,
} = require("../yourupload_helpers/anoboy_yourupload_helper");

const cheerio = require("cheerio");
const { getBloggerEmbedLink } = require("./anoboy_blogger_helper");
// const { getAnoboyArchiveDirectLink } = require("./anoboy_archive_helper");
const { getBatchBloggerDirectLink } = require("./anoboy_blogger_helper");
const http = require("../http-helper.js");

/** Anoboy Embed Link Helper
 *
 * Use this class to call any functions related to getting embed links data.
 */
class AnoboyEmbedLinkHelper {
  // Blog link marker
  static blogMarker = "/uploads/adsbatch";

  // YUP link marker
  static yupMarker = "/uploads/yup";

  // Archive link marker
  static archiveMarker = "/uploads/stream";

  // Get Normal Embed Link
  static getVideoLinks = async (data) => {
    // Blogger embed links
    let bloggerEmbedLinks = [];

    // Blogger direct links
    let bloggerDirectLinks = [];

    // Your Upload embed links
    let yourUploadEmbedLinks = [];

    // Your Upload direct links
    let yourUploadDirectLinks = [];

    // Archive embed links
    let archiveEmbedLinks = [];

    // Archive direct links
    let archiveDirectLinks = [];

    // Assign root of HTML DOM.
    const $ = typeof data === "string" ? cheerio.load(data) : data;

    // Mirror Element
    let mirrorElements = $(".vmiror");

    // Main links
    const mainSrc = $("#mediaplayer").attr("src");
    let mainLink = null;
    let mainRes = mirrorElements.eq(0).find(".active").text()?.trim() || "";
    mainRes = mainRes.replace(/PC\s+/i, "");
    if (mainRes && !mainRes.toLowerCase().endsWith("p")) {
      mainRes += "P";
    }

    if (mainSrc) {
      if (mainSrc.includes("blogger.com")) {
        mainLink = mainSrc;
        bloggerEmbedLinks.push({
          resolution: mainRes,
          link: mainLink,
        });
      } else if (mainSrc.includes(this.blogMarker)) {
        const token = mainSrc.split("url=")[1]?.split("&")[0] || mainSrc.split("=")[1]?.split("&")[0];
        if (token) {
          mainLink = `https://www.blogger.com/video.g?token=${token}`;
          bloggerEmbedLinks.push({
            resolution: mainRes,
            link: mainLink,
          });
        }
      } else if (mainSrc.includes(this.archiveMarker)) {
        archiveEmbedLinks.push({
          resolution: mainRes,
          link: mainSrc.startsWith("http") ? mainSrc : `${process.env.ANOBOY_LINK}${mainSrc}`,
        });
      }
    }

    /// Blogger promises
    let blogBatchLink = null;

    // Your upload promises
    let yupBatchLink = null;

    // Loop through all mirrors
    mirrorElements.each((index, element) => {
      // Find all anchors inside this mirror container
      const anchors = $(element).find("a");

      anchors.each((i, anchor) => {
        const _el = $(anchor);
        const _link = _el.attr("data-video");
        if (!_link) return;

        let _resolution = _el.text().trim();
        _resolution = _resolution.replace(/PC\s+/i, "");
        if (!_resolution.toLowerCase().endsWith("p")) {
          _resolution += "P";
        }

        // If link contains blogger, then append to the blogger.
        if (_link.includes(this.blogMarker)) {
          const token = _link.split("url=")[1]?.split("&")[0] || _link.split("=")[1]?.split("&")[0];
          if (token) {
            const embedLink = `https://www.blogger.com/video.g?token=${token}`;
            // Avoid duplicate with mainLink if already pushed
            if (!bloggerEmbedLinks.some(item => item.link === embedLink)) {
              bloggerEmbedLinks.push({
                resolution: _resolution,
                link: embedLink,
              });
            }
          } else {
            blogBatchLink = `${process.env.ANOBOY_LINK}${_link}`;
          }
        } else if (_link.includes(this.yupMarker)) {
          yupBatchLink = `${process.env.ANOBOY_LINK}${_link}`;
        } else if (_link.includes(this.archiveMarker)) {
          const embedLink = _link.startsWith("http") ? _link : `${process.env.ANOBOY_LINK}${_link}`;
          if (!archiveEmbedLinks.some(item => item.link === embedLink)) {
            archiveEmbedLinks.push({
              resolution: _resolution,
              link: embedLink,
            });
          }
        }
      });
    });

    // If both blog and yup batch link is not null.
    // Then get it simultaneously instead of one-by-one
    if (blogBatchLink != null && yupBatchLink != null) {
      /// Create a new proses to get blog and yup embed data
      let batchLinks = await Promise.all([
        getBloggerEmbedLink(blogBatchLink),
        getYUPEmbedLinks(yupBatchLink),
      ]);

      /// Assign it to corresponding variables
      bloggerEmbedLinks.push(batchLinks[0][0]);
      yourUploadEmbedLinks = batchLinks[1];
    }

    /// Run the promses for new Blogger mode
    if (blogBatchLink != null && !bloggerEmbedLinks.length) {
      bloggerEmbedLinks = await getBloggerEmbedLink(blogBatchLink);
    }

    // Run the promises for Your Upload
    if (yupBatchLink != null) {
      // Get Embed Links
      yourUploadEmbedLinks = !yourUploadEmbedLinks.length
        ? await getYUPEmbedLinks(yupBatchLink)
        : yourUploadEmbedLinks;

      // Direct Link Promises
      let _yupDLPromises = [];

      // Get the direct links
      for (let index = 0; index < yourUploadEmbedLinks.length; index++) {
        const _embedEl = yourUploadEmbedLinks[index];

        // YUP Direct Link Promise
        let yupDirectRes = getYUPDirectLink(_embedEl.resolution, _embedEl.link);

        // Push to list
        _yupDLPromises.push(yupDirectRes);
      }

      // Run the promises
      yourUploadDirectLinks = await Promise.all(_yupDLPromises);
    }

    // MARK: - Get blogger direct links //
    if (bloggerEmbedLinks != null) {
      bloggerDirectLinks = await getBatchBloggerDirectLink(bloggerEmbedLinks);
    }

    // MARK: - Get archive direct links //
    // let archivePromises = [];

    // // Get the promises
    // for (let index = 0; index < archiveEmbedLinks.length; index++) {
    //   const element = archiveEmbedLinks[index];

    //   // Archive Direct Link Promise
    //   let _archiveLinkPromise = getAnoboyArchiveDirectLink(element.link);

    //   // Push to list
    //   archivePromises.push(_archiveLinkPromise);
    // }

    // // Run the promises
    // archiveDirectLinks = await Promise.all(archivePromises);

    /// Return embed links and direct links
    return {
      blogger: bloggerEmbedLinks,
      yup: yourUploadEmbedLinks,
      yupDirectLinks: yourUploadDirectLinks,
      bloggerDirectLinks: bloggerDirectLinks,
      archiveEmbedLinks: archiveEmbedLinks,
      archiveDirectLinks: archiveDirectLinks,
    };
  };
}

module.exports = AnoboyEmbedLinkHelper;

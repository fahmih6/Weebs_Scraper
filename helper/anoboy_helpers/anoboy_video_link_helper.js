const {
  getYUPEmbedLinks,
  getYUPDirectLink,
} = require("../yourupload_helpers/anoboy_yourupload_helper");

const cheerio = require("cheerio");
const { getBloggerEmbedLink } = require("./anoboy_blogger_helper");
// const { getAnoboyArchiveDirectLink } = require("./anoboy_archive_helper");
const { getBatchBloggerDirectLink } = require("./anoboy_blogger_helper");
const { default: axios } = require("axios");

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
    const $ = cheerio.load(data);

    // Mirror Element
    let mirrorElements = $(".vmiror");

    // Main links
    let mainLink = `https://www.blogger.com/video.g?token=${
      $("#mediaplayer").attr("src")?.split("=")[1]
    }`;

    // Current main link resolution
    let mainRes = mirrorElements.eq(0).find(".active").text() + "P";

    // Check the main link, if main link consist of blogger, then parse it as blogger
    if (mainLink?.includes("blogger.com")) {
      bloggerEmbedLinks.push({
        resolution: mainRes,
        link: mainLink,
      });
    }
    // If main link is consist of stream, then it's archive link
    else if (mainLink?.includes(this.archiveMarker)) {
      archiveEmbedLinks.push({
        resolution: mainRes,
        link: `${process.env.ANOBOY_LINK}${mainLink}`,
      });
    }

    /// Blogger promises
    let blogBatchLink = null;

    // Your upload promises
    let yupBatchLink = null;

    // Loop through all mirrors
    mirrorElements.each((index, element) => {
      // Get element.
      let _el = $(element).find("#allmiror");

      // Get embed link.
      let _link = _el.attr("data-video")?.includes(this.blogMarker)
        ? _el.eq(1).attr("data-video")
        : _el.attr("data-video");

      // Get resolution.
      let _resolution = _el.text();

      // If link contains blogger, then append to the blogger.
      if (_link?.includes(this.blogMarker)) {
        blogBatchLink = `${process.env.ANOBOY_LINK}${_link}`;
      } else if (_link?.includes(this.yupMarker)) {
        yupBatchLink = `${process.env.ANOBOY_LINK}${_link}`;
      } else if (_link?.includes(this.archiveMarker)) {
        archiveEmbedLinks.push({
          resolution: _resolution,
          link: `${process.env.ANOBOY_LINK}${_link}`,
        });
      }
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
    // if (bloggerEmbedLinks != null) {
    //   bloggerDirectLinks = await getBatchBloggerDirectLink(bloggerEmbedLinks);
    // }

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

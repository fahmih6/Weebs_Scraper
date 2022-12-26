// @ts-nocheck
const puppeteer = require("puppeteer");
const arrayHelper = require("../helper/array-helper.js");
const PuppeteerBrowserOptions = require("../global/puppeteer_browser_options.js");
const PuppeteerSingleton = require("../helper/puppeteer_singleton..js");

/// Get latest anime v2
module.exports.getLatestAnimeV2 = async (req, res) => {
  const page = req.query.page || 1;
  const keyword = req.query.s;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  /// Run Browser
  const browser = await PuppeteerSingleton.getBrowser();

  /// Page
  const browserPage = await browser.newPage();

  /// Check if keyword exists
  if (keyword) {
    if (page == 1) {
      // Go to URLs
      await browserPage.goto(
        `${process.env.ANOBOY_LINK}/?s=${keyword}`,
        PuppeteerBrowserOptions.fastLoadOptions
      );
    } else {
      await browserPage.goto(
        `${process.env.ANOBOY_LINK}/page/${page}/?s=${keyword}`,
        PuppeteerBrowserOptions.fastLoadOptions
      );
    }
  } else {
    if (page == 1) {
      await browserPage.goto(
        `${process.env.ANOBOY_LINK}/`,
        PuppeteerBrowserOptions.fastLoadOptions
      );
    } else {
      await browserPage.goto(
        `${process.env.ANOBOY_LINK}/page/${page}/`,
        PuppeteerBrowserOptions.fastLoadOptions
      );
    }
  }

  /// Anime List
  const animeList = [];

  /// Evaluate the page
  let animeGrid = await browserPage.$$(".home_index a");
  // If search is used, then use different class
  if (keyword) {
    animeGrid = await browserPage.$$(".column-content a");
  }

  /// Loop through all of anime grid items
  for (const animeItem in animeGrid) {
    /// Make sure the item is exists
    if (Object.hasOwnProperty.call(animeGrid, animeItem)) {
      const element = animeGrid[animeItem];

      /// Title
      const title = await element.evaluate((el) => el.getAttribute("title"));

      const jadwalElement = await element.$(".jamup");
      let jadwal = "";
      if (jadwalElement) {
        jadwal = await jadwalElement.evaluate((el) => el.textContent);
      }

      let paramArray = await element.evaluate((el) =>
        el.getAttribute("href").split("/")
      );
      paramArray = arrayHelper.removeAllItemFrom(paramArray, 2);

      // Param
      let param = paramArray.join("~");

      // Image
      let imageElement = await element.$("amp-img");
      let image = "";
      if (imageElement) {
        const tempImage = await imageElement.evaluate((el) =>
          el.getAttribute("src")
        );
        if (tempImage) {
          if (!tempImage.includes("blogger.googleusercontent.com")) {
            image += `${process.env.ANOBOY_LINK}`;
            image += tempImage;
          } else {
            image = tempImage;
          }
        }
      }

      /// Upload time
      let uploadTimeElement = await element.$(".jamup");
      let uploadTime = "";
      if (uploadTimeElement) {
        const tempTime = await uploadTimeElement.evaluate(
          (el) => el.textContent
        );
        if (tempTime) {
          uploadTime = tempTime.trim();
        }
      }

      /// Title
      if (
        title != undefined &&
        !title.toLowerCase().includes("halaman") &&
        jadwal != ""
      ) {
        animeList.push({
          title: title.trim(),
          param: param,
          thumbnail: image,
          upload_time: uploadTime,
          detail_url: `${url}/${param}`,
        });
      }
    }
  }

  /// Get the current page and maximum page
  let pageStringElement = await browserPage.$(".wp-pagenavi .pages");
  let pageStringRaw = "";
  if (pageStringElement) {
    pageStringRaw = await pageStringElement.evaluate((el) => el.textContent);
  }
  const pageString = pageStringRaw.replace(`Halaman ${page} dari `, "");

  /// Set the max page, previous page and next page
  let maxPageTemp = parseInt(pageString);
  let maxPage = isNaN(maxPageTemp) ? 1 : maxPageTemp;
  let nextPage = parseInt(page) < maxPage ? parseInt(page) + 1 : null;
  let prevPage =
    parseInt(page) <= maxPage && parseInt(page) > 1 ? parseInt(page) - 1 : null;

  /// Close Browser Page
  await browserPage.close();

  /// Return result
  return res.json({
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
  });
};

/// Get anime detail
module.exports.getAnimeByParamV2 = async (req, res) => {
  const { param } = req.params;
  let tempParam = param.replace(/~/gi, "/");
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  /// Run Browser
  const browser = await PuppeteerSingleton.getBrowser();

  /// Page
  const browserPage = await browser.newPage();
  await browserPage.goto(
    `${process.env.ANOBOY_LINK}/${tempParam}`,
    PuppeteerBrowserOptions.fullLoadOptions
  );

  // Video Links
  var videoLinks = [];

  /// Video Embed Links
  var videoEmbedLinks = [];

  // Episode navigation
  var episodeNavigation = [];

  /// New Page
  const newPage = await browser.newPage();

  /// Mirror count
  const mirrorCount = (await browserPage.$$(".vmiror")).length;

  /// If mirror count is more than 1 then push the remaining resolution
  if (mirrorCount >= 1) {
    const vMirror = await browserPage.$$(".vmiror");

    /// First index
    let aElements = [];
    for (let index = 0; index < vMirror.length; index++) {
      const element = vMirror[index];
      const links = await element.$$("a");
      aElements.push(...links);
    }

    /// Loop through all links
    for (const link in aElements) {
      if (Object.hasOwnProperty.call(aElements, link)) {
        const element = aElements[link];

        /// Resolution Text
        const text = await element.evaluate((el) => el.textContent);
        /// Embed URL
        const embedUrl = await element.evaluate((el) =>
          el.getAttribute("data-video")
        );

        // If text includes 720, 360, or 480 and embed url doesn't contain token=none
        if (
          text.includes("720") ||
          text.includes("360") ||
          text.includes("480")
        ) {
          /// If video wasn't uploaded to the blogger, push certain link
          if (
            embedUrl?.includes("/uploads/stream") &&
            !embedUrl.includes("data=none")
          ) {
            /// Push embed url directly from blogger link
            const data = {
              resolution: text,
              link: `${process.env.ANOBOY_LINK}${embedUrl}`,
            };
            videoEmbedLinks.push(data);

            /// Get the real video url
            await newPage.goto(
              `${process.env.ANOBOY_LINK}${embedUrl}`,
              PuppeteerBrowserOptions.fullLoadOptions
            );
            const frame = await newPage.$(".jw-video");
            if (frame) {
              const url = await frame.evaluate((el) => el.getAttribute("src"));
              const data = {
                resolution: text,
                link: url,
              };
              /// Push real video url
              videoLinks.push(data);
            }
          } else if (embedUrl.includes("www.sharezweb.com")) {
            /// Push embed url directly from blogger link
            const data = {
              resolution: text,
              link: embedUrl,
            };
            videoEmbedLinks.push(data);

            /// Get the real video url
            await newPage.goto(
              embedUrl,
              PuppeteerBrowserOptions.fullLoadOptions
            );
            const frameElement = await newPage.$(".plyr__video-wrapper");
            if (frameElement) {
              const link = await frameElement.evaluate((el) =>
                el.getElementsByTagName("video").item(0).getAttribute("src")
              );

              /// Push real video url
              const data = {
                resolution: text,
                link: link,
              };
              videoLinks.push(data);
            }
          }
        }
      }
    }
  }

  // Name
  let nameElement = await browserPage.$(".entry-content");
  let name = "";
  if (nameElement) {
    const entryTitleElement = await nameElement.$(".entry-title");
    if (entryTitleElement) {
      name = await entryTitleElement.evaluate((el) => el.textContent);
      name = name.trim();
    }
  }

  // Synopsis
  let synopsisElement = await browserPage.$(".contentdeks");
  let sinopsis = "";
  if (synopsisElement) {
    sinopsis = await synopsisElement.evaluate((el) => el.textContent);
    sinopsis = sinopsis.trim();
  }

  /// Navigation
  let navigationElement = await browserPage.$("#navigasi");
  if (navigationElement) {
    /// Element
    const navigationLinkElement = await navigationElement.$$(".widget-title a");

    /// Loop through all elements
    for (const key in navigationLinkElement) {
      if (Object.hasOwnProperty.call(navigationLinkElement, key)) {
        const element = navigationLinkElement[key];
        const link = await element.evaluate((el) => el.getAttribute("href"));
        const episodeName = await element.evaluate((el) =>
          el.getAttribute("title")
        );

        if (link) {
          let paramArray = link.split("/");
          paramArray = arrayHelper.removeAllItemFrom(paramArray, 2);

          // Param
          let param = paramArray.join("~");

          /// Push the navigation
          episodeNavigation.push({
            nav_name: episodeName,
            nav_link: `${url}/${param}`,
          });
        }
      }
    }
  }

  /// Browser Page
  await browserPage.close();
  await newPage.close();

  // Return the json data
  res.json({
    data: {
      name: name,
      synopsis: sinopsis,
      episode_navigation: episodeNavigation,
      video_embed_links: videoEmbedLinks,
      video_direct_links: videoLinks,
    },
  });
};

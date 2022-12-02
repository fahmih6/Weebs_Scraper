const puppeteer = require("puppeteer");
const arrayHelper = require("../helper/array-helper.js");

const puppeteerOptions = {
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  ignoreDefaultArgs: ["--disable-extensions"],
};

const pageOptions = {
  waitUntil: "networkidle2",
  timeout: 0,
};

/// Get latest anime v2
module.exports.getLatestAnimeV2 = async (req, res) => {
  const page = req.query.page || 1;
  const keyword = req.query.s;
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  /// Run Browser
  const browser = await puppeteer.launch(puppeteerOptions);

  /// Page
  const browserPage = await browser.newPage();

  /// Check if keyword exists
  if (keyword) {
    if (page == 1) {
      // Go to URLs
      await browserPage.goto(
        `${process.env.ANOBOY_LINK}/?s=${keyword}`,
        pageOptions
      );
    } else {
      await browserPage.goto(
        `${process.env.ANOBOY_LINK}/page/${page}/?s=${keyword}`,
        pageOptions
      );
    }
  } else {
    if (page == 1) {
      await browserPage.goto(`${process.env.ANOBOY_LINK}/`, pageOptions);
    } else {
      await browserPage.goto(
        `${process.env.ANOBOY_LINK}/page/${page}/`,
        pageOptions
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

  /// Close the browser
  await browser.close();

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
  const browser = await puppeteer.launch(puppeteerOptions);

  /// Page
  const browserPage = await browser.newPage();
  await browserPage.goto(
    `${process.env.ANOBOY_LINK}/${tempParam}`,
    pageOptions
  );

  // Video Links
  var videoLinks = [];

  /// Video Embed Links
  var videoEmbedLinks = [];

  // Episode navigation
  var episodeNavigation = [];

  // Main links
  let mainLink = "";
  var mainLinkElement = await browserPage.$("#mediaplayer");
  if (mainLinkElement) {
    mainLink = await mainLinkElement.evaluate((el) => el.getAttribute("src"));
  }

  /// New Page
  const newPage = await browser.newPage();

  if (mainLink?.includes("/uploads")) {
    // Push embed video url
    videoEmbedLinks.push({
      "480P": `${process.env.ANOBOY_LINK}${mainLink}`,
    });

    /// Get the real video url
    await newPage.goto(`${process.env.ANOBOY_LINK}${mainLink}`, pageOptions);
    const frame = await newPage.$(".jw-video");
    if (frame) {
      const url = await frame.evaluate((el) => el.getAttribute("src"));
      /// Push real video url
      videoLinks.push({
        "360P": { play_url: url },
      });
    }
  } else if (mainLink.includes("www.sharezweb.com")) {
    /// Push embed url directly from blogger link
    videoEmbedLinks.push({
      "360P": mainLink,
    });

    /// Get the real video url
    await newPage.goto(mainLink, pageOptions);
    const frameElement = await newPage.$(".plyr__video-wrapper");
    if (frameElement) {
      const link = await frameElement.evaluate((el) =>
        el.getElementsByTagName("video").item(0).getAttribute("src")
      );
      /// Push real video url
      videoLinks.push({
        "360P": link,
      });
    }
  } else {
    /// Push embed link directly from blogger
    videoEmbedLinks.push({
      "360P": mainLink,
    });

    /// Get the real video url
    await newPage.goto(mainLink, pageOptions);
    const frame = await newPage.mainFrame();
    const content = await frame.content();
    const firstIndex = content.search(`{"thumbnail":`);
    const lastIndex = content.search("</script></head>");
    const frameData = content.substring(firstIndex, lastIndex);
    /// Parse to json
    let frameDataJson = {
      streams: [{ play_url: "" }],
    };
    if (frameData) {
      frameDataJson = JSON.parse(frameData);
    }

    /// Push real video url
    videoLinks.push({
      "360P": frameDataJson["streams"][0]["play_url"],
    });
  }

  /// Mirror count
  const mirrorCount = (await browserPage.$$(".vmiror")).length;

  /// If mirror count is more than 1 then push the remaining resolution
  if (mirrorCount >= 1) {
    const vMirror = await browserPage.$$(".vmiror");

    /// First index
    const links = await vMirror[0].$$("a");

    /// Loop through all links
    for (const link in links) {
      if (Object.hasOwnProperty.call(links, link)) {
        const element = links[link];

        /// Resolution Text
        const text = await element.evaluate((el) => el.textContent);
        /// Embed URL
        const embedUrl = await element.evaluate((el) =>
          el.getAttribute("data-video")
        );

        // If text includes 720P and embed url doesn't contain token=none
        if (text.includes("720") && !embedUrl.includes("token=none")) {
          /// If video wasn't uploaded to the blogger, push certain link
          if (embedUrl?.includes("/uploads")) {
            /// Push embed url directly from blogger link
            videoEmbedLinks.push({
              "720P": `${process.env.ANOBOY_LINK}${embedUrl}`,
            });

            /// Get the real video url
            await newPage.goto(
              `${process.env.ANOBOY_LINK}${embedUrl}`,
              pageOptions
            );
            const frame = await newPage.$(".jw-video");
            if (frame) {
              const url = await frame.evaluate((el) => el.getAttribute("src"));
              /// Push real video url
              videoLinks.push({
                "720P": { play_url: url },
              });
            }
          } else if (embedUrl.includes("www.sharezweb.com")) {
            /// Push embed url directly from blogger link
            videoEmbedLinks.push({
              "720P": embedUrl,
            });

            /// Get the real video url
            await newPage.goto(embedUrl, pageOptions);
            const frameElement = await newPage.$(".plyr__video-wrapper");
            if (frameElement) {
              const link = await frameElement.evaluate((el) =>
                el.getElementsByTagName("video").item(0).getAttribute("src")
              );

              /// Push real video url
              videoLinks.push({
                "720P": link,
              });
            }
          } else {
            /// Push embed url directly from blogger link
            videoEmbedLinks.push({
              "720P": embedUrl,
            });

            /// Get the real video url
            await newPage.goto(embedUrl, pageOptions);
            const frame = await newPage.mainFrame();
            const content = await frame.content();
            const firstIndex = content.search(`{"thumbnail":`);
            const lastIndex = content.search("</script></head>");
            const frameData = content.substring(firstIndex, lastIndex);
            /// Parse to json
            let frameDataJson = {
              streams: [{ play_url: "" }],
            };
            if (frameData) {
              frameDataJson = JSON.parse(frameData);
            }

            /// Push real video url
            videoLinks.push({
              "720P": frameDataJson["streams"][0]["play_url"],
            });
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

  // Return the json data
  res.json({
    data: {
      name: name,
      synopsis: sinopsis,
      episode_navigation: episodeNavigation,
      video_embed_links: videoEmbedLinks,
      video_links: videoLinks,
    },
  });
};

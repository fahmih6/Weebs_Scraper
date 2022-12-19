// @ts-nocheck
const Crawler = require("crawler");
const puppeteer = require("puppeteer");
const PuppeteerBrowserOptions = require("../global/puppeteer_browser_options.js");
const arrayHelper = require("../helper/array-helper.js");
const PuppeteerSingleton = require("../helper/puppeteer_singleton..js");

module.exports.getDorama = async (req, res) => {
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;
  var c = new Crawler({
    // This will be called for each crawled page
    callback: (error, result, done) => {
      if (error) {
        console.log(error);

        res.json({
          error: error.message,
        });
      } else {
        var $ = result.$;

        var list = [];

        $(".post").each((i, el) => {
          let map = {};

          const title = $(el).find("h2").find("a").attr("title");
          const link = $(el)
            .find("h2")
            .find("a")
            .attr("href")
            .replace(`${process.env.DORAMAINDO_LINK}`, `${url}`)
            .replaceAll(`-`, `~`);

          const thumbnail = $(el)
            .find(".thumbnail")
            .find("a")
            .find("img")
            .attr("srcset");

          const thumbnailList = thumbnail.split(" ");
          const newThumbnail = thumbnailList[thumbnailList.length - 2];

          map["title"] = title;
          map["link"] = link;
          map["thumbnail"] = newThumbnail;

          list.push(map);
        });

        res.json({
          episodes: list,
        });
      }

      done();
    },
  });

  c.queue(`${process.env.DORAMAINDO_LINK}`);
};

module.exports.getDoramaDetail = async (req, res) => {
  const { param } = req.params;
  let tempParam = param.replaceAll(/~/gi, "-");
  const url = req.protocol + "://" + req.get("host") + req.baseUrl;

  /// Run Browser
  const browser = await puppeteer.launch(puppeteerOptions);

  /// Page
  const browserPage = await browser.newPage();
  await browserPage.goto(
    `${process.env.DORAMAINDO_LINK}/${tempParam}`,
    PuppeteerBrowserOptions.fastLoadOptions
  );

  /// Episode links
  let episodeLinks = {};

  /// Episode container
  const episodeContainer = await browserPage.$(".my-4");
  const episodeElements = await episodeContainer.$$("ul");

  /// Loop through all uls
  for (let index = 0; index < episodeElements.length; index++) {
    const element = episodeElements[index];
    const text = `Episode ${index + 1}`;

    /// Episode map
    episodeLinks[text] = [];

    /// Reso links
    const resoLinks = await element.$$("li");
    for (const key in resoLinks) {
      if (Object.hasOwnProperty.call(resoLinks, key)) {
        const resoElement = resoLinks[key];
        /// Resolution Text
        const resoTextElement = await resoElement.$("strong");
        const resoText = await resoTextElement.evaluate((el) => el.textContent);

        /// Resolution Link
        const resoLinkElements = await resoElement.$$("a");
        for (const key in resoLinkElements) {
          if (Object.hasOwnProperty.call(resoLinkElements, key)) {
            const resoLinkElement = resoLinkElements[key];
            const resoLink = await resoLinkElement.evaluate((el) => {
              /// Return only zippyshare link
              if (
                el.getAttribute("href") &&
                el.textContent.toLocaleLowerCase().includes("zippyshare")
              ) {
                return el.getAttribute("href");
              }
            });

            /// Make sure resolution link is found
            if (resoLink) {
              let resoMap = {};
              resoMap[resoText] = resoLink;
              episodeLinks[text].push(resoMap);
              break;
            }
          }
        }
      }
    }
  }

  /// Judul
  const judulElement = await browserPage.$(".jdl");
  const judulText = await judulElement.evaluate((el) => el.textContent);

  /// Sinopsis
  const sinopsisElement = await browserPage.$(
    "body > div.container > div:nth-child(6) > div.eight.columns > div.content-wrapper > article > div.text > div.text"
  );
  let sinopsisText = "";
  const sinopsisTextElements = await sinopsisElement.$$("p");
  for (const key in sinopsisTextElements) {
    if (Object.hasOwnProperty.call(sinopsisTextElements, key)) {
      const element = sinopsisTextElements[key];
      const text = await element.evaluate((el) => el.textContent);
      sinopsisText += ` ${text}`;
    }
  }

  res.json({
    title: judulText,
    sinopsis: sinopsisText.trim(),
    episode_links: episodeLinks,
  });

  await browserPage.close();
};

/// Get video link from zippyshare
module.exports.getVideoLink = async (req, res) => {
  const body = req.body;

  if (body.hasOwnProperty("url")) {
    const url = body["url"];
    /// Run Browser
    const browser = await PuppeteerSingleton.getBrowser();

    /// Page
    const browserPage = await browser.newPage();
    await browserPage.goto(url, PuppeteerBrowserOptions.fullLoadOptions);
    const lastUrl = await browserPage.$eval("#dlbutton", (el) =>
      el.getAttribute("href")
    );
    const { hostname } = new URL(url);
    const directLink = hostname + lastUrl;

    await browserPage.close();

    res.json({
      link: directLink,
    });
  } else {
    res.json({
      error: "No URL Specified",
    });
  }
};

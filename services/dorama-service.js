const Crawler = require("crawler");
const puppeteer = require("puppeteer");
const arrayHelper = require("../helper/array-helper.js");

module.exports.getDorama = async (req, res) => {
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
          const link = $(el).find("h2").find("a").attr("href");
          const thumbnail = $(el)
            .find(".thumbnail")
            .find("a")
            .find("img")
            .attr("src");

          map["title"] = title;
          map["link"] = link;
          map["thumbnail"] = thumbnail;

          list.push(map);
        });

        res.json({
          episodes: list,
        });
      }

      done();
    },
  });

  c.queue("https://dorama.doramaindo.ai/");
};

module.exports.getDoramaDetail = async (req, res) => {
  const { param } = req.params;
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

        $(".ep")
          .find(".linkstream")
          .each((i, el) => {
            let map = {};

            const text = $(el).find("h4").text();
            const link = $(el).find("a").attr("link");

            map[text] = link;

            list.push(map);
          });

        res.json({
          episodes: list,
        });
      }

      done();
    },
  });

  c.queue(
    "https://dorama.doramaindo.ai/ase-to-sekken-2022-subtitle-indonesia.html"
  );
};

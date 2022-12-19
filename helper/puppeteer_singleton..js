const puppeteer = require("puppeteer");

var PuppeteerSingleton = (function () {
  const puppeteerOptions = {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--devtools=false",
    ],
  };

  /**
   * Initialize browser
   * @return {puppeteer.Browser} Browser type
   */
  function SingletonBrowser() {
    /// Run Browser
    return puppeteer.launch(puppeteerOptions);
  }

  /// Browser
  var browser;

  /// Return instance
  return {
    /**
     * @return {puppeteer.Browser} Browser type
     */
    getBrowser: async function () {
      if (browser == null) {
        browser = await new SingletonBrowser();
        browser.constructor = null;
      }
      return browser;
    },
  };
})();

module.exports = PuppeteerSingleton;

const puppeteer = require("puppeteer");

var PuppeteerSingleton = (function () {
  const puppeteerOptions = {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--single-process",
      "--no-zygote",
      "--no-first-run",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-skip-list",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--hide-scrollbars",
      "--disable-notifications",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-breakpad",
      "--disable-component-extensions-with-background-pages",
      "--disable-extensions",
      "--disable-features=TranslateUI,BlinkGenPropertyTrees",
      "--disable-ipc-flooding-protection",
      "--disable-renderer-backgrounding",
      "--mute-audio",
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

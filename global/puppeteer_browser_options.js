class PuppeteerBrowserOptions {
  /// Full page load
  static fullLoadOptions = {
    waitUntil: "networkidle2",
    timeout: 0,
  };

  /// Fast page load
  static fastLoadOptions = {
    waitUntil: "domcontentloaded",
    timeout: 0,
  };
}

module.exports = PuppeteerBrowserOptions;

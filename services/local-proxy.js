const axios = require("axios");

/// Proxy Service
class ProxyService {
  /**
   * Validates if the target URL is safe to proxy
   * @param {string} urlString - The URL to validate
   * @returns {boolean} - True if safe, false otherwise
   */
  static isValidTargetUrl(urlString) {
    try {
      const url = new URL(urlString);
      const hostname = url.hostname.toLowerCase();

      // Block local and private addresses
      const privateRanges = [
        /^127\./, // Loopback
        /^10\./, // Private Class A
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
        /^192\.168\./, // Private Class C
        /^169\.254\./, // Link-local
        /^localhost$/, // Localhost
        /^0\./, // Current network
      ];

      if (privateRanges.some((range) => range.test(hostname))) {
        return false;
      }

      // Ensure protocol is http or https
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /// Stream data
  static async stream(req, res) {
    /// Get the url from query params
    const url = req.query.url;

    /// Validate the url
    if (!url || !this.isValidTargetUrl(url)) {
      return res.status(400).json({
        error:
          "Invalid or unsafe URL. Access to internal networks is prohibited.",
      });
    }

    /// Get image
    try {
      const response = await axios.get(url, { responseType: "stream" });
      /// Content
      res.setHeader("Content-Type", response.headers["content-type"]);
      /// Pipe the result
      response.data.pipe(res);
    } catch (err) {
      console.error("Failed to proxy :", err.message);
      res.status(500).json({ error: `Failed to proxy : ${err.message}` });
    }
  }
}

module.exports = ProxyService;

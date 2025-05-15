const axios = require("axios");

/// Proxy Service
class ProxyService {
  /// Stream data
  static async stream(req, res) {
    /// Get the url from query params
    const url = req.query.url;

    /// Validate the url
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
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

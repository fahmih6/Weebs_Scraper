const corsAnywhere = require("cors-anywhere");

/**
 * CORS Proxy Service
 * Provides CORS-anywhere proxy functionality for external resources
 */
class CorsProxyService {
  constructor() {
    // Get allowed origins from environment or use wildcard
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(",")
      : [];

    // Create CORS proxy server instance
    this.proxy = corsAnywhere.createServer({
      originWhitelist: allowedOrigins,
      requireHeaders: [],
      removeHeaders: ["cookie", "cookie2"],
      redirectSameOrigin: false,
      httpProxyOptions: {
        xfwd: false,
      },
    });
  }

  /**
   * Handle proxy request
   * @param {*} req - Express request object
   * @param {*} res - Express response object
   */
  handleRequest(req, res) {
    // Get the URL to proxy from the path
    const pathParts = req.path.split("/").filter((p) => p);
    const targetUrl =
      pathParts.length > 0 ? decodeURIComponent(pathParts.join("/")) : "";

    // Validate URL
    if (
      !targetUrl ||
      (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://"))
    ) {
      return res.status(400).json({
        error: "Invalid URL. Must provide a valid HTTP/HTTPS URL to proxy.",
      });
    }

    // Modify the request to work with cors-anywhere
    req.url = "/" + targetUrl;

    // Emit the request event to cors-anywhere
    this.proxy.emit("request", req, res);
  }
}

module.exports = new CorsProxyService();

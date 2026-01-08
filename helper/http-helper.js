const { default: axios } = require("axios");

/**
 * Centralized HTTP helper for standardizing requests.
 */
const http = axios.create({
  timeout: 10000, // 10 seconds timeout
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  },
  proxy: false,
});

module.exports = http;

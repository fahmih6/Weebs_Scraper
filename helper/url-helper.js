/**
 * URL Helper Utility
 * Provides functions to wrap external URLs with CORS proxy
 */

/**
 * Wraps an external URL with the CORS proxy
 * @param {string} url - The external URL to wrap
 * @param {string} baseUrl - The base URL of the API (e.g., http://localhost:3000/api/anoboy)
 * @returns {string|null} - The proxied URL or null if input is invalid
 */
function wrapWithCorsProxy(url, baseUrl) {
  // Return null for invalid inputs or non-string types
  if (!url || typeof url !== "string" || url === "") {
    return null;
  }

  // Don't wrap if already proxied
  if (url.includes("/api/proxy")) {
    return url;
  }

  // Don't wrap relative URLs or data URLs
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }

  // Extract the base domain from baseUrl (e.g., http://localhost:3000)
  const baseUrlParts = baseUrl.split("/api/");
  const baseDomain = baseUrlParts[0];

  // Encode the URL to be proxied
  const encodedUrl = encodeURIComponent(url);

  // Return the proxied URL
  return `${baseDomain}/api/proxy?url=${encodedUrl}`;
}

/**
 * Wraps an array of URLs with the CORS proxy
 * @param {string[]} urls - Array of URLs to wrap
 * @param {string} baseUrl - The base URL of the API
 * @returns {string[]} - Array of proxied URLs
 */
function wrapArrayWithCorsProxy(urls, baseUrl) {
  if (!Array.isArray(urls)) {
    return [];
  }

  return urls
    .map((url) => wrapWithCorsProxy(url, baseUrl))
    .filter((url) => url !== null);
}

/**
 * Wraps video link objects (with resolution and link properties) with CORS proxy
 * @param {Array<{resolution: string, link: string}>} videoLinks - Array of video link objects
 * @param {string} baseUrl - The base URL of the API
 * @returns {Array<{resolution: string, link: string}>} - Array of proxied video link objects
 */
function wrapVideoLinksWithCorsProxy(videoLinks, baseUrl) {
  if (!Array.isArray(videoLinks)) {
    return [];
  }

  return videoLinks
    .map((videoLink) => {
      // If it's an object with a link property, wrap the link
      if (videoLink && typeof videoLink === "object" && videoLink.link) {
        return {
          ...videoLink,
          link: wrapWithCorsProxy(videoLink.link, baseUrl) || videoLink.link,
        };
      }
      // If it's just a string, wrap it directly
      if (typeof videoLink === "string") {
        return wrapWithCorsProxy(videoLink, baseUrl);
      }
      // Otherwise return as-is
      return videoLink;
    })
    .filter((item) => item !== null);
}

module.exports = {
  wrapWithCorsProxy,
  wrapArrayWithCorsProxy,
  wrapVideoLinksWithCorsProxy,
};

const { default: axios } = require("axios");

/**
 * Voratoon Origin Helper
 *
 * The Voratoon API answers 403 to any origin that doesn't match the site's
 * current domain, and the site's versioned domain (v1, v2, ...) moves every
 * few days. This helper keeps track of the live domain so callers never have
 * to hardcode it:
 *
 * 1. Scrape voratoon.com links off the stable landing page — its
 *    "Masuk ke Website Utama" button points at the live domain.
 * 2. Follow redirects from the fallback seed domain — stale versioned
 *    domains 301 to the live one.
 * 3. Validate every candidate against the API and accept the first 200.
 *
 * The resolved origin is cached for ORIGIN_TTL_MS; a 403 on an API call
 * triggers an immediate re-discovery and a single retry. Setting
 * VORATOON_LINK (or VORAATOON_LINK) pins the origin and disables discovery.
 */

const VORATOON_API = process.env.VORATOON_API_LINK || "https://api.voratoon.com";
const VORATOON_LANDING =
  process.env.VORATOON_LANDING_LINK || "https://voratoon.id";
// Last-resort origin (and redirect seed) when discovery fails; keep in sync
// with the current site (v6 as of 2026-10-05).
const VORATOON_FALLBACK_LINK = "https://v6.voratoon.com";
// A pinned origin short-circuits discovery entirely.
const VORATOON_PINNED_LINK =
  process.env.VORATOON_LINK || process.env.VORAATOON_LINK || null;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36";

// The versioned domain only moves every few days, so this recheck interval
// is cheap insurance against a domain move nobody noticed.
const ORIGIN_TTL_MS = 15 * 60 * 1000;

let cachedOrigin = null;
let cachedAt = 0;
let resolvePromise = null;

/**
 * @param {string} origin
 */
function axiosConfigFor(origin) {
  return {
    proxy: false,
    timeout: 15000,
    headers: {
      origin,
      referer: `${origin}/`,
      "user-agent": USER_AGENT,
    },
  };
}

/**
 * Check whether the API accepts this origin (200) or rejects it (403).
 * @param {string} origin
 * @returns {Promise<boolean>}
 */
async function isOriginValid(origin) {
  try {
    const res = await axios.get(`${VORATOON_API}/series?take=1&page=1`, {
      ...axiosConfigFor(origin),
      timeout: 10000,
      validateStatus: () => true,
    });
    return res.status === 200;
  } catch (err) {
    console.error(`Voratoon origin check failed for ${origin}: ${err.message}`);
    return false;
  }
}

/**
 * Every voratoon.com origin linked from the landing page — the
 * "Masuk ke Website Utama" button points at the live domain.
 * @returns {Promise<string[]>}
 */
async function candidatesFromLandingPage() {
  try {
    const { data } = await axios.get(VORATOON_LANDING, {
      proxy: false,
      timeout: 10000,
      headers: { "user-agent": USER_AGENT },
    });
    if (typeof data !== "string") return [];
    const matches = data.matchAll(
      /https:\/\/(?:[a-z0-9-]+\.)*voratoon\.com(?::\d+)?/gi
    );
    return [
      ...new Set([...matches].map((m) => m[0].replace(/\/+$/, ""))),
    ].filter((candidate) => candidate !== VORATOON_API);
  } catch (err) {
    console.error(
      `Voratoon origin discovery: landing page fetch failed: ${err.message}`
    );
    return [];
  }
}

/**
 * Origins collected by following the redirect chain of a versioned domain —
 * stale domains 301 to the live one.
 * @param {string} seedUrl
 * @returns {Promise<string[]>}
 */
async function candidatesFromRedirects(seedUrl) {
  const origins = [];
  let current = seedUrl;
  try {
    for (let hop = 0; hop < 5; hop++) {
      const res = await axios.get(current, {
        proxy: false,
        timeout: 10000,
        maxRedirects: 0,
        headers: { "user-agent": USER_AGENT },
        validateStatus: () => true,
      });
      const location = res.headers.location;
      if (![301, 302, 303, 307, 308].includes(res.status) || !location) break;
      const next = new URL(location, current).origin;
      if (!origins.includes(next)) origins.push(next);
      current = next;
    }
  } catch (err) {
    console.error(
      `Voratoon origin discovery: redirect follow failed for ${seedUrl}: ${err.message}`
    );
  }
  return origins;
}

/**
 * Find the live domain: landing-page links first, then redirect chains from
 * the fallback seed, validating each candidate against the API. Falls back
 * to the last known good origin, then to the hardcoded fallback.
 * @returns {Promise<string>}
 */
async function resolveOrigin() {
  const candidates = [
    ...(await candidatesFromLandingPage()),
    ...(await candidatesFromRedirects(VORATOON_FALLBACK_LINK)),
    VORATOON_FALLBACK_LINK,
  ];

  for (const candidate of candidates) {
    if (await isOriginValid(candidate)) {
      console.log(`Voratoon origin resolved: ${candidate}`);
      return candidate;
    }
  }

  if (cachedOrigin) {
    console.warn(
      `Voratoon origin discovery failed; keeping last known origin ${cachedOrigin}`
    );
    return cachedOrigin;
  }

  console.warn(
    `Voratoon origin discovery failed; falling back to ${VORATOON_FALLBACK_LINK}`
  );
  return VORATOON_FALLBACK_LINK;
}

/**
 * The live site origin, cached for ORIGIN_TTL_MS. Concurrent callers share
 * one discovery run.
 * @param {{forceRefresh?: boolean}} [options]
 * @returns {Promise<string>}
 */
async function getVoratoonLink({ forceRefresh = false } = {}) {
  if (VORATOON_PINNED_LINK) return VORATOON_PINNED_LINK;

  const now = Date.now();
  if (!forceRefresh && cachedOrigin && now - cachedAt < ORIGIN_TTL_MS) {
    return cachedOrigin;
  }
  if (!resolvePromise) {
    resolvePromise = resolveOrigin()
      .then((origin) => {
        cachedOrigin = origin;
        cachedAt = Date.now();
        return origin;
      })
      .finally(() => {
        resolvePromise = null;
      });
  }
  return resolvePromise;
}

/**
 * GET an API URL with the discovered origin. On a 403 — the marker of a
 * stale origin — rediscover the live domain and retry once.
 * @param {string} url
 * @returns {Promise<object>} axios response
 */
async function voratoonGet(url) {
  const origin = await getVoratoonLink();
  try {
    return await axios.get(url, axiosConfigFor(origin));
  } catch (err) {
    if (err.response?.status !== 403) throw err;
    console.warn(`Voratoon API rejected origin ${origin}; rediscovering`);
    const refreshed = await getVoratoonLink({ forceRefresh: true });
    return await axios.get(url, axiosConfigFor(refreshed));
  }
}

// Warm the origin cache at startup so the first request doesn't pay for it.
getVoratoonLink().catch(() => {});

module.exports = {
  VORATOON_API,
  getVoratoonLink,
  voratoonGet,
};

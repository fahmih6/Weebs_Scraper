const router = require("express").Router();
const corsProxyService = require("../services/cors-proxy-service.js");

// Handle all proxy requests
// The URL to proxy should be URL-encoded in the path
router.get("/*", (req, res) => corsProxyService.handleRequest(req, res));

module.exports = router;

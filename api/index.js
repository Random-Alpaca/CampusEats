/**
 * Vercel Serverless Function entry point.
 *
 * Vercel auto-discovers files in /api and treats each export as a handler.
 * We import the full Express app and let it handle all /api/* routes.
 */
const app = require('../server/index');

module.exports = app;

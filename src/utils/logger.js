'use strict';

const morgan = require('morgan');
const env = require('../config/env');

/**
 * HTTP request logger.
 *
 * In development: uses the colourful 'dev' format for readability.
 * In production:  uses 'combined' (Apache-style) which is parseable by log aggregators.
 * In test:        disabled to keep test output clean.
 */
const httpLogger = morgan(env.isProduction ? 'combined' : 'dev', {
  skip: () => env.isTest, // Suppress logs during test runs
});

/**
 * Application-level error logger.
 * Separates error-level output so it can be piped to stderr or a dedicated
 * log sink in production without mixing with request logs.
 *
 * @param {Error}  err  - The error object
 * @param {string} context - Where the error originated (optional)
 */
const logError = (err, context = 'App') => {
  const timestamp = new Date().toISOString();
  const message = err?.message || String(err);
  const stack = env.isDevelopment && err?.stack ? `\n${err.stack}` : '';
  // eslint-disable-next-line no-console
  console.error(`[${timestamp}] [ERROR] [${context}] ${message}${stack}`);
};

/**
 * Application-level info logger.
 */
const logInfo = (message, context = 'App') => {
  if (env.isTest) return;
  const timestamp = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[${timestamp}] [INFO] [${context}] ${message}`);
};

module.exports = { httpLogger, logError, logInfo };

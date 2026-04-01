'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Global rate limiter — applied to the entire API.
 *
 * Defaults: 100 requests per 15 minutes per IP (configurable via .env).
 * The handler returns our standard error envelope so clients that parse
 * JSON errors don't need a special case for rate-limit responses.
 */
const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  skip: () => env.isTest, // Disable in tests to avoid open handles from timers
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: MESSAGES.RATE_LIMIT_EXCEEDED,
      errors: [],
    });
  },
});

/**
 * Stricter rate limiter for auth endpoints to mitigate brute-force attacks.
 * 10 requests per 15 minutes per IP.
 */
const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 10,
  skip: () => env.isTest, // Disable in tests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
      errors: [],
    });
  },
});

module.exports = { globalRateLimiter, authRateLimiter };

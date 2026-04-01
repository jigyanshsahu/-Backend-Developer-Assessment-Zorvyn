'use strict';

require('dotenv').config();

/**
 * Central environment configuration.
 * Validates required variables at startup — the app will crash early
 * with a clear message rather than failing silently at runtime.
 */

const REQUIRED_ENV_VARS = ['MONGO_URI', 'JWT_SECRET'];

const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `[Config] Missing required environment variables: ${missing.join(', ')}\n` +
      'Copy .env.example to .env and fill in the values.'
  );
  process.exit(1);
}

const env = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_VERSION: process.env.API_VERSION || 'v1',

  // Database
  MONGO_URI: process.env.MONGO_URI,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Bcrypt
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  // CORS
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map((o) => o.trim()),

  // Helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

module.exports = env;

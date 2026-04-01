'use strict';

/**
 * Application-wide constants.
 * Using a constants file avoids magic strings scattered across the codebase
 * and provides a single place to update shared values.
 */

const ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
});

const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
});

const MESSAGES = Object.freeze({
  // Auth
  REGISTER_SUCCESS: 'Registration successful',
  LOGIN_SUCCESS: 'Login successful',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'An account with this email already exists',
  UNAUTHORIZED: 'Authentication required. Please log in.',
  FORBIDDEN: 'You do not have permission to perform this action',
  TOKEN_INVALID: 'Invalid or expired token',

  // Posts
  POST_CREATED: 'Post created successfully',
  POST_UPDATED: 'Post updated successfully',
  POST_DELETED: 'Post deleted successfully',
  POST_NOT_FOUND: 'Post not found',
  POSTS_FETCHED: 'Posts retrieved successfully',
  POST_FETCHED: 'Post retrieved successfully',

  // Generic
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION_ERROR: 'Validation failed',
  NOT_FOUND: 'Resource not found',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
});

module.exports = { ROLES, PAGINATION, HTTP_STATUS, MESSAGES };

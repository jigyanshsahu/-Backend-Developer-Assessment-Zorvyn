'use strict';

const { PAGINATION } = require('../config/constants');

/**
 * Parses and validates pagination parameters from the query string.
 *
 * @param {object} query  - Express req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
const parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Builds pagination metadata to include in list API responses.
 *
 * @param {number} total  - Total number of matching documents
 * @param {number} page   - Current page
 * @param {number} limit  - Items per page
 * @returns {{ page, limit, total, totalPages, hasNext, hasPrev }}
 */
const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

module.exports = { parsePaginationParams, getPaginationMeta };

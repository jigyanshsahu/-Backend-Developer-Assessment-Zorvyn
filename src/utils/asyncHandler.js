'use strict';

/**
 * Wraps an async Express route handler to forward any rejected promise
 * to Express's next() error-handling middleware.
 *
 * Usage:
 *   router.get('/path', asyncHandler(myController.method));
 *
 * This eliminates repetitive try/catch blocks in every controller and ensures
 * all unhandled async errors are caught and processed by the global error handler.
 *
 * @param {Function} fn - Async route handler (req, res, next) => Promise
 * @returns {Function}  - Standard Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

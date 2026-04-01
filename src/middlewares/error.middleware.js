'use strict';

const mongoose = require('mongoose');
const { ZodError } = require('zod');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { sendError } = require('../utils/response');
const { logError } = require('../utils/logger');

/**
 * Centralised error handling middleware.
 *
 * Express identifies this as an error handler because it has 4 parameters (err, req, res, next).
 * It is placed LAST in the middleware chain in app.js.
 *
 * Handled error types:
 *  - Zod validation errors        → 422 with field details
 *  - Mongoose ValidationError     → 422 with field details
 *  - Mongoose CastError (bad ID)  → 400
 *  - Mongoose duplicate key (E11000) → 409
 *  - JWT errors                   → 401
 *  - Generic / unrecognised       → 500
 *
 * In production the stack trace is hidden from the client.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logError(err, `${req.method} ${req.originalUrl}`);

  // ── Zod validation error (from validate middleware re-throws) ────────────
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(res, MESSAGES.VALIDATION_ERROR, errors, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  // ── Mongoose field-level validation error ────────────────────────────────
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, MESSAGES.VALIDATION_ERROR, errors, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  // ── Mongoose invalid ObjectId (e.g. /posts/not-an-id) ───────────────────
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return sendError(
      res,
      `Invalid ID format: '${err.value}' is not a valid resource ID`,
      [],
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // ── MongoDB duplicate key (unique index violation) ───────────────────────
  if (err.code === 11000 || err.code === 11001) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return sendError(
      res,
      `A record with this ${field} already exists`,
      [{ field, message: `${field} must be unique` }],
      HTTP_STATUS.CONFLICT
    );
  }

  // ── JWT errors (should be caught in middleware, but defensive fallback) ──
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, MESSAGES.TOKEN_INVALID, [], HTTP_STATUS.UNAUTHORIZED);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token has expired. Please log in again.', [], HTTP_STATUS.UNAUTHORIZED);
  }

  // ── Application-level operational errors (thrown intentionally) ──────────
  if (err.isOperational) {
    return sendError(res, err.message, err.errors || [], err.statusCode || HTTP_STATUS.BAD_REQUEST);
  }

  // ── Unknown / programming errors ─────────────────────────────────────────
  // Never expose internal details in production
  const message = process.env.NODE_ENV === 'production' ? MESSAGES.SERVER_ERROR : err.message;
  return sendError(res, message, [], err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

/**
 * Lightweight "operational" error class.
 * Services throw this to signal expected failure conditions (not found, forbidden, etc.)
 * without going through the generic 500 path.
 */
class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.BAD_REQUEST, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };

'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { sendError } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * `protect` middleware — verifies the Bearer JWT and attaches the authenticated
 * user to req.user. Any route using this middleware requires a valid token.
 */
const protect = asyncHandler(async (req, res, next) => {
  // 1. Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, MESSAGES.UNAUTHORIZED, [], HTTP_STATUS.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  // 2. Verify token signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token has expired. Please log in again.' : MESSAGES.TOKEN_INVALID;
    return sendError(res, message, [], HTTP_STATUS.UNAUTHORIZED);
  }

  // 3. Check the user still exists and is active
  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) {
    return sendError(res, MESSAGES.UNAUTHORIZED, [], HTTP_STATUS.UNAUTHORIZED);
  }

  req.user = user;
  return next();
});

/**
 * `authorize` middleware — RBAC gate that must be placed AFTER `protect`.
 * Accepts one or more allowed roles.
 *
 * Usage: router.delete('/:id', protect, authorize('admin'), controller.remove);
 *
 * @param {...string} roles - Allowed role strings (e.g., 'admin', 'user')
 */
const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, MESSAGES.FORBIDDEN, [], HTTP_STATUS.FORBIDDEN);
    }
    return next();
  };

module.exports = { protect, authorize };

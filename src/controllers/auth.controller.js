'use strict';

const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Auth controller — request/response handling ONLY.
 * All business logic lives in authService.
 */

/**
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, MESSAGES.REGISTER_SUCCESS, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, MESSAGES.LOGIN_SUCCESS);
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's profile (req.user set by protect middleware).
 */
const getMe = (req, res) => {
  return sendSuccess(res, { user: req.user }, 'Profile retrieved successfully');
};

module.exports = { register, login, getMe };

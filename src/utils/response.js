'use strict';

const { HTTP_STATUS } = require('../config/constants');

/**
 * Sends a standardised success response.
 *
 * @param {import('express').Response} res
 * @param {*} data          - Payload to return
 * @param {string} message  - Human-readable message (optional)
 * @param {number} status   - HTTP status code (default 200)
 */
const sendSuccess = (res, data = null, message = 'Success', status = HTTP_STATUS.OK) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(status).json(body);
};

/**
 * Sends a standardised error response.
 *
 * @param {import('express').Response} res
 * @param {string} message  - Human-readable error message
 * @param {Array}  errors   - Field-level validation errors (optional)
 * @param {number} status   - HTTP status code (default 500)
 */
const sendError = (res, message = 'Error', errors = [], status = HTTP_STATUS.INTERNAL_SERVER_ERROR) => {
  const body = { success: false, message };
  if (errors.length > 0) body.errors = errors;
  return res.status(status).json(body);
};

module.exports = { sendSuccess, sendError };

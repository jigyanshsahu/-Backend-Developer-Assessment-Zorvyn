'use strict';

const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { sendError } = require('../utils/response');

/**
 * Generic Zod validation middleware factory.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), authController.register);
 *   router.get('/',          validate(querySchema, 'query'), postController.getAll);
 *
 * When validation fails, the middleware responds immediately with a 422 and
 * a list of field-level errors — the route handler is never invoked.
 *
 * @param {import('zod').ZodSchema} schema     - The Zod schema to validate against
 * @param {'body'|'query'|'params'} target     - Which part of req to validate (default: 'body')
 * @returns {import('express').RequestHandler}
 */
const validate = (schema, target = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[target]);

  if (!result.success) {
    // Map Zod's ZodError issues into our standard { field, message } shape
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || target,
      message: issue.message,
    }));

    return sendError(res, MESSAGES.VALIDATION_ERROR, errors, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  // Attach the parsed (and coerced) data back to the request
  // This ensures validated, type-correct data flows to controllers
  req[target] = result.data;
  return next();
};

module.exports = validate;

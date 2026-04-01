'use strict';

const { z } = require('zod');

/**
 * Auth validation schemas.
 *
 * Password policy: min 8 chars, at least one uppercase, one lowercase, one digit.
 * This is checked at the validation layer so the service never receives weak passwords.
 */

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),

  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),

  password: passwordSchema,
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),

  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };

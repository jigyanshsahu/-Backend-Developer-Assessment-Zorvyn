'use strict';

const { z } = require('zod');

/**
 * Post validation schemas.
 *
 * Design decision: `updatePostSchema` uses `.partial()` so callers only need
 * to send the fields they intend to change. At least one field is required
 * via `.refine()` to prevent empty PATCH requests.
 */

const createPostSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),

  content: z
    .string({ required_error: 'Content is required' })
    .trim()
    .min(10, 'Content must be at least 10 characters'),

  tags: z
    .array(z.string().trim().min(1, 'Tag must not be empty'))
    .max(10, 'A post can have at most 10 tags')
    .default([]),
});

const updatePostSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200).optional(),
    content: z.string().trim().min(10, 'Content must be at least 10 characters').optional(),
    tags: z.array(z.string().trim().min(1)).max(10).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (title, content, or tags) must be provided for update',
  });

/**
 * Query parameter schema for GET /posts.
 * All fields are optional; defaults are applied by the pagination utility.
 */
const querySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  tags: z.string().trim().optional(), // comma-separated, parsed in service
});

module.exports = { createPostSchema, updatePostSchema, querySchema };

'use strict';

const { Router } = require('express');
const postController = require('../controllers/post.controller');
const { createPostSchema, updatePostSchema, querySchema } = require('../validators/post.validator');
const validate = require('../validators/validate');
const { protect } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────

/**
 * @openapi
 * /posts:
 *   get:
 *     tags: [Posts]
 *     summary: List all posts (paginated, searchable)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Keyword search in title and content (case-insensitive)
 *       - in: query
 *         name: tags
 *         schema: { type: string }
 *         description: Comma-separated tags to filter by (AND logic, e.g. nodejs,express)
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, updatedAt, title], default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated list of posts
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         posts:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Post'
 *                         meta:
 *                           $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/', validate(querySchema, 'query'), asyncHandler(postController.getAll));

/**
 * @openapi
 * /posts/{id}:
 *   get:
 *     tags: [Posts]
 *     summary: Get a single post by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the post
 *     responses:
 *       200:
 *         description: Post found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         post:
 *                           $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid post ID format
 *       404:
 *         description: Post not found or soft-deleted
 */
router.get('/:id', asyncHandler(postController.getOne));

// ── Protected routes (require JWT) ────────────────────────────────────────────

/**
 * @openapi
 * /posts:
 *   post:
 *     tags: [Posts]
 *     summary: Create a new post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostRequest'
 *           example:
 *             title: Clean Architecture in Node.js
 *             content: This article explores how to structure a Node.js application...
 *             tags: [nodejs, architecture, backend]
 *     responses:
 *       201:
 *         description: Post created
 *       401:
 *         description: Not authenticated
 *       422:
 *         description: Validation failed
 */
router.post('/', protect, validate(createPostSchema), asyncHandler(postController.create));

/**
 * @openapi
 * /posts/{id}:
 *   patch:
 *     tags: [Posts]
 *     summary: Update a post (owner or admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePostRequest'
 *           example:
 *             title: Updated Title
 *             tags: [updated, nodejs]
 *     responses:
 *       200:
 *         description: Post updated
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not the owner or admin
 *       404:
 *         description: Post not found
 *       422:
 *         description: Validation failed
 */
router.patch('/:id', protect, validate(updatePostSchema), asyncHandler(postController.update));

/**
 * @openapi
 * /posts/{id}:
 *   delete:
 *     tags: [Posts]
 *     summary: Soft-delete a post (owner or admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Post soft-deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not the owner or admin
 *       404:
 *         description: Post not found
 */
router.delete('/:id', protect, asyncHandler(postController.remove));

module.exports = router;

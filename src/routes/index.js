'use strict';

const { Router } = require('express');
const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');
const { sendSuccess } = require('../utils/response');

const router = Router();

// ── Health check (useful for Docker Compose and load balancers) ───────────────
/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: API health check
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: API is healthy
 *               data:
 *                 status: ok
 *                 timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/health', (req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() }, 'API is healthy');
});

// ── Domain routes ─────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);

module.exports = router;

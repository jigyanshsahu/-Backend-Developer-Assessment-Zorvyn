'use strict';

const postService = require('../services/post.service');
const { sendSuccess } = require('../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Post controller — request/response handling ONLY.
 * All business logic and authorization lives in postService.
 */

/**
 * POST /api/v1/posts
 */
const create = async (req, res, next) => {
  try {
    const post = await postService.createPost(req.body, req.user._id);
    return sendSuccess(res, { post }, MESSAGES.POST_CREATED, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/v1/posts/:id
 */
const getOne = async (req, res, next) => {
  try {
    const post = await postService.getPostById(req.params.id);
    return sendSuccess(res, { post }, MESSAGES.POST_FETCHED);
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/v1/posts
 * Supports: ?page=1&limit=10&search=keyword&tags=node,js&sortBy=createdAt&order=desc
 */
const getAll = async (req, res, next) => {
  try {
    const { posts, meta } = await postService.getAllPosts(req.query);
    return sendSuccess(res, { posts, meta }, MESSAGES.POSTS_FETCHED);
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/v1/posts/:id
 */
const update = async (req, res, next) => {
  try {
    const post = await postService.updatePost(req.params.id, req.body, req.user);
    return sendSuccess(res, { post }, MESSAGES.POST_UPDATED);
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/v1/posts/:id
 */
const remove = async (req, res, next) => {
  try {
    await postService.softDeletePost(req.params.id, req.user);
    return sendSuccess(res, null, MESSAGES.POST_DELETED);
  } catch (err) {
    return next(err);
  }
};

module.exports = { create, getOne, getAll, update, remove };

'use strict';

const Post = require('../models/Post');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { AppError } = require('../middlewares/error.middleware');
const { parsePaginationParams, getPaginationMeta } = require('../utils/pagination');

// create a new post
const createPost = async (dto, authorId) => {
  const post = await Post.create({ ...dto, author: authorId });
  await post.populate('author', 'name email');
  return post;
};

// get post by id
const getPostById = async (postId) => {
  const post = await Post.findOne({ _id: postId, isDeleted: false }).populate('author', 'name email');
  if (!post) {
    throw new AppError(MESSAGES.POST_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  return post;
};

// get all posts with search and logic
const getAllPosts = async (query) => {
  const { page, limit, skip } = parsePaginationParams(query);
  const { search, tags, sortBy = 'createdAt', order = 'desc' } = query;

  const filter = { isDeleted: false };

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ title: regex }, { content: regex }];
  }

  if (tags) {
    const tagList = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (tagList.length > 0) {
      filter.tags = { $all: tagList };
    }
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sortOptions = { [sortBy]: sortOrder };

  const [total, posts] = await Promise.all([
    Post.countDocuments(filter),
    Post.find(filter)
      .populate('author', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const meta = getPaginationMeta(total, page, limit);
  return { posts, meta };
};

// update post
const updatePost = async (postId, dto, user) => {
  const post = await Post.findOne({ _id: postId, isDeleted: false });
  if (!post) {
    throw new AppError(MESSAGES.POST_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // check if owner or admin
  const isOwner = post.author.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  Object.assign(post, dto);
  await post.save();
  await post.populate('author', 'name email');
  return post;
};

// soft delete
const softDeletePost = async (postId, user) => {
  const post = await Post.findOne({ _id: postId, isDeleted: false });
  if (!post) {
    throw new AppError(MESSAGES.POST_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const isOwner = post.author.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  post.isDeleted = true;
  await post.save();
};

module.exports = { createPost, getPostById, getAllPosts, updatePost, softDeletePost };

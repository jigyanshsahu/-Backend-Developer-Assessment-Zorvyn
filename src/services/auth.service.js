'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { AppError } = require('../middlewares/error.middleware');

// sign jwt token
const signToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

// register user
const register = async (dto) => {
  const { name, email, password } = dto;

  // check if email exists
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(MESSAGES.EMAIL_EXISTS, HTTP_STATUS.CONFLICT);
  }

  const user = await User.create({ name, email, password });

  const token = signToken(user._id);

  const userObj = user.toJSON();
  delete userObj.password;

  return { token, user: userObj };
};

// login user
const login = async (dto) => {
  const { email, password } = dto;

  const user = await User.findOne({ email }).select('+password');

  const isMatch = user ? await user.comparePassword(password) : false;

  if (!user || !isMatch) {
    throw new AppError(MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated. Please contact support.', HTTP_STATUS.UNAUTHORIZED);
  }

  const token = signToken(user._id);

  const userObj = user.toJSON();
  delete userObj.password;

  return { token, user: userObj };
};

module.exports = { register, login };

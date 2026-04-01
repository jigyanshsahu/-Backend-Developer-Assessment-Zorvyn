'use strict';

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      minlength: [10, 'Content must be at least 10 characters'],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator(tags) {
          return tags.every((t) => typeof t === 'string' && t.trim().length > 0);
        },
        message: 'Each tag must be a non-empty string',
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_, ret) {
        delete ret.id;
        return ret;
      },
    },
  }
);

// indexes
postSchema.index({ isDeleted: 1, createdAt: -1 });
postSchema.index({ title: 'text', content: 'text' }, { weights: { title: 3, content: 1 } });
postSchema.index({ tags: 1 });
postSchema.index({ author: 1, isDeleted: 1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;

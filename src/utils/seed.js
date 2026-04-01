'use strict';

/**
 * Seed script — populates the database with an admin user and sample posts.
 * Run with: npm run seed
 *
 * ⚠️  This is a destructive operation. It will drop the users and posts collections.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const { connectDB, disconnectDB } = require('../config/db');
const { logInfo, logError } = require('./logger');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Post.deleteMany({});
  logInfo('Existing data cleared.', 'Seed');

  // Create admin user
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: 'admin',
  });
  logInfo(`Admin created: ${admin.email}`, 'Seed');

  // Create regular user
  const user = await User.create({
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'SecurePass123!',
    role: 'user',
  });
  logInfo(`User created: ${user.email}`, 'Seed');

  // Create sample posts
  const posts = await Post.insertMany([
    {
      title: 'Introduction to Clean Architecture',
      content:
        'Clean architecture separates concerns into distinct layers, making the system easier to test and maintain over time. This post explores the principles behind clean architecture and how to apply them in Node.js.',
      tags: ['architecture', 'nodejs', 'backend'],
      author: admin._id,
    },
    {
      title: 'JWT Authentication Best Practices',
      content:
        'JSON Web Tokens are widely used for stateless authentication. This post covers best practices including token expiry, secret rotation, and avoiding common pitfalls like storing sensitive data in the payload.',
      tags: ['security', 'jwt', 'authentication'],
      author: user._id,
    },
    {
      title: 'MongoDB Schema Design for Production',
      content:
        'Designing MongoDB schemas requires balancing between embedding and referencing documents. Learn how to design schemas that support your query patterns efficiently while avoiding common pitfalls.',
      tags: ['mongodb', 'database', 'schema'],
      author: admin._id,
    },
    {
      title: 'Building REST APIs with Express.js',
      content:
        'Express.js is the most popular Node.js web framework. This post walks through building a production-ready REST API with proper validation, error handling, and documentation.',
      tags: ['express', 'nodejs', 'rest-api'],
      author: user._id,
    },
    {
      title: 'Docker for Node.js Developers',
      content:
        'Containerising your Node.js application with Docker ensures consistent environments from development to production. Learn multi-stage builds, health checks, and docker-compose orchestration.',
      tags: ['docker', 'devops', 'nodejs'],
      author: admin._id,
    },
  ]);

  logInfo(`${posts.length} posts created.`, 'Seed');
  logInfo('Seed complete! You can log in with:', 'Seed');
  logInfo('  Admin: admin@example.com / AdminPass123!', 'Seed');
  logInfo('  User:  jane@example.com  / SecurePass123!', 'Seed');

  await disconnectDB();
};

seed().catch((err) => {
  logError(err, 'Seed');
  process.exit(1);
});

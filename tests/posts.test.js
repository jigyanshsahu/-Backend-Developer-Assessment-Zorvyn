'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const createApp = require('../src/app');

let app;
let userToken;
let adminToken;
let createdPostId;

// ── Shared fixtures ───────────────────────────────────────────────────────────

const regularUser = {
  name: 'Post User',
  email: 'postuser@example.com',
  password: 'SecurePass123!',
};

const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'AdminPass123!',
};

const validPost = {
  title: 'My First Post About Node.js',
  content: 'This is a detailed article about building REST APIs with Node.js and Express.',
  tags: ['nodejs', 'express', 'rest'],
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await connectDB(process.env.MONGO_URI);
  app = createApp();

  // Register and log in as regular user
  await request(app).post('/api/v1/auth/register').send(regularUser);
  const userLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: regularUser.email, password: regularUser.password });
  userToken = userLogin.body.data.token;

  // Register admin user, then manually set role = admin
  await request(app).post('/api/v1/auth/register').send(adminUser);
  await mongoose.connection.collection('users').updateOne(
    { email: adminUser.email },
    { $set: { role: 'admin' } }
  );
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: adminUser.email, password: adminUser.password });
  adminToken = adminLogin.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await disconnectDB();
});

// ── POST /posts ───────────────────────────────────────────────────────────────

describe('POST /api/v1/posts', () => {
  it('should create a post when authenticated', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validPost);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.post).toMatchObject({
      title: validPost.title,
      tags: validPost.tags,
      isDeleted: false,
    });
    expect(res.body.data.post.author).toHaveProperty('email', regularUser.email);

    // Store for later tests
    createdPostId = res.body.data.post._id;
  });

  it('should return 401 when creating a post without auth', async () => {
    const res = await request(app).post('/api/v1/posts').send(validPost);
    expect(res.statusCode).toBe(401);
  });

  it('should return 422 when title is too short', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validPost, title: 'Hi' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors.some((e) => e.field === 'title')).toBe(true);
  });

  it('should return 422 when content is missing', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Valid Title Here', tags: [] });
    expect(res.statusCode).toBe(422);
  });
});

// ── GET /posts ────────────────────────────────────────────────────────────────

describe('GET /api/v1/posts', () => {
  // Create a few more posts for pagination tests
  beforeAll(async () => {
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: `Paginated Post Number ${i}`,
          content: `Content for paginated post number ${i} which has enough characters.`,
          tags: ['pagination', `post${i}`],
        });
    }
  });

  it('should return a paginated list of posts', async () => {
    const res = await request(app).get('/api/v1/posts?page=1&limit=3');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.posts)).toBe(true);
    expect(res.body.data.posts.length).toBeLessThanOrEqual(3);
    expect(res.body.data.meta).toMatchObject({
      page: 1,
      limit: 3,
    });
    expect(typeof res.body.data.meta.total).toBe('number');
    expect(typeof res.body.data.meta.totalPages).toBe('number');
  });

  it('should search posts by keyword (case-insensitive)', async () => {
    const res = await request(app).get('/api/v1/posts?search=node.js');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.posts.length).toBeGreaterThanOrEqual(1);
    // All results should match the search term in title or content
    res.body.data.posts.forEach((p) => {
      const combined = `${p.title} ${p.content}`.toLowerCase();
      expect(combined).toMatch(/node\.js/i);
    });
  });

  it('should filter posts by tags', async () => {
    const res = await request(app).get('/api/v1/posts?tags=pagination');
    expect(res.statusCode).toBe(200);
    res.body.data.posts.forEach((p) => {
      expect(p.tags).toContain('pagination');
    });
  });

  it('should sort posts by title ascending', async () => {
    const res = await request(app).get('/api/v1/posts?sortBy=title&order=asc&limit=100');
    expect(res.statusCode).toBe(200);
    const titles = res.body.data.posts.map((p) => p.title);
    const sorted = [...titles].sort();
    expect(titles).toEqual(sorted);
  });

  it('should return 422 with invalid query params', async () => {
    const res = await request(app).get('/api/v1/posts?sortBy=notAField');
    expect(res.statusCode).toBe(422);
  });
});

// ── GET /posts/:id ────────────────────────────────────────────────────────────

describe('GET /api/v1/posts/:id', () => {
  it('should return a single post', async () => {
    const res = await request(app).get(`/api/v1/posts/${createdPostId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.post._id).toBe(createdPostId);
  });

  it('should return 404 for a non-existent post', async () => {
    const fakeId = new mongoose.Types.ObjectId().toHexString();
    const res = await request(app).get(`/api/v1/posts/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });

  it('should return 400 for an invalid ID format', async () => {
    const res = await request(app).get('/api/v1/posts/not-an-id');
    expect(res.statusCode).toBe(400);
  });
});

// ── PATCH /posts/:id ──────────────────────────────────────────────────────────

describe('PATCH /api/v1/posts/:id', () => {
  it('should update a post as the owner', async () => {
    const res = await request(app)
      .patch(`/api/v1/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Updated Title For The Node Post' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.post.title).toBe('Updated Title For The Node Post');
  });

  it('should update a post as an admin (not the owner)', async () => {
    const res = await request(app)
      .patch(`/api/v1/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tags: ['admin-update'] });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.post.tags).toContain('admin-update');
  });

  it('should return 403 when another regular user tries to update', async () => {
    // Create a second user
    await request(app).post('/api/v1/auth/register').send({
      name: 'Other User',
      email: 'other@example.com',
      password: 'OtherPass123!',
    });
    const otherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'other@example.com', password: 'OtherPass123!' });
    const otherToken = otherLogin.body.data.token;

    const res = await request(app)
      .patch(`/api/v1/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Unauthorized Update' });

    expect(res.statusCode).toBe(403);
  });

  it('should return 422 when update body is empty', async () => {
    const res = await request(app)
      .patch(`/api/v1/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    expect(res.statusCode).toBe(422);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .patch(`/api/v1/posts/${createdPostId}`)
      .send({ title: 'No Auth Update' });
    expect(res.statusCode).toBe(401);
  });
});

// ── DELETE /posts/:id ─────────────────────────────────────────────────────────

describe('DELETE /api/v1/posts/:id', () => {
  let postToDeleteId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Post Scheduled For Deletion',
        content: 'This post will be soft-deleted in the test suite below.',
        tags: ['delete-test'],
      });
    postToDeleteId = res.body.data.post._id;
  });

  it('should soft-delete a post as the owner', async () => {
    const res = await request(app)
      .delete(`/api/v1/posts/${postToDeleteId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should not return the soft-deleted post in GET /posts', async () => {
    const res = await request(app).get('/api/v1/posts?limit=100');
    const ids = res.body.data.posts.map((p) => p._id);
    expect(ids).not.toContain(postToDeleteId);
  });

  it('should return 404 when getting a soft-deleted post by ID', async () => {
    const res = await request(app).get(`/api/v1/posts/${postToDeleteId}`);
    expect(res.statusCode).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).delete(`/api/v1/posts/${createdPostId}`);
    expect(res.statusCode).toBe(401);
  });
});

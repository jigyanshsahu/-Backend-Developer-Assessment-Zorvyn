'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const createApp = require('../src/app');

let app;

beforeAll(async () => {
  await connectDB(process.env.MONGO_URI);
  app = createApp();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await disconnectDB();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const validUser = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'SecurePass123!',
};

// ── POST /auth/register ───────────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return a token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toMatchObject({
      name: validUser.name,
      email: validUser.email,
      role: 'user',
    });
    // Password must NEVER be returned
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('should return 409 if the email is already registered', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validUser);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('should return 422 if name is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'b@b.com', password: 'SecurePass123!' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
      ])
    );
  });

  it('should return 422 if email format is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'not-an-email', password: 'SecurePass123!' });
    expect(res.statusCode).toBe(422);
  });

  it('should return 422 if password is too weak', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'c@c.com', password: 'weak' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
  });

  it('should return 422 if password lacks an uppercase letter', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'd@d.com', password: 'lowercase123' });
    expect(res.statusCode).toBe(422);
  });
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  it('should log in with valid credentials and return a token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(typeof res.body.data.token).toBe('string');
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'WrongPass999!' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'AnyPass123!' });
    expect(res.statusCode).toBe(401);
  });

  it('should return 422 if email is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'SecurePass123!' });
    expect(res.statusCode).toBe(422);
  });
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────

describe('GET /api/v1/auth/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    token = res.body.data.token;
  });

  it('should return user profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when an invalid token is provided', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invaliddtoken123');
    expect(res.statusCode).toBe(401);
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────

describe('404 handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

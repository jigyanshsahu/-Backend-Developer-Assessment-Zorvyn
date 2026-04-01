'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Production Backend API',
      version: '1.0.0',
      description: `
A production-grade REST API built with Node.js, Express, and MongoDB.

## Features
- JWT Authentication with role-based access control (user / admin)
- Full CRUD on Posts with pagination, search, and soft-delete
- Centralized validation (Zod) and error handling
- Rate limiting and security hardening (Helmet)

## Authentication
Include the JWT in the **Authorization** header as a Bearer token:
\`Authorization: Bearer <your_token>\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from POST /auth/login',
        },
      },
      schemas: {
        // ── Shared ──────────────────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 5 },
          },
        },

        // ── User ────────────────────────────────────────────────────────────
        UserPublic: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664f1a2b3c4d5e6f78901234' },
            name: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 50, example: 'Jane Doe' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            password: {
              type: 'string',
              minLength: 8,
              example: 'SecurePass123!',
              description: 'Min 8 chars, must include uppercase, lowercase and number',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', example: 'SecurePass123!' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/UserPublic' },
          },
        },

        // ── Post ────────────────────────────────────────────────────────────
        Post: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664f1a2b3c4d5e6f78901235' },
            title: { type: 'string', example: 'Clean Architecture in Node.js' },
            content: { type: 'string', example: 'Full article content here...' },
            tags: { type: 'array', items: { type: 'string' }, example: ['nodejs', 'architecture'] },
            author: { $ref: '#/components/schemas/UserPublic' },
            isDeleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreatePostRequest: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200, example: 'Clean Architecture in Node.js' },
            content: { type: 'string', minLength: 10, example: 'Full article content here...' },
            tags: { type: 'array', items: { type: 'string' }, example: ['nodejs', 'architecture'] },
          },
        },
        UpdatePostRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200, example: 'Updated Title' },
            content: { type: 'string', minLength: 10, example: 'Updated content...' },
            tags: { type: 'array', items: { type: 'string' }, example: ['updated', 'tags'] },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'User registration and authentication' },
      { name: 'Posts', description: 'Post resource CRUD operations' },
      { name: 'Health', description: 'API health check' },
    ],
  },
  // Glob patterns for JSDoc route annotations
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

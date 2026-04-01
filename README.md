# 🚀 Production Backend API

A **production-grade REST API** built with **Node.js**, **Express**, and **MongoDB** following strict clean architecture principles. Designed to be scalable, secure, maintainable, and testable.

---

## ✨ Feature Highlights

| Feature | Details |
|---|---|
| **Architecture** | Clean layered: controllers → services → models |
| **Authentication** | JWT (HS256, 7-day expiry), bcrypt password hashing (12 rounds) |
| **Authorization** | Role-based access control (user / admin) |
| **Validation** | Zod schemas with field-level error messages |
| **Error Handling** | Centralised middleware, standardised response envelope |
| **Soft Delete** | Posts flagged with `isDeleted`, never permanently removed |
| **Pagination** | Offset-based with metadata (total, totalPages, hasNext, hasPrev) |
| **Search** | Case-insensitive keyword search on title + content |
| **Sorting** | Configurable field + direction sort |
| **Security** | Helmet, CORS, express-mongo-sanitize, rate limiting |
| **Logging** | Morgan (HTTP) + structured app-level logging |
| **API Docs** | Swagger UI at `/api-docs` |
| **Tests** | Jest + Supertest + MongoMemoryServer (no real DB required) |
| **Testing** | Comprehensive Jest suite with Supertest |

---

## 📁 Project Structure

```
src/
├── config/
│   ├── constants.js      # Roles, HTTP codes, messages
│   ├── db.js             # MongoDB connection with retry
│   ├── env.js            # Validated environment config
│   └── swagger.js        # OpenAPI 3.0 spec
├── controllers/
│   ├── auth.controller.js    # Request/response only
│   └── post.controller.js
├── middlewares/
│   ├── auth.middleware.js    # protect + authorize
│   ├── error.middleware.js   # Global error handler + AppError class
│   └── rateLimiter.middleware.js
├── models/
│   ├── User.js           # Email index, bcrypt pre-save hook
│   └── Post.js           # Soft-delete, text + compound indexes
├── routes/
│   ├── auth.routes.js    # /auth routes with Swagger annotations
│   ├── post.routes.js    # /posts routes with Swagger annotations
│   └── index.js          # Root router + health check
├── services/
│   ├── auth.service.js   # Business logic: register, login
│   └── post.service.js   # Business logic: CRUD, search, soft-delete
├── utils/
│   ├── asyncHandler.js   # Catches async errors → next()
│   ├── logger.js         # Morgan + app-level loggers
│   ├── pagination.js     # Parse params + build meta
│   ├── response.js       # sendSuccess / sendError helpers
│   └── seed.js           # Database seeder (dev only)
├── validators/
│   ├── auth.validator.js
│   ├── post.validator.js
│   └── validate.js       # Zod middleware factory
├── app.js                # Express factory (no port binding)
└── server.js             # Entry: DB connect → app.listen
tests/
├── auth.test.js
├── posts.test.js
├── setup.js              # MongoMemoryServer global setup
└── teardown.js
```

---

## 🛠️ Local Setup

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- npm

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd backend-project

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values (MONGO_URI and JWT_SECRET are required)

# 4. (Optional) Seed the database with sample data
npm run seed

# 5. Start development server
npm run dev
```

The server starts at `http://localhost:5000`

---


## 📖 API Documentation

Swagger UI is available at:
```
http://localhost:5000/api-docs
```

Raw OpenAPI JSON:
```
http://localhost:5000/api-docs.json
```

---

## 🔗 API Endpoints

All endpoints are prefixed with `/api/v1`.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | Public | Register a new user |
| `POST` | `/auth/login` | Public | Log in, receive JWT |
| `GET` | `/auth/me` | 🔒 JWT | Get current user profile |

### Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/posts` | Public | List posts (paginated, searchable) |
| `GET` | `/posts/:id` | Public | Get single post |
| `POST` | `/posts` | 🔒 JWT | Create a post |
| `PATCH` | `/posts/:id` | 🔒 Owner/Admin | Update a post |
| `DELETE` | `/posts/:id` | 🔒 Owner/Admin | Soft-delete a post |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | Public | API health status |

---

## 📬 Sample Requests

### Register

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePass123!"
  }'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "664f...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "jane@example.com", "password": "SecurePass123!" }'
```

### Create Post

```bash
curl -X POST http://localhost:5000/api/v1/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "Clean Architecture in Node.js",
    "content": "This article explores clean architecture principles applied to Node.js...",
    "tags": ["nodejs", "architecture", "backend"]
  }'
```

### Get Posts (with pagination, search, sort)

```bash
curl "http://localhost:5000/api/v1/posts?page=1&limit=5&search=nodejs&sortBy=createdAt&order=desc"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": {
    "posts": [...],
    "meta": {
      "page": 1,
      "limit": 5,
      "total": 42,
      "totalPages": 9,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" },
    { "field": "password", "message": "Password must contain at least one uppercase letter" }
  ]
}
```

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# With coverage report
npm run test:coverage
```

Tests use `mongodb-memory-server` — no external MongoDB needed.

**Coverage includes:**
- Auth: registration, login, /me, validation errors, duplicate emails
- Posts: full CRUD, pagination, search, tag filtering, sorting, soft-delete, RBAC

---

## 🔒 Security Measures

| Measure | Implementation |
|---|---|
| Secure headers | `helmet` (CSP, HSTS, X-Frame-Options, etc.) |
| CORS | Origin allowlist via env var |
| NoSQL injection | `express-mongo-sanitize` strips `$` and `.` from user input |
| Rate limiting | Global: 100 req/15 min; Auth: 10 req/15 min |
| Password hashing | bcrypt with 12 salt rounds (OWASP recommended) |
| User enumeration | Login returns same 401 for invalid email AND wrong password |
| Token safety | `password` field excluded from all DB queries by default |

---

## ⚖️ Design Decisions & Tradeoffs

### Why Zod over Joi?
Zod provides better TypeScript-style inference, `.safeParse()` doesn't throw, and it's composable. `z.partial()` makes partial update schemas trivial.

### Why soft-delete instead of hard-delete?
Soft delete preserves audit trails and allows recovery. All queries automatically filter `{ isDeleted: false }` in the service layer — the controller/client never needs to think about it.

### Why offset pagination instead of cursor-based?
Offset pagination is simpler to implement and understand. For an interview/evaluation context it demonstrates the concept cleanly. At scale (millions of records), cursor-based pagination would be preferred to avoid index scans.

### Why regex search instead of MongoDB $text?
Regex search (`/keyword/i`) is simpler and works without pre-building text indexes in the test environment. At scale, `$text` with a text index (or a dedicated search service like Elasticsearch) would be the right choice. The Post model already has a text index defined for easy upgrade.

### Why separate app.js and server.js?
Separating the app factory from the entry point allows tests to `require('./src/app')` without triggering a DB connection or port binding — a standard pattern in Node.js testing.

### Why AppError class?
Services need to signal "expected failure conditions" (not found, forbidden) without going through the generic 500 path. `AppError` carries `statusCode` and `errors`, and is detected by the error handler via `isOperational: true`, allowing clean, distinguished error paths.

---

## 🌍 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | ✅ | — | MongoDB connection string |
| `JWT_SECRET` | ✅ | — | Secret for signing JWTs (min 32 chars) |
| `NODE_ENV` | | `development` | `development` / `production` / `test` |
| `PORT` | | `5000` | HTTP port |
| `API_VERSION` | | `v1` | API route prefix |
| `JWT_EXPIRES_IN` | | `7d` | JWT token lifetime |
| `BCRYPT_SALT_ROUNDS` | | `12` | bcrypt work factor |
| `RATE_LIMIT_WINDOW_MS` | | `900000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | | `100` | Max requests per window |
| `ALLOWED_ORIGINS` | | `http://localhost:3000` | Comma-separated CORS origins |

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `express` | HTTP framework |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT signing/verification |
| `bcryptjs` | Password hashing |
| `zod` | Request validation |
| `helmet` | Security headers |
| `cors` | Cross-origin resource sharing |
| `express-rate-limit` | Rate limiting |
| `express-mongo-sanitize` | NoSQL injection prevention |
| `morgan` | HTTP request logging |
| `swagger-jsdoc` | OpenAPI spec generation from JSDoc |
| `swagger-ui-express` | Swagger UI middleware |
| `dotenv` | Environment variable loading |

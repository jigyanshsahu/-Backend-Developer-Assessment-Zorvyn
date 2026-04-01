# ═══════════════════════════════════════════════════════════════════════════════
# Stage 1: Builder
# Install ALL dependencies (including devDependencies) for potential build steps
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first to leverage Docker layer cache
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# ═══════════════════════════════════════════════════════════════════════════════
# Stage 2: Production image
# Only the runtime artifacts — no devDependencies, no test files, smaller image
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001

WORKDIR /app

# Copy production node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source (respects .dockerignore)
COPY --chown=nodeapp:nodejs src/ ./src/
COPY --chown=nodeapp:nodejs package*.json ./

# Switch to non-root user
USER nodeapp

# Document the port (does not publish it — use docker-compose or -p flag)
EXPOSE 5000

# Health check so Docker / orchestrators know when the app is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

# Start the application
CMD ["node", "src/server.js"]

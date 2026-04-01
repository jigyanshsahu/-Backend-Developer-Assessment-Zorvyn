'use strict';

const createApp = require('./app');
const { connectDB } = require('./config/db');
const env = require('./config/env');
const { logInfo, logError } = require('./utils/logger');

/**
 * Application entry point.
 *
 * Separated from app.js so the app module can be imported by tests
 * without starting the HTTP server or connecting to the database.
 */
const startServer = async () => {
  try {
    // 1. Connect to MongoDB first (with retry logic)
    await connectDB();

    // 2. Create and start the Express server
    const app = createApp();
    const server = app.listen(env.PORT, () => {
      logInfo(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`, 'Server');
      logInfo(`API: http://localhost:${env.PORT}/api/${env.API_VERSION}`, 'Server');
      logInfo(`Docs: http://localhost:${env.PORT}/api-docs`, 'Server');
    });

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      logInfo(`${signal} received. Shutting down gracefully...`, 'Server');
      server.close(async () => {
        const { disconnectDB } = require('./config/db');
        await disconnectDB();
        logInfo('Server closed. Process exiting.', 'Server');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Catch unhandled promise rejections that slip through asyncHandler
    process.on('unhandledRejection', (reason) => {
      logError(reason instanceof Error ? reason : new Error(String(reason)), 'UnhandledRejection');
      // In production, exit and let the process manager restart
      if (env.isProduction) {
        server.close(() => process.exit(1));
      }
    });
  } catch (error) {
    logError(error, 'Startup');
    process.exit(1);
  }
};

startServer();

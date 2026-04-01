'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes/index');
const { httpLogger } = require('./utils/logger');
const { globalRateLimiter } = require('./middlewares/rateLimiter.middleware');
const { errorHandler } = require('./middlewares/error.middleware');
const { HTTP_STATUS } = require('./config/constants');

const createApp = () => {
  const app = express();

  // Security 
  app.use(helmet());

  // CORS 
  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // prevent injection
  app.use(mongoSanitize());

  // parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // logger
  app.use(httpLogger);

  // rate limiter
  app.use(globalRateLimiter);

  // swagger setup
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Production API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    })
  );

  app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

  // api routes
  app.use(`/api/${env.API_VERSION}`, routes);

  // 404 handler
  app.use((req, res) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: `Cannot ${req.method} ${req.originalUrl}`,
      errors: [],
    });
  });

  // error handler
  app.use(errorHandler);

  return app;
};

module.exports = createApp;

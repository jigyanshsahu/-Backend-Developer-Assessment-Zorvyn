'use strict';

const mongoose = require('mongoose');
const env = require('./env');

/**
 * Establishes a Mongoose connection to MongoDB.
 * Implements a simple retry strategy with exponential back-off
 * so ephemeral network blips during container startup don't crash the app.
 */
const connectDB = async (uri, retries = 5, delay = 2000) => {
  const connectionUri = uri || env.MONGO_URI;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(connectionUri, {
        // These options silence deprecation warnings in Mongoose 8
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[DB] MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (error) {
      console.error(`[DB] Connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) {
        console.error('[DB] All connection attempts exhausted. Exiting.');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
};

/**
 * Gracefully closes the Mongoose connection.
 * Called during process shutdown to avoid leaving hanging connections.
 */
const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('[DB] MongoDB connection closed.');
};

module.exports = { connectDB, disconnectDB };

'use strict';

/**
 * Jest global setup — starts an in-memory MongoDB instance.
 * This ensures tests never touch a real database and can run in CI without dependencies.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

module.exports = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_that_is_long_enough_for_testing_purposes_only';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.BCRYPT_SALT_ROUNDS = '4'; // Intentionally low for fast tests
  process.env.RATE_LIMIT_MAX = '1000'; // Disable effective rate limiting in tests

  // Store the mongod instance so teardown can stop it
  global.__MONGOD__ = mongod;
};

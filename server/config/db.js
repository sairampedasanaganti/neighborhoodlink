/**
 * MongoDB connection setup.
 * Supports MongoDB Atlas in production and in-memory MongoDB locally.
 */

const mongoose = require('mongoose');

let mongodInstance = null;
let connectionPromise = null;
let isSeeded = false;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    let uri = process.env.MONGODB_URI;

    const isProduction = process.env.NODE_ENV === 'production';

    const invalidUri =
      !uri ||
      uri.includes('<username>') ||
      uri.includes('your-mongodb-uri');

    if (invalidUri && isProduction) {
      throw new Error('MONGODB_URI must be configured in production.');
    }

    mongoose.set('strictQuery', true);

    // Production must use a persistent MongoDB database.
    if (invalidUri) {
      console.log('[DB] Starting local in-memory MongoDB...');

      const { MongoMemoryServer } = require('mongodb-memory-server');

      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
    }

    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10
      });

      console.log(`[DB] Connected to MongoDB: ${mongoose.connection.host}`);

    } catch (error) {
      if (isProduction) {
        throw error;
      }

      console.warn('[DB] MongoDB connection failed:', error.message);
      console.log('[DB] Trying local in-memory MongoDB...');

      await mongoose.disconnect();

      const { MongoMemoryServer } = require('mongodb-memory-server');

      mongodInstance = await MongoMemoryServer.create();

      await mongoose.connect(mongodInstance.getUri());

      console.log('[DB] Connected to fallback in-memory MongoDB.');
    }

    // Seed only the local in-memory database.
    if (mongodInstance && !isSeeded) {
      const { seedDatabase } = require('../seed/seed');

      console.log('[DB] Seeding demo data...');

      await seedDatabase();

      isSeeded = true;
    }

    return mongoose.connection;
  })();

  try {
    return await connectionPromise;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected.');
});

module.exports = connectDB;

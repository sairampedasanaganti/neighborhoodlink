/**
 * MongoDB connection setup using Mongoose.
 * If MONGODB_URI is provided, connects to it.
 * If MONGODB_URI is not provided (or unreachable in local dev), automatically
 * falls back to an in-memory MongoDB instance with seeded demo data for instant execution.
 */
const mongoose = require('mongoose');

let mongodInstance = null;

async function connectDB() {
  let uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('your-mongodb-uri')) {
    console.log('[DB] No valid MONGODB_URI found. Initializing local in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
      console.log(`[DB] In-memory MongoDB started at: ${uri}`);
    } catch (memErr) {
      console.error('[DB] Failed to start in-memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[DB] MongoDB connected: ${mongoose.connection.host}`);

    // If using in-memory MongoDB or DB is fresh, auto-seed demo data
    if (mongodInstance) {
      const { seedDatabase } = require('../seed/seed');
      console.log('[DB] Auto-seeding in-memory database with demo users and requests...');
      await seedDatabase();
    }
  } catch (err) {
    console.warn('[DB] MongoDB connection to provided URI failed:', err.message);
    if (!mongodInstance) {
      console.log('[DB] Attempting fallback to local in-memory MongoDB...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const fallbackUri = mongodInstance.getUri();
        await mongoose.connect(fallbackUri);
        console.log(`[DB] Fallback in-memory MongoDB connected: ${fallbackUri}`);
        const { seedDatabase } = require('../seed/seed');
        await seedDatabase();
        return;
      } catch (fallbackErr) {
        console.error('[DB] Fallback in-memory MongoDB failed:', fallbackErr.message);
      }
    }
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected.');
  });
}

module.exports = connectDB;

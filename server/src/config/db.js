import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let memoryServer = null;

export async function connectDB() {
  const uri = env.MONGODB_URI.trim();

  // 1. If explicit Atlas or external MongoDB URI is provided
  if (uri && (uri.startsWith('mongodb+srv://') || (uri.startsWith('mongodb://') && !uri.includes('127.0.0.1') && !uri.includes('localhost')))) {
    try {
      logger.info('Connecting to external MongoDB cluster...', { uri: uri.replace(/:\/\/[^:]+:[^@]+@/, '://[CREDENTIALS]@') });
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info('MongoDB connected successfully to external cluster.');
      return mongoose.connection;
    } catch (err) {
      logger.error('Failed to connect to configured MongoDB URI.', err);
      if (env.NODE_ENV === 'production') {
        throw err;
      }
      logger.warn('Falling back to local development database fallback...');
    }
  }

  // 2. Try local MongoDB if URI was set to localhost/127.0.0.1
  if (uri && (uri.includes('127.0.0.1') || uri.includes('localhost'))) {
    try {
      logger.info('Attempting local MongoDB connection...', { uri });
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
      });
      logger.info('Connected to local MongoDB daemon.');
      return mongoose.connection;
    } catch (err) {
      logger.warn('Local MongoDB daemon not running on port 27017. Initializing embedded in-memory database...');
    }
  }

  // 3. Fallback: Embedded In-Memory MongoDB Server for frictionless development and automated tests
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    logger.info('Started embedded MongoDB Memory Server for local development.', { memUri });
    await mongoose.connect(memUri);
    logger.info('MongoDB connected via embedded memory server.');
    return mongoose.connection;
  } catch (err) {
    logger.error('Could not initialize MongoDB embedded instance.', err);
    throw err;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    logger.info('MongoDB disconnected.');
  } catch (err) {
    logger.error('Error disconnecting MongoDB', err);
  }
}

export function getDBStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    status: states[mongoose.connection.readyState] || 'unknown',
    isReady: mongoose.connection.readyState === 1,
    isMemory: Boolean(memoryServer),
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}

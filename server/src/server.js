import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocketIO } from './sockets/socketManager.js';
import { startDeadlineJob, stopDeadlineJob } from './jobs/deadlineNotifier.js';
import { logger } from './utils/logger.js';
import { User } from './models/User.js';
import { seedDatabase } from './scripts/seed.js';

const server = http.createServer(app);

// Initialize WebSockets
initSocketIO(server);

async function startServer() {
  try {
    // Connect to database (Atlas if configured, or in-memory fallback)
    await connectDB();

    // Auto-seed development demo data if database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('Database has 0 users. Auto-seeding initial development demo accounts and tasks...');
      await seedDatabase();
    }

    // Start background deadline checker (runs every 5 minutes)
    startDeadlineJob();

    server.listen(env.PORT, () => {
      logger.info(`Student Task Management API server listening on http://localhost:${env.PORT}`);
      logger.info(`REST API base URL: http://localhost:${env.PORT}/api/v1`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

// Graceful Shutdown
async function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  stopDeadlineJob();

  server.close(async () => {
    logger.info('HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });

  // Force exit after 10s if hanging
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();

export { server };

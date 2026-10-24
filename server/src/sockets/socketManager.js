import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

let io = null;

export function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
    pingTimeout: 60000,
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.query?.token;

      // Extract from cookie if present in headers
      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        for (const cookie of cookies) {
          const [name, val] = cookie.trim().split('=');
          if (name === env.COOKIE_NAME) {
            token = decodeURIComponent(val);
            break;
          }
        }
      }

      if (!token) {
        return next(new Error('Authentication token required for WebSocket connection'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired socket token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    if (userId) {
      socket.join(`user:${userId}`);
      logger.info(`Socket connected for user ${userId}`);
    }

    // Join task discussion room
    socket.on('join:task', (taskId) => {
      if (taskId) {
        socket.join(`task:${taskId}`);
        logger.debug(`User ${userId} joined room task:${taskId}`);
      }
    });

    // Leave task discussion room
    socket.on('leave:task', (taskId) => {
      if (taskId) {
        socket.leave(`task:${taskId}`);
        logger.debug(`User ${userId} left room task:${taskId}`);
      }
    });

    // Join team room
    socket.on('join:team', (teamId) => {
      if (teamId) {
        socket.join(`team:${teamId}`);
      }
    });

    socket.on('leave:team', (teamId) => {
      if (teamId) {
        socket.leave(`team:${teamId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected for user ${userId}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

// Helpers for broadcasting
export function notifyUser(userId, event, payload) {
  if (io) {
    io.to(`user:${userId.toString()}`).emit(event, payload);
  }
}

export function notifyTaskRoom(taskId, event, payload) {
  if (io) {
    io.to(`task:${taskId.toString()}`).emit(event, payload);
  }
}

export function notifyTeamRoom(teamId, event, payload) {
  if (io) {
    io.to(`team:${teamId.toString()}`).emit(event, payload);
  }
}

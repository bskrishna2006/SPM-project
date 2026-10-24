import { Router } from 'express';
import { getDBStatus } from '../config/db.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/health', (req, res) => {
  const dbStatus = getDBStatus();
  return sendSuccess(res, 'System is healthy and operational', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
  });
});

export default router;

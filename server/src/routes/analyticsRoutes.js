import { Router } from 'express';
import {
  getDashboardAnalytics,
  getTaskAnalytics,
  getTeamAnalytics,
  getAdminAnalytics,
} from '../controllers/analyticsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardAnalytics);
router.get('/tasks', getTaskAnalytics);
router.get('/teams/:id', getTeamAnalytics);
router.get('/admin', authorize('admin'), getAdminAnalytics);

export default router;

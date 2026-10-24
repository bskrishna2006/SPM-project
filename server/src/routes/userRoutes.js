import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  listUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, updateStatusSchema, updateRoleSchema } from '../validators/userValidator.js';
import { uploadAttachment } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.patch('/me', validate(updateProfileSchema), updateProfile);
router.post('/me/avatar', uploadAttachment.single('avatar'), uploadAvatar);

router.get('/', listUsers);
router.get('/:id', getUserById);

// Admin-only operations
router.patch('/:id/status', authorize('admin'), validate(updateStatusSchema), updateUserStatus);
router.patch('/:id/role', authorize('admin'), validate(updateRoleSchema), updateUserRole);

export default router;

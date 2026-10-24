import { Router } from 'express';
import {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCommentSchema, updateCommentSchema } from '../validators/commentValidator.js';

const router = Router();

router.use(authenticate);

// Task comments
router.get('/tasks/:id/comments', getTaskComments);
router.post('/tasks/:id/comments', validate(createCommentSchema), createComment);

// Comment modification
router.patch('/comments/:id', validate(updateCommentSchema), updateComment);
router.delete('/comments/:id', deleteComment);

export default router;

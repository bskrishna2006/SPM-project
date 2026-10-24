import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  updateAssignees,
  removeAssignee,
  getTaskActivity,
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  taskAssigneesSchema,
} from '../validators/taskValidator.js';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.post('/', validate(createTaskSchema), createTask);
router.get('/:id', getTaskById);
router.patch('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/status', validate(updateTaskStatusSchema), updateTaskStatus);
router.post('/:id/assignees', validate(taskAssigneesSchema), updateAssignees);
router.delete('/:id/assignees/:userId', removeAssignee);
router.get('/:id/activity', getTaskActivity);

export default router;

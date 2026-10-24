import { Router } from 'express';
import {
  uploadTaskAttachment,
  downloadAttachment,
  deleteAttachment,
  listDocuments,
} from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadAttachment } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.get('/documents', listDocuments);
router.post('/tasks/:id/attachments', uploadAttachment.array('files', 5), uploadTaskAttachment);
router.get('/attachments/:id/download', downloadAttachment);
router.delete('/attachments/:id', deleteAttachment);

export default router;

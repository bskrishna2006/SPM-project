import { Router } from 'express';
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  sendInvitation,
  getTeamInvitations,
  getUserInvitations,
  acceptInvitation,
  rejectInvitation,
  removeMember,
  cancelInvitation,
} from '../controllers/teamController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTeamSchema, updateTeamSchema, inviteMemberSchema } from '../validators/teamValidator.js';

const router = Router();

router.use(authenticate);

// Team endpoints
router.get('/', getTeams);
router.post('/', validate(createTeamSchema), createTeam);

// Invitations (user perspective)
router.get('/invitations/my', getUserInvitations);
router.post('/invitations/:id/accept', acceptInvitation);
router.post('/invitations/:id/reject', rejectInvitation);
router.delete('/invitations/:id', cancelInvitation);

// Team specific endpoints
router.get('/:id', getTeamById);
router.patch('/:id', validate(updateTeamSchema), updateTeam);
router.delete('/:id', deleteTeam);
router.post('/:id/invitations', validate(inviteMemberSchema), sendInvitation);
router.get('/:id/invitations', getTeamInvitations);
router.delete('/:id/members/:userId', removeMember);

export default router;

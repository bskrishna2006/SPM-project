import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createTeamSchema = {
  body: z.object({
    name: z.string().trim().min(2, 'Team name must be at least 2 characters').max(100),
    description: z.string().trim().max(500).optional().default(''),
  }),
};

export const updateTeamSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    status: z.enum(['active', 'archived']).optional(),
  }),
};

export const inviteMemberSchema = {
  body: z.object({
    email: z.string().trim().email('Valid student email is required').toLowerCase().optional(),
    userId: z.string().regex(objectIdRegex, 'Invalid user ID').optional(),
  }).refine((data) => data.email || data.userId, {
    message: 'Either email or userId must be provided',
  }),
};

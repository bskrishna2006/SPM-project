import { z } from 'zod';

export const updateProfileSchema = {
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
    department: z.string().trim().max(100).optional(),
    course: z.string().trim().max(100).optional(),
    academicYear: z.string().trim().max(50).optional(),
    notificationPreferences: z.object({
      inApp: z.boolean().optional(),
      taskAssignment: z.boolean().optional(),
      deadlineReminder: z.boolean().optional(),
      comments: z.boolean().optional(),
    }).optional(),
  }),
};

export const updateStatusSchema = {
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive status boolean is required' }),
  }),
};

export const updateRoleSchema = {
  body: z.object({
    role: z.enum(['student', 'team_leader', 'admin'], {
      required_error: 'Valid role is required',
    }),
  }),
};

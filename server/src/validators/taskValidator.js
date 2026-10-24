import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createTaskSchema = {
  body: z.object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
    description: z.string().trim().optional().default(''),
    type: z.enum(['personal', 'team', 'academic_project']).default('personal'),
    assignees: z.array(z.string().regex(objectIdRegex, 'Invalid assignee ID')).optional().default([]),
    team: z.string().regex(objectIdRegex, 'Invalid team ID').nullable().optional().default(null),
    status: z.enum(['To Do', 'In Progress', 'In Review', 'Completed']).default('To Do'),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
    startDate: z.string().datetime({ offset: true }).nullable().optional(),
    dueDate: z.string().datetime({ offset: true }).nullable().optional(),
    tags: z.array(z.string().trim()).optional().default([]),
    estimatedHours: z.number().min(0, 'Estimated hours cannot be negative').optional().default(0),
    actualHours: z.number().min(0, 'Actual hours cannot be negative').optional().default(0),
  }),
};

export const updateTaskSchema = {
  body: z.object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().optional(),
    type: z.enum(['personal', 'team', 'academic_project']).optional(),
    assignees: z.array(z.string().regex(objectIdRegex)).optional(),
    team: z.string().regex(objectIdRegex).nullable().optional(),
    status: z.enum(['To Do', 'In Progress', 'In Review', 'Completed']).optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
    startDate: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    tags: z.array(z.string().trim()).optional(),
    estimatedHours: z.number().min(0).optional(),
    actualHours: z.number().min(0).optional(),
  }),
};

export const updateTaskStatusSchema = {
  body: z.object({
    status: z.enum(['To Do', 'In Progress', 'In Review', 'Completed'], {
      required_error: 'Valid status is required',
    }),
  }),
};

export const taskAssigneesSchema = {
  body: z.object({
    assigneeIds: z.array(z.string().regex(objectIdRegex, 'Invalid user ID')).min(1, 'At least one assignee ID required'),
  }),
};

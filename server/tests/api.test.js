import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Team } from '../src/models/Team.js';
import { Task } from '../src/models/Task.js';

describe('STMS Backend API Test Suite', () => {
  let studentToken = '';
  let leaderToken = '';
  let studentId = '';
  let leaderId = '';
  let createdTaskId = '';
  let createdTeamId = '';

  beforeAll(async () => {
    await connectDB();
    // Clean test database
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Task.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Authentication Endpoints', () => {
    it('should register a new student user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test Student',
          email: 'test.student@stms.edu',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          department: 'Computer Science',
          course: 'B.Tech',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test.student@stms.edu');
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Sensitive field not leaked
      expect(res.body.data.accessToken).toBeDefined();

      studentToken = res.body.data.accessToken;
      studentId = res.body.data.user._id;
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Another Name',
          email: 'test.student@stms.edu',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should register a team leader', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test Leader',
          email: 'test.leader@stms.edu',
          password: 'Password123!',
          role: 'team_leader',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('team_leader');
      leaderToken = res.body.data.accessToken;
      leaderId = res.body.data.user._id;
    });

    it('should log in successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test.student@stms.edu',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test.student@stms.edu',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject protected route without token', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });

    it('should allow access to /users/me with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('test.student@stms.edu');
    });
  });

  describe('2. Team Management Workflows', () => {
    it('should allow team leader to create a new team', async () => {
      const res = await request(app)
        .post('/api/v1/teams')
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          name: 'Distributed Systems Capstone',
          description: 'Team project for distributed caching.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.team.name).toBe('Distributed Systems Capstone');
      createdTeamId = res.body.data.team._id;
    });

    it('should allow team leader to invite a student to the team', async () => {
      const res = await request(app)
        .post(`/api/v1/teams/${createdTeamId}/invitations`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          userId: studentId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invitation.status).toBe('pending');
    });

    it('should reject duplicate invitation to the same student', async () => {
      const res = await request(app)
        .post(`/api/v1/teams/${createdTeamId}/invitations`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          userId: studentId,
        });

      expect(res.status).toBe(409);
    });

    it('should allow student to fetch their invitations and accept', async () => {
      const invListRes = await request(app)
        .get('/api/v1/teams/invitations/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(invListRes.status).toBe(200);
      expect(invListRes.body.data.invitations.length).toBeGreaterThan(0);
      const inviteId = invListRes.body.data.invitations[0]._id;

      const acceptRes = await request(app)
        .post(`/api/v1/teams/invitations/${inviteId}/accept`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);
    });
  });

  describe('3. Task Management & RBAC Workflows', () => {
    it('should allow student to create a personal task', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Complete Algorithm Assignment 1',
          description: 'Solve Dynamic Programming problems.',
          priority: 'High',
          status: 'To Do',
          tags: ['algorithms', 'homework'],
          estimatedHours: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Complete Algorithm Assignment 1');
      expect(res.body.data.task.status).toBe('To Do');
      createdTaskId = res.body.data.task._id;
    });

    it('should reject invalid task data (empty title)', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'A', // Too short
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should allow updating task status (Kanban drag-drop simulation)', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${createdTaskId}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          status: 'In Progress',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('In Progress');
    });

    it('should mark completedAt timestamp when task is moved to Completed', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${createdTaskId}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          status: 'Completed',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('Completed');
      expect(res.body.data.task.completedAt).toBeDefined();
    });

    it('should allow adding comments to accessible task', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${createdTaskId}/comments`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          content: 'Finished testing all test cases for DP solution.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe('Finished testing all test cases for DP solution.');
    });

    it('should return system health check at /api/v1/health', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.database.isReady).toBe(true);
    });
  });
});

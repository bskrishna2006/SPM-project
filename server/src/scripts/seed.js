import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Task } from '../models/Task.js';
import { Comment } from '../models/Comment.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Invitation } from '../models/Invitation.js';
import { logger } from '../utils/logger.js';

export async function seedDatabase() {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    logger.info('Connected to MongoDB. Starting database seed...');

    // Clear existing development collections
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
      Invitation.deleteMany({}),
    ]);
    logger.info('Cleared existing development collections.');

    // 1. Create Users
    const defaultPassword = 'Password123!';
    const passwordHash = await User.hashPassword(defaultPassword);

    // Admin
    const admin = await User.create({
      name: 'Dr. Aris Vance (Admin)',
      email: 'admin@stms.edu',
      passwordHash,
      role: 'admin',
      department: 'Computer Science & Engineering',
      course: 'Faculty / Administration',
      academicYear: 'Staff',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    });

    // Team Leaders
    const leader1 = await User.create({
      name: 'Maya Lin',
      email: 'maya.leader@stms.edu',
      passwordHash,
      role: 'team_leader',
      department: 'Computer Science',
      course: 'B.Tech CS',
      academicYear: 'Final Year (2026)',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    });

    const leader2 = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan.leader@stms.edu',
      passwordHash,
      role: 'team_leader',
      department: 'Information Technology',
      course: 'B.Tech IT',
      academicYear: 'Final Year (2026)',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    });

    // Students (8 students)
    const studentData = [
      { name: 'Alex Rivera', email: 'alex.student@stms.edu', dept: 'Computer Science', yr: '3rd Year' },
      { name: 'Priya Patel', email: 'priya.student@stms.edu', dept: 'Computer Science', yr: '3rd Year' },
      { name: 'Liam Davies', email: 'liam.student@stms.edu', dept: 'Software Engineering', yr: '2nd Year' },
      { name: 'Aisha Al-Mansoor', email: 'aisha.student@stms.edu', dept: 'Information Technology', yr: '4th Year' },
      { name: 'Carlos Mendez', email: 'carlos.student@stms.edu', dept: 'Data Science', yr: '3rd Year' },
      { name: 'Ananya Rao', email: 'ananya.student@stms.edu', dept: 'Computer Science', yr: '2nd Year' },
      { name: 'Devon Brooks', email: 'devon.student@stms.edu', dept: 'Information Technology', yr: '3rd Year' },
      { name: 'Elena Rostova', email: 'elena.student@stms.edu', dept: 'Software Engineering', yr: '4th Year' },
    ];

    const students = [];
    for (const s of studentData) {
      const user = await User.create({
        name: s.name,
        email: s.email,
        passwordHash,
        role: 'student',
        department: s.dept,
        course: 'B.Tech',
        academicYear: s.yr,
        isActive: true,
      });
      students.push(user);
    }

    logger.info(`Created 1 Admin, 2 Team Leaders, and ${students.length} Students.`);

    // 2. Create Teams
    const team1 = await Team.create({
      name: 'Autonomous Robotics Software Unit',
      description: 'Senior capstone engineering project designing autonomous pathfinding algorithms.',
      leader: leader1._id,
      members: [
        { user: leader1._id, role: 'leader' },
        { user: students[0]._id, role: 'member' },
        { user: students[1]._id, role: 'member' },
        { user: students[2]._id, role: 'member' },
      ],
      status: 'active',
    });

    const team2 = await Team.create({
      name: 'Distributed Cloud Storage Lab',
      description: 'Research team investigating decentralized peer-to-peer file replication and caching.',
      leader: leader2._id,
      members: [
        { user: leader2._id, role: 'leader' },
        { user: students[3]._id, role: 'member' },
        { user: students[4]._id, role: 'member' },
        { user: students[5]._id, role: 'member' },
      ],
      status: 'active',
    });

    logger.info('Created 2 Project Teams.');

    // 3. Create Sample Tasks across different statuses, priorities, deadlines
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const inOneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const tasks = await Task.insertMany([
      // Overdue Task
      {
        title: 'Submit Literature Review on Path Planning',
        description: 'Compile at least 15 peer-reviewed papers on A* and Dijkstra graph traversal heuristics.',
        createdBy: leader1._id,
        assignees: [students[0]._id, students[1]._id],
        team: team1._id,
        type: 'academic_project',
        status: 'In Progress',
        priority: 'Urgent',
        dueDate: yesterday,
        tags: ['research', 'documentation', 'literature-review'],
        estimatedHours: 12,
        actualHours: 8,
      },
      // Due Today Task
      {
        title: 'Calibrate LiDAR Sensor Simulation in ROS2',
        description: 'Verify coordinate transforms between base_link and laser scanner frame.',
        createdBy: leader1._id,
        assignees: [students[0]._id],
        team: team1._id,
        type: 'team',
        status: 'In Progress',
        priority: 'High',
        dueDate: now,
        tags: ['simulation', 'ros2', 'sensors'],
        estimatedHours: 6,
        actualHours: 4,
      },
      // To Do Task
      {
        title: 'Design Peer-to-Peer Protocol Wire Format',
        description: 'Define protocol buffers or binary message schema for node gossip synchronization.',
        createdBy: leader2._id,
        assignees: [students[3]._id, students[4]._id],
        team: team2._id,
        type: 'team',
        status: 'To Do',
        priority: 'High',
        dueDate: inThreeDays,
        tags: ['architecture', 'networking'],
        estimatedHours: 16,
        actualHours: 0,
      },
      // In Review Task
      {
        title: 'Implement Raft Consensus Heartbeat Logic',
        description: 'Leader election and term negotiation implementation ready for team leader code review.',
        createdBy: leader2._id,
        assignees: [students[4]._id],
        team: team2._id,
        type: 'academic_project',
        status: 'In Review',
        priority: 'Urgent',
        dueDate: inOneWeek,
        tags: ['raft', 'backend', 'distributed-systems'],
        estimatedHours: 20,
        actualHours: 18,
      },
      // Completed Task
      {
        title: 'Setup GitHub CI/CD Pipeline & Automated Tests',
        description: 'Configure automated unit testing, linting and Docker container build matrix.',
        createdBy: leader1._id,
        assignees: [leader1._id, students[2]._id],
        team: team1._id,
        type: 'team',
        status: 'Completed',
        priority: 'Medium',
        dueDate: threeDaysAgo,
        completedAt: threeDaysAgo,
        tags: ['devops', 'testing', 'ci-cd'],
        estimatedHours: 8,
        actualHours: 6,
      },
      // Student Personal Task
      {
        title: 'Study for Data Structures Midterm Examination',
        description: 'Review Red-Black Trees, B-Trees, Graph Traversal algorithms, and Dynamic Programming.',
        createdBy: students[0]._id,
        assignees: [students[0]._id],
        team: null,
        type: 'personal',
        status: 'In Progress',
        priority: 'High',
        dueDate: inThreeDays,
        tags: ['exam-prep', 'algorithms', 'personal'],
        estimatedHours: 10,
        actualHours: 5,
      },
      // Another Student Personal Task
      {
        title: 'Complete Cloud Computing Lab 4',
        description: 'Deploy Kubernetes cluster and configure Ingress controller with TLS certificates.',
        createdBy: students[1]._id,
        assignees: [students[1]._id],
        team: null,
        type: 'personal',
        status: 'To Do',
        priority: 'Medium',
        dueDate: inOneWeek,
        tags: ['kubernetes', 'cloud', 'lab'],
        estimatedHours: 4,
        actualHours: 0,
      },
    ]);

    logger.info(`Created ${tasks.length} Sample Tasks.`);

    // 4. Sample Comments
    await Comment.insertMany([
      {
        task: tasks[0]._id,
        author: students[0]._id,
        content: 'I have compiled 12 papers into the shared Zotero folder so far. Adding 3 more today.',
      },
      {
        task: tasks[0]._id,
        author: leader1._id,
        content: 'Great progress Alex! Please ensure you include the 2024 IEEE paper on hybrid A*.',
      },
      {
        task: tasks[3]._id,
        author: students[4]._id,
        content: 'All unit tests for term negotiation are passing. PR #4 is ready for your review, Rohan!',
      },
    ]);

    // 5. Sample Notifications
    await Notification.insertMany([
      {
        recipient: students[0]._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'Maya Lin assigned you to "Calibrate LiDAR Sensor Simulation in ROS2".',
        relatedTask: tasks[1]._id,
        relatedTeam: team1._id,
      },
      {
        recipient: students[0]._id,
        type: 'task_overdue',
        title: 'Task Overdue',
        message: 'Task "Submit Literature Review on Path Planning" is past its due date.',
        relatedTask: tasks[0]._id,
        relatedTeam: team1._id,
      },
      {
        recipient: leader2._id,
        type: 'task_review_requested',
        title: 'Review Requested',
        message: 'Carlos Mendez submitted "Implement Raft Consensus Heartbeat Logic" for review.',
        relatedTask: tasks[3]._id,
        relatedTeam: team2._id,
      },
    ]);

    // 6. Sample Activity Logs
    await ActivityLog.insertMany([
      {
        actor: leader1._id,
        action: 'created_team',
        resourceType: 'team',
        resourceId: team1._id,
        team: team1._id,
        metadata: { name: team1.name },
      },
      {
        actor: leader1._id,
        action: 'created_task',
        resourceType: 'task',
        resourceId: tasks[0]._id,
        task: tasks[0]._id,
        team: team1._id,
        metadata: { title: tasks[0].title },
      },
      {
        actor: students[4]._id,
        action: 'changed_task_status',
        resourceType: 'task',
        resourceId: tasks[3]._id,
        task: tasks[3]._id,
        team: team2._id,
        metadata: { from: 'In Progress', to: 'In Review' },
      },
    ]);

    logger.info('Database seed completed successfully!');
    logger.info('========================================================================');
    logger.info('DEVELOPMENT DEMO CREDENTIALS (All accounts use password: Password123!)');
    logger.info('------------------------------------------------------------------------');
    logger.info('ADMIN:        admin@stms.edu         Password: Password123!');
    logger.info('TEAM LEADER:  maya.leader@stms.edu   Password: Password123!');
    logger.info('TEAM LEADER:  rohan.leader@stms.edu  Password: Password123!');
    logger.info('STUDENT 1:    alex.student@stms.edu  Password: Password123!');
    logger.info('STUDENT 2:    priya.student@stms.edu Password: Password123!');
    logger.info('========================================================================');

    return true;
  } 

// If run directly via `node src/scripts/seed.js`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      await disconnectDB();
      process.exit(1);
    });
}

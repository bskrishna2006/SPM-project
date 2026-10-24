import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { sendSuccess } from '../utils/response.js';

export async function getDashboardAnalytics(req, res, next) {
  try {
    const user = req.user;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Role = student
    if (user.role === 'student') {
      const userFilter = { assignees: user._id };

      const [
        totalAssigned,
        completed,
        inProgress,
        inReview,
        todo,
        overdue,
        dueToday,
        recentTasks,
        recentActivity,
        priorityDist,
      ] = await Promise.all([
        Task.countDocuments(userFilter),
        Task.countDocuments({ ...userFilter, status: 'Completed' }),
        Task.countDocuments({ ...userFilter, status: 'In Progress' }),
        Task.countDocuments({ ...userFilter, status: 'In Review' }),
        Task.countDocuments({ ...userFilter, status: 'To Do' }),
        Task.countDocuments({ ...userFilter, status: { $ne: 'Completed' }, dueDate: { $lt: now, $ne: null } }),
        Task.countDocuments({ ...userFilter, dueDate: { $gte: startOfDay, $lte: endOfDay } }),
        Task.find(userFilter).populate('team', 'name').sort({ dueDate: 1 }).limit(5),
        ActivityLog.find({
          $or: [{ actor: user._id }, { task: { $in: await Task.find(userFilter).distinct('_id') } }],
        })
          .populate('actor', 'name avatar')
          .sort({ createdAt: -1 })
          .limit(8),
        Task.aggregate([
          { $match: { assignees: user._id } },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
      ]);

      // Calculate weekly completion trend (last 7 days)
      const weeklyTrend = await Task.aggregate([
        {
          $match: {
            assignees: user._id,
            completedAt: { $gte: sevenDaysAgo },
            status: 'Completed',
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            completed: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

      return sendSuccess(res, 'Student dashboard analytics retrieved', {
        role: 'student',
        metrics: {
          totalAssigned,
          completed,
          inProgress,
          inReview,
          todo,
          overdue,
          dueToday,
          completionRate,
        },
        priorityDistribution: priorityDist.map((p) => ({ priority: p._id, count: p.count })),
        weeklyTrend,
        recentTasks,
        recentActivity,
      });
    }

    // 2. Role = team_leader
    if (user.role === 'team_leader') {
      const ledTeams = await Team.find({ leader: user._id }).select('_id name members');
      const teamIds = ledTeams.map((t) => t._id);

      const teamTaskFilter = {
        $or: [{ team: { $in: teamIds } }, { createdBy: user._id }, { assignees: user._id }],
      };

      const [
        totalTasks,
        completedTasks,
        inProgressTasks,
        inReviewTasks,
        overdueTasks,
        dueTodayTasks,
        recentTasks,
        recentActivity,
        priorityDist,
      ] = await Promise.all([
        Task.countDocuments(teamTaskFilter),
        Task.countDocuments({ ...teamTaskFilter, status: 'Completed' }),
        Task.countDocuments({ ...teamTaskFilter, status: 'In Progress' }),
        Task.countDocuments({ ...teamTaskFilter, status: 'In Review' }),
        Task.countDocuments({ ...teamTaskFilter, status: { $ne: 'Completed' }, dueDate: { $lt: now, $ne: null } }),
        Task.countDocuments({ ...teamTaskFilter, dueDate: { $gte: startOfDay, $lte: endOfDay } }),
        Task.find(teamTaskFilter).populate('assignees', 'name avatar').populate('team', 'name').sort({ updatedAt: -1 }).limit(6),
        ActivityLog.find({ team: { $in: teamIds } }).populate('actor', 'name avatar').sort({ createdAt: -1 }).limit(8),
        Task.aggregate([
          { $match: teamTaskFilter },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
      ]);

      // Workload by member across teams led
      const memberWorkload = await Task.aggregate([
        { $match: { team: { $in: teamIds } } },
        { $unwind: '$assignees' },
        {
          $group: {
            _id: '$assignees',
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
            },
            inProgressTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 1,
            name: '$user.name',
            email: '$user.email',
            avatar: '$user.avatar',
            totalTasks: 1,
            completedTasks: 1,
            inProgressTasks: 1,
          },
        },
      ]);

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return sendSuccess(res, 'Team leader dashboard analytics retrieved', {
        role: 'team_leader',
        metrics: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          inReviewTasks,
          overdueTasks,
          dueTodayTasks,
          completionRate,
          totalTeams: ledTeams.length,
        },
        memberWorkload,
        priorityDistribution: priorityDist.map((p) => ({ priority: p._id, count: p.count })),
        recentTasks,
        recentActivity,
      });
    }

    // 3. Role = admin
    if (user.role === 'admin') {
      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalStudents,
        totalLeaders,
        totalTeams,
        totalTasks,
        completedTasks,
        inProgressTasks,
        inReviewTasks,
        overdueTasks,
        recentActivity,
        priorityDist,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: false }),
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'team_leader' }),
        Team.countDocuments(),
        Task.countDocuments(),
        Task.countDocuments({ status: 'Completed' }),
        Task.countDocuments({ status: 'In Progress' }),
        Task.countDocuments({ status: 'In Review' }),
        Task.countDocuments({ status: { $ne: 'Completed' }, dueDate: { $lt: now, $ne: null } }),
        ActivityLog.find().populate('actor', 'name avatar role').sort({ createdAt: -1 }).limit(10),
        Task.aggregate([
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
      ]);

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return sendSuccess(res, 'Admin dashboard analytics retrieved', {
        role: 'admin',
        metrics: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          totalStudents,
          totalLeaders,
          totalTeams,
          totalTasks,
          completedTasks,
          inProgressTasks,
          inReviewTasks,
          overdueTasks,
          completionRate,
        },
        priorityDistribution: priorityDist.map((p) => ({ priority: p._id, count: p.count })),
        recentActivity,
      });
    }

    return sendSuccess(res, 'Dashboard analytics retrieved');
  } catch (err) {
    return next(err);
  }
}

export async function getTaskAnalytics(req, res, next) {
  try {
    const user = req.user;
    const query = {};

    if (user.role !== 'admin') {
      const userTeams = await Team.find({
        $or: [{ leader: user._id }, { 'members.user': user._id }],
      }).distinct('_id');
      query.$or = [{ createdBy: user._id }, { assignees: user._id }, { team: { $in: userTeams } }];
    }

    const [statusDistribution, priorityDistribution, effortStats] = await Promise.all([
      Task.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalEstimatedHours: { $sum: '$estimatedHours' },
            totalActualHours: { $sum: '$actualHours' },
          },
        },
      ]),
    ]);

    return sendSuccess(res, 'Task analytics retrieved', {
      statusDistribution: statusDistribution.map((s) => ({ status: s._id, count: s.count })),
      priorityDistribution: priorityDistribution.map((p) => ({ priority: p._id, count: p.count })),
      effort: effortStats[0] || { totalEstimatedHours: 0, totalActualHours: 0 },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getTeamAnalytics(req, res, next) {
  try {
    const { id } = req.params;
    const team = await Team.findById(id).populate('members.user', 'name email avatar');

    if (!team) {
      return sendError(res, 'Team not found', null, 404);
    }

    const tasks = await Task.find({ team: team._id });
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const inReview = tasks.filter((t) => t.status === 'In Review').length;
    const todo = tasks.filter((t) => t.status === 'To Do').length;
    const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;

    // Member workload
    const memberStats = team.members.map((m) => {
      const userTasks = tasks.filter((t) => t.assignees.some((a) => a.toString() === m.user._id.toString()));
      return {
        user: m.user,
        assignedCount: userTasks.length,
        completedCount: userTasks.filter((t) => t.status === 'Completed').length,
        pendingCount: userTasks.filter((t) => t.status !== 'Completed').length,
      };
    });

    return sendSuccess(res, 'Team analytics retrieved', {
      team: { _id: team._id, name: team.name },
      summary: {
        total,
        completed,
        inProgress,
        inReview,
        todo,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      memberStats,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getAdminAnalytics(req, res, next) {
  try {
    const [userCountByRole, departmentDistribution, recentLogs] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.aggregate([
        { $match: { department: { $ne: '' } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ActivityLog.find().populate('actor', 'name email avatar role').sort({ createdAt: -1 }).limit(20),
    ]);

    return sendSuccess(res, 'Admin system metrics retrieved', {
      userCountByRole,
      departmentDistribution,
      recentLogs,
    });
  } catch (err) {
    return next(err);
  }
}

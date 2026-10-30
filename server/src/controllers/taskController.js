import { Task } from '../models/Task.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { Comment } from '../models/Comment.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { notifyUser, notifyTaskRoom, notifyTeamRoom } from '../sockets/socketManager.js';

// Helper to check if a user is authorized to view/access a task
async function checkTaskAccess(task, user) {
  if (user.role === 'admin') return { allowed: true, isManager: true };
  if (task.createdBy.toString() === user._id.toString()) return { allowed: true, isManager: true };

  const isAssignee = task.assignees.some((a) => (a._id || a).toString() === user._id.toString());
  if (isAssignee) return { allowed: true, isManager: false };

  if (task.team) {
    const team = await Team.findById(task.team);
    if (team) {
      const isLeader = team.leader.toString() === user._id.toString();
      const isMember = team.members.some((m) => m.user.toString() === user._id.toString());
      if (isLeader) return { allowed: true, isManager: true };
      if (isMember) return { allowed: true, isManager: false };
    }
  }

  return { allowed: false, isManager: false };
}

export async function createTask(req, res, next) {
  try {
    const {
      title,
      description,
      type = 'personal',
      assignees = [],
      team = null,
      status = 'To Do',
      priority = 'Medium',
      startDate = null,
      dueDate = null,
      tags = [],
      estimatedHours = 0,
      actualHours = 0,
    } = req.body;

    let validatedTeam = null;

    if (team) {
      validatedTeam = await Team.findById(team);
      if (!validatedTeam) {
        return sendError(res, 'Specified team does not exist.', null, 400);
      }

      // Check if creator is member or leader of team or admin
      const isMember = validatedTeam.members.some((m) => m.user.toString() === req.user._id.toString());
      const isLeader = validatedTeam.leader.toString() === req.user._id.toString();
      if (!isMember && !isLeader && req.user.role !== 'admin') {
        return sendError(res, 'You are not a member of the specified team.', null, 403);
      }

      // Validate that all assignees are members of this team
      if (assignees.length > 0) {
        const teamUserIds = new Set([
          validatedTeam.leader.toString(),
          ...validatedTeam.members.map((m) => m.user.toString()),
        ]);

        for (const assigneeId of assignees) {
          if (!teamUserIds.has(assigneeId.toString())) {
            return sendError(res, 'All assignees for a team task must be members of that team.', null, 400);
          }
        }
      }
    } else {
      // For personal tasks, creator must be in assignees if not specified
      if (assignees.length === 0) {
        assignees.push(req.user._id);
      }
    }

    const task = await Task.create({
      title,
      description,
      createdBy: req.user._id,
      assignees,
      team: team || null,
      type: team ? (type === 'academic_project' ? 'academic_project' : 'team') : 'personal',
      status,
      priority,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      tags,
      estimatedHours,
      actualHours,
      completedAt: status === 'Completed' ? new Date() : null,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email avatar role')
      .populate('assignees', 'name email avatar role')
      .populate('team', 'name leader');

    // Activity Log
    await ActivityLog.create({
      actor: req.user._id,
      action: 'created_task',
      resourceType: 'task',
      resourceId: task._id,
      task: task._id,
      team: task.team,
      metadata: { title: task.title, priority: task.priority },
    });

    // Notify assignees (except creator)
    for (const assignee of populatedTask.assignees) {
      if (assignee._id.toString() !== req.user._id.toString()) {
        const notif = await Notification.create({
          recipient: assignee._id,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `${req.user.name} assigned you to task "${task.title}".`,
          relatedTask: task._id,
          relatedTeam: task.team?._id || null,
        });
        notifyUser(assignee._id, 'notification:received', notif);
      }
    }

    if (task.team) {
      notifyTeamRoom(task.team, 'task:created', populatedTask);
    }

    return sendSuccess(res, 'Task created successfully', { task: populatedTask }, 201);
  } catch (err) {
    return next(err);
  }
}

export async function getTasks(req, res, next) {
  try {
    const {
      status,
      priority,
      type,
      team,
      assignee,
      search,
      tags,
      overdue,
      dueToday,
      startDate,
      endDate,
      sortBy = 'dueDate',
      sortOrder = 'asc',
      page = 1,
      limit = 50,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // RBAC: Deny-by-default visibility check
    if (req.user.role !== 'admin') {
      // Find all teams the user belongs to
      const userTeams = await Team.find({
        $or: [{ leader: req.user._id }, { 'members.user': req.user._id }],
      }).select('_id');
      const userTeamIds = userTeams.map((t) => t._id);

      query.$or = [
        { createdBy: req.user._id },
        { assignees: req.user._id },
        { team: { $in: userTeamIds } },
      ];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (team) query.team = team;

    // View filter: 'my' returns tasks assigned to user or personal tasks created by user
    if (req.query.view === 'my' || assignee === 'me') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { assignees: req.user._id },
          { createdBy: req.user._id, type: 'personal' },
        ],
      });
    } else if (assignee) {
      query.assignees = assignee;
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } },
          { tags: { $in: [new RegExp(search.trim(), 'i')] } },
        ],
      });
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
      query.tags = { $in: tagList };
    }

    const now = new Date();

    if (overdue === 'true') {
      query.dueDate = { $lt: now, $ne: null };
      query.status = { $ne: 'Completed' };
    }

    if (dueToday === 'true') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      query.dueDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (startDate || endDate) {
      query.dueDate = query.dueDate || {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('createdBy', 'name email avatar role')
        .populate('assignees', 'name email avatar role')
        .populate('team', 'name leader')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(query),
    ]);

    return sendSuccess(res, 'Tasks retrieved successfully', {
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getTaskById(req, res, next) {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name email avatar role')
      .populate('assignees', 'name email avatar role')
      .populate('team', 'name leader members')
      .populate('attachments.uploadedBy', 'name email avatar');

    if (!task) {
      return sendError(res, 'Task not found', null, 404);
    }

    const access = await checkTaskAccess(task, req.user);
    if (!access.allowed) {
      return sendError(res, 'You are not authorized to view this task.', null, 403);
    }

    return sendSuccess(res, 'Task details retrieved', {
      task,
      permissions: {
        canEdit: access.isManager,
        canDelete: access.isManager,
        canChangeStatus: true,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 'Task not found', null, 404);
    }

    const access = await checkTaskAccess(task, req.user);
    if (!access.allowed) {
      return sendError(res, 'You are not authorized to edit this task.', null, 403);
    }

    // Only managers/creators/admin can modify core task settings (assignees, dates, title, team)
    const isAssigneeOnly = !access.isManager;

    const allowedFields = isAssigneeOnly
      ? ['status', 'actualHours']
      : [
          'title',
          'description',
          'type',
          'assignees',
          'team',
          'status',
          'priority',
          'startDate',
          'dueDate',
          'tags',
          'estimatedHours',
          'actualHours',
        ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.status) {
      if (updates.status === 'Completed' && task.status !== 'Completed') {
        updates.completedAt = new Date();
      } else if (updates.status !== 'Completed' && task.status === 'Completed') {
        updates.completedAt = null;
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(task._id, { $set: updates }, { new: true, runValidators: true })
      .populate('createdBy', 'name email avatar role')
      .populate('assignees', 'name email avatar role')
      .populate('team', 'name leader');

    // Activity Log
    await ActivityLog.create({
      actor: req.user._id,
      action: 'updated_task',
      resourceType: 'task',
      resourceId: task._id,
      task: task._id,
      team: task.team,
      metadata: { updatedFields: Object.keys(updates) },
    });

    notifyTaskRoom(task._id, 'task:updated', updatedTask);
    if (task.team) {
      notifyTeamRoom(task.team, 'task:updated', updatedTask);
    }

    return sendSuccess(res, 'Task updated successfully', { task: updatedTask });
  } catch (err) {
    return next(err);
  }
}

export async function updateTaskStatus(req, res, next) {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 'Task not found', null, 404);
    }

    const access = await checkTaskAccess(task, req.user);
    if (!access.allowed) {
      return sendError(res, 'You are not authorized to update status on this task.', null, 403);
    }

    const oldStatus = task.status;
    task.status = status;
    if (status === 'Completed') {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email avatar role')
      .populate('assignees', 'name email avatar role')
      .populate('team', 'name leader');

    // Activity Log
    await ActivityLog.create({
      actor: req.user._id,
      action: 'changed_task_status',
      resourceType: 'task',
      resourceId: task._id,
      task: task._id,
      team: task.team,
      metadata: { from: oldStatus, to: status },
    });

    // Notify task creator if someone else updated status
    if (task.createdBy.toString() !== req.user._id.toString()) {
      let notifType = 'task_status_changed';
      let notifTitle = `Task Status: ${status}`;
      let notifMsg = `${req.user.name} moved task "${task.title}" to ${status}.`;

      if (status === 'In Review') {
        notifType = 'task_review_requested';
        notifTitle = 'Review Requested';
        notifMsg = `${req.user.name} submitted task "${task.title}" for review.`;
      } else if (status === 'Completed' && oldStatus === 'In Review') {
        notifType = 'task_review_approved';
        notifTitle = 'Task Approved';
        notifMsg = `${req.user.name} approved task "${task.title}".`;
      }

      const notif = await Notification.create({
        recipient: task.createdBy,
        type: notifType,
        title: notifTitle,
        message: notifMsg,
        relatedTask: task._id,
        relatedTeam: task.team,
      });
      notifyUser(task.createdBy, 'notification:received', notif);
    }

    notifyTaskRoom(task._id, 'task:updated', populatedTask);
    if (task.team) {
      notifyTeamRoom(task.team, 'task:updated', populatedTask);
    }

    return sendSuccess(res, `Task status updated to ${status}`, { task: populatedTask });
  } catch (err) {
    return next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 'Task not found', null, 404);
    }

    const access = await checkTaskAccess(task, req.user);
    if (!access.isManager) {
      return sendError(res, 'Only the task creator, team leader, or administrator can delete this task.', null, 403);
    }

    await Promise.all([
      Task.findByIdAndDelete(task._id),
      Comment.deleteMany({ task: task._id }),
      Notification.deleteMany({ relatedTask: task._id }),
    ]);

    await ActivityLog.create({
      actor: req.user._id,
      action: 'deleted_task',
      resourceType: 'task',
      resourceId: task._id,
      metadata: { title: task.title },
    });

    notifyTaskRoom(task._id, 'task:deleted', { taskId: task._id });
    if (task.team) {
      notifyTeamRoom(task.team, 'task:deleted', { taskId: task._id });
    }

    return sendSuccess(res, 'Task deleted successfully');
  } catch (err) {
    return next(err);
  }
}

export async function updateAssignees(req, res, next) {
  try {
    const { assigneeIds } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 'Task not found', null, 404);
    }

    const access = await checkTaskAccess(task, req.user);
    if (!access.isManager) {
      return sendError(res, 'Only task creator, team leader, or administrator can modify assignees.', null, 403);
    }

    // Verify valid users
    const validUsers = await User.find({ _id: { $in: assigneeIds }, isActive: true });
    if (validUsers.length !== assigneeIds.length) {
      return sendError(res, 'One or more assigned users do not exist or are inactive.', null, 400);
    }

    // If team task, verify all are team members
    if (task.team) {
      const team = await Team.findById(task.team);
      const teamUserIds = new Set([team.leader.toString(), ...team.members.map((m) => m.user.toString())]);
      for (const id of assigneeIds) {
        if (!teamUserIds.has(id)) {
          return sendError(res, 'All assignees must be members of the team.', null, 400);
        }
      }
    }

    const previousAssignees = new Set(task.assignees.map((a) => a.toString()));
    task.assignees = assigneeIds;
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email avatar role')
      .populate('assignees', 'name email avatar role')
      .populate('team', 'name leader');

    // Notify newly assigned members
    for (const assigneeId of assigneeIds) {
      if (!previousAssignees.has(assigneeId) && assigneeId !== req.user._id.toString()) {
        const notif = await Notification.create({
          recipient: assigneeId,
          type: 'task_assigned',
          title: 'Assigned to Task',
          message: `${req.user.name} assigned you to task "${task.title}".`,
          relatedTask: task._id,
          relatedTeam: task.team,
        });
        notifyUser(assigneeId, 'notification:received', notif);
      }
    }

    await ActivityLog.create({
      actor: req.user._id,
      action: 'updated_assignees',
      resourceType: 'task',
      resourceId: task._id,
      task: task._id,
      team: task.team,
      metadata: { newAssigneeCount: assigneeIds.length },
    });

    notifyTaskRoom(task._id, 'task:updated', populatedTask);

    return sendSuccess(res, 'Assignees updated successfully', { task: populatedTask });
  } catch (err) {
    return next(err);
  }
}

export async function removeAssignee(req, res, next) {
  try {
    const { userId } = req.params;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 'Task not found', null, 404);
    }

    const access = await checkTaskAccess(task, req.user);
    if (!access.isManager && req.user._id.toString() !== userId) {
      return sendError(res, 'You are not authorized to remove this assignee.', null, 403);
    }

    task.assignees = task.assignees.filter((a) => a.toString() !== userId);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email avatar role')
      .populate('assignees', 'name email avatar role')
      .populate('team', 'name leader');

    await ActivityLog.create({
      actor: req.user._id,
      action: 'removed_assignee',
      resourceType: 'task',
      resourceId: task._id,
      task: task._id,
      metadata: { removedUserId: userId },
    });

    notifyTaskRoom(task._id, 'task:updated', populatedTask);

    return sendSuccess(res, 'Assignee removed successfully', { task: populatedTask });
  } catch (err) {
    return next(err);
  }
}

export async function getTaskActivity(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 'Task not found', null, 404);
    }

    const access = await checkTaskAccess(task, req.user);
    if (!access.allowed) {
      return sendError(res, 'Unauthorized to view task activity', null, 403);
    }

    const activities = await ActivityLog.find({ task: task._id })
      .populate('actor', 'name email avatar role')
      .sort({ createdAt: -1 })
      .limit(50);

    return sendSuccess(res, 'Task activities retrieved', { activities });
  } catch (err) {
    return next(err);
  }
}

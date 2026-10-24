import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Task } from '../models/Task.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);

    const [assignedTaskCount, teams] = await Promise.all([
      Task.countDocuments({ assignees: req.user._id, status: { $ne: 'Completed' } }),
      Team.find({ 'members.user': req.user._id, status: 'active' }).select('name description leader'),
    ]);

    return sendSuccess(res, 'Profile retrieved', {
      user,
      assignedTaskCount,
      teams,
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const allowedUpdates = ['name', 'department', 'course', 'academicYear', 'notificationPreferences'];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });

    return sendSuccess(res, 'Profile updated successfully', { user: updatedUser });
  } catch (err) {
    return next(err);
  }
}

export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return sendError(res, 'Please provide an image file for the avatar.', null, 400);
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { avatar: avatarUrl } }, { new: true });

    return sendSuccess(res, 'Avatar updated successfully', { user, avatarUrl });
  } catch (err) {
    return next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, department, academicYear, role, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (department) {
      query.department = department;
    }

    if (academicYear) {
      query.academicYear = academicYear;
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query).sort(sort).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return sendSuccess(res, 'Users retrieved successfully', {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', null, 404);
    }

    const [teams, taskStats] = await Promise.all([
      Team.find({ 'members.user': user._id, status: 'active' }).select('name description leader'),
      Task.aggregate([
        { $match: { assignees: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const formattedStats = {
      total: 0,
      todo: 0,
      inProgress: 0,
      inReview: 0,
      completed: 0,
    };

    taskStats.forEach((s) => {
      formattedStats.total += s.count;
      if (s._id === 'To Do') formattedStats.todo = s.count;
      if (s._id === 'In Progress') formattedStats.inProgress = s.count;
      if (s._id === 'In Review') formattedStats.inReview = s.count;
      if (s._id === 'Completed') formattedStats.completed = s.count;
    });

    return sendSuccess(res, 'User details retrieved', {
      user,
      teams,
      taskStats: formattedStats,
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'User not found', null, 404);
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user._id.toString() && !isActive) {
      return sendError(res, 'You cannot deactivate your own administrative account.', null, 400);
    }

    user.isActive = isActive;
    await user.save();

    await ActivityLog.create({
      actor: req.user._id,
      action: isActive ? 'activated_user' : 'deactivated_user',
      resourceType: 'user',
      resourceId: user._id,
      metadata: { targetEmail: user.email },
    });

    return sendSuccess(res, `Account ${isActive ? 'activated' : 'deactivated'} successfully`, { user });
  } catch (err) {
    return next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'User not found', null, 404);
    }

    // Prevent removing own admin role
    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      return sendError(res, 'You cannot demote your own administrator account.', null, 400);
    }

    user.role = role;
    await user.save();

    await ActivityLog.create({
      actor: req.user._id,
      action: 'changed_user_role',
      resourceType: 'user',
      resourceId: user._id,
      metadata: { newRole: role, targetEmail: user.email },
    });

    return sendSuccess(res, `User role updated to ${role}`, { user });
  } catch (err) {
    return next(err);
  }
}

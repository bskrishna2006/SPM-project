import { Comment } from '../models/Comment.js';
import { Task } from '../models/Task.js';
import { Team } from '../models/Team.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { notifyTaskRoom, notifyUser } from '../sockets/socketManager.js';

// Helper to check task accessibility
async function canAccessTask(task, user) {
  if (user.role === 'admin') return true;
  if (task.createdBy.toString() === user._id.toString()) return true;
  if (task.assignees.some((a) => (a._id || a).toString() === user._id.toString())) return true;
  if (task.team) {
    const team = await Team.findById(task.team);
    if (team) {
      if (team.leader.toString() === user._id.toString()) return true;
      if (team.members.some((m) => m.user.toString() === user._id.toString())) return true;
    }
  }
  return false;
}

export async function getTaskComments(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 'Task not found', null, 404);
    }

    const hasAccess = await canAccessTask(task, req.user);
    if (!hasAccess) {
      return sendError(res, 'Unauthorized to view comments on this task.', null, 403);
    }

    const comments = await Comment.find({ task: task._id })
      .populate('author', 'name email avatar role')
      .sort({ createdAt: 1 });

    return sendSuccess(res, 'Comments retrieved', { comments });
  } catch (err) {
    return next(err);
  }
}

export async function createComment(req, res, next) {
  try {
    const { content } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 'Task not found', null, 404);
    }

    const hasAccess = await canAccessTask(task, req.user);
    if (!hasAccess) {
      return sendError(res, 'Unauthorized to comment on this task.', null, 403);
    }

    const comment = await Comment.create({
      task: task._id,
      author: req.user._id,
      content,
    });

    const populatedComment = await Comment.findById(comment._id).populate('author', 'name email avatar role');

    // Notify task participants (creator and assignees, except commenter)
    const recipients = new Set();
    if (task.createdBy.toString() !== req.user._id.toString()) {
      recipients.add(task.createdBy.toString());
    }
    task.assignees.forEach((a) => {
      const idStr = (a._id || a).toString();
      if (idStr !== req.user._id.toString()) {
        recipients.add(idStr);
      }
    });

    for (const recipientId of recipients) {
      const notif = await Notification.create({
        recipient: recipientId,
        type: 'new_comment',
        title: 'New Comment on Task',
        message: `${req.user.name} commented on "${task.title}": "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
        relatedTask: task._id,
        relatedTeam: task.team,
      });
      notifyUser(recipientId, 'notification:received', notif);
    }

    await ActivityLog.create({
      actor: req.user._id,
      action: 'added_comment',
      resourceType: 'comment',
      resourceId: comment._id,
      task: task._id,
      team: task.team,
      metadata: { snippet: content.slice(0, 60) },
    });

    // Real-time broadcast
    notifyTaskRoom(task._id, 'comment:added', populatedComment);

    return sendSuccess(res, 'Comment posted', { comment: populatedComment }, 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateComment(req, res, next) {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return sendError(res, 'Comment not found', null, 404);
    }

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'You can only edit your own comments.', null, 403);
    }

    comment.content = content;
    comment.editedAt = new Date();
    await comment.save();

    const populatedComment = await Comment.findById(comment._id).populate('author', 'name email avatar role');

    notifyTaskRoom(comment.task, 'comment:updated', populatedComment);

    return sendSuccess(res, 'Comment updated', { comment: populatedComment });
  } catch (err) {
    return next(err);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return sendError(res, 'Comment not found', null, 404);
    }

    const task = await Task.findById(comment.task);
    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    let isTeamLeader = false;

    if (task && task.team) {
      const team = await Team.findById(task.team);
      if (team && team.leader.toString() === req.user._id.toString()) {
        isTeamLeader = true;
      }
    }

    if (!isAuthor && !isAdmin && !isTeamLeader) {
      return sendError(res, 'You are not authorized to delete this comment.', null, 403);
    }

    const taskId = comment.task;
    await Comment.findByIdAndDelete(comment._id);

    notifyTaskRoom(taskId, 'comment:deleted', { commentId: comment._id });

    return sendSuccess(res, 'Comment deleted successfully');
  } catch (err) {
    return next(err);
  }
}

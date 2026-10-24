import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Task } from '../models/Task.js';
import { Team } from '../models/Team.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { notifyTaskRoom } from '../sockets/socketManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = path.resolve(__dirname, '../../uploads');

// Helper to check user access to task
async function checkTaskAccess(task, user) {
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

export async function uploadTaskAttachment(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 'Task not found', null, 404);
    }

    const hasAccess = await checkTaskAccess(task, req.user);
    if (!hasAccess) {
      return sendError(res, 'Unauthorized to upload documents to this task.', null, 403);
    }

    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No files were uploaded.', null, 400);
    }

    const newAttachments = req.files.map((file) => ({
      name: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.filename, // Store relative filename for security
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    }));

    task.attachments.push(...newAttachments);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email avatar');

    await ActivityLog.create({
      actor: req.user._id,
      action: 'uploaded_attachment',
      resourceType: 'document',
      resourceId: task._id,
      task: task._id,
      team: task.team,
      metadata: { fileCount: req.files.length, filenames: req.files.map((f) => f.originalname) },
    });

    notifyTaskRoom(task._id, 'task:updated', populatedTask);

    return sendSuccess(res, 'Attachments uploaded successfully', {
      attachments: populatedTask.attachments,
      task: populatedTask,
    }, 201);
  } catch (err) {
    return next(err);
  }
}

export async function downloadAttachment(req, res, next) {
  try {
    const { id } = req.params; // attachment _id

    // Find task containing this attachment
    const task = await Task.findOne({ 'attachments._id': id });
    if (!task) {
      return sendError(res, 'Attachment not found', null, 404);
    }

    const hasAccess = await checkTaskAccess(task, req.user);
    if (!hasAccess) {
      return sendError(res, 'You are not authorized to download this file.', null, 403);
    }

    const attachment = task.attachments.id(id);
    if (!attachment) {
      return sendError(res, 'Attachment record not found', null, 404);
    }

    // Path traversal defense
    const safeFilename = path.basename(attachment.path);
    const filePath = path.join(uploadRoot, safeFilename);

    if (!fs.existsSync(filePath)) {
      return sendError(res, 'File not found on server storage.', null, 404);
    }

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.originalName)}"`);

    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(res);
  } catch (err) {
    return next(err);
  }
}

export async function deleteAttachment(req, res, next) {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ 'attachments._id': id });
    if (!task) {
      return sendError(res, 'Attachment not found', null, 404);
    }

    const attachment = task.attachments.id(id);
    const isUploader = attachment.uploadedBy.toString() === req.user._id.toString();
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isUploader && !isTaskCreator && !isAdmin) {
      return sendError(res, 'You are not authorized to delete this attachment.', null, 403);
    }

    // Remove file from disk
    const safeFilename = path.basename(attachment.path);
    const filePath = path.join(uploadRoot, safeFilename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // Log disk delete failure, continue DB deletion
      }
    }

    task.attachments.pull(id);
    await task.save();

    await ActivityLog.create({
      actor: req.user._id,
      action: 'deleted_attachment',
      resourceType: 'document',
      resourceId: task._id,
      task: task._id,
      metadata: { originalName: attachment.originalName },
    });

    notifyTaskRoom(task._id, 'task:updated', task);

    return sendSuccess(res, 'Attachment deleted successfully');
  } catch (err) {
    return next(err);
  }
}

export async function listDocuments(req, res, next) {
  try {
    const { team, type, search } = req.query;

    const taskQuery = {};
    if (req.user.role !== 'admin') {
      const userTeams = await Team.find({
        $or: [{ leader: req.user._id }, { 'members.user': req.user._id }],
      }).select('_id');
      const teamIds = userTeams.map((t) => t._id);

      taskQuery.$or = [
        { createdBy: req.user._id },
        { assignees: req.user._id },
        { team: { $in: teamIds } },
      ];
    }

    if (team) {
      taskQuery.team = team;
    }

    taskQuery['attachments.0'] = { $exists: true };

    const tasksWithFiles = await Task.find(taskQuery)
      .select('title team type attachments')
      .populate('team', 'name')
      .populate('attachments.uploadedBy', 'name email avatar');

    let allDocs = [];
    for (const t of tasksWithFiles) {
      for (const att of t.attachments) {
        allDocs.push({
          _id: att._id,
          name: att.originalName,
          size: att.size,
          mimeType: att.mimeType,
          uploadedAt: att.uploadedAt,
          uploadedBy: att.uploadedBy,
          task: {
            _id: t._id,
            title: t.title,
            type: t.type,
          },
          team: t.team ? { _id: t.team._id, name: t.team.name } : null,
        });
      }
    }

    if (type) {
      allDocs = allDocs.filter((d) => d.mimeType.includes(type));
    }

    if (search) {
      const s = search.toLowerCase();
      allDocs = allDocs.filter((d) => d.name.toLowerCase().includes(s) || d.task.title.toLowerCase().includes(s));
    }

    allDocs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return sendSuccess(res, 'Documents retrieved successfully', { documents: allDocs });
  } catch (err) {
    return next(err);
  }
}

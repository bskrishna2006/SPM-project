import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getNotifications(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedTask', 'title status priority')
        .populate('relatedTeam', 'name'),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, readAt: null }),
    ]);

    return sendSuccess(res, 'Notifications retrieved', {
      notifications,
      unreadCount,
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

export async function markAsRead(req, res, next) {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return sendError(res, 'Notification not found', null, 404);
    }

    notification.readAt = new Date();
    await notification.save();

    return sendSuccess(res, 'Notification marked as read', { notification });
  } catch (err) {
    return next(err);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return sendSuccess(res, 'All notifications marked as read');
  } catch (err) {
    return next(err);
  }
}

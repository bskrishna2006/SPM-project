import { Task } from '../models/Task.js';
import { Notification } from '../models/Notification.js';
import { notifyUser } from '../sockets/socketManager.js';
import { logger } from '../utils/logger.js';

let intervalHandle = null;

export async function checkDeadlinesAndNotify() {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 1. Tasks due soon (due between now and in24Hours, not completed)
    const tasksDueSoon = await Task.find({
      dueDate: { $gte: now, $lte: in24Hours },
      status: { $ne: 'Completed' },
    }).populate('assignees', '_id name email');

    for (const task of tasksDueSoon) {
      for (const assignee of task.assignees) {
        // Prevent duplicate notification in the last 20 hours
        const existingNotif = await Notification.findOne({
          recipient: assignee._id,
          relatedTask: task._id,
          type: 'task_due_soon',
          createdAt: { $gte: new Date(now.getTime() - 20 * 60 * 60 * 1000) },
        });

        if (!existingNotif) {
          const notif = await Notification.create({
            recipient: assignee._id,
            type: 'task_due_soon',
            title: 'Task Due Soon',
            message: `Task "${task.title}" is due within 24 hours.`,
            relatedTask: task._id,
            relatedTeam: task.team,
          });
          notifyUser(assignee._id, 'notification:received', notif);
        }
      }
    }

    // 2. Tasks overdue (due before now, not completed)
    const overdueTasks = await Task.find({
      dueDate: { $lt: now, $ne: null },
      status: { $ne: 'Completed' },
    }).populate('assignees', '_id name email');

    for (const task of overdueTasks) {
      for (const assignee of task.assignees) {
        // Prevent duplicate overdue alert in the last 24 hours
        const existingOverdue = await Notification.findOne({
          recipient: assignee._id,
          relatedTask: task._id,
          type: 'task_overdue',
          createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        });

        if (!existingOverdue) {
          const notif = await Notification.create({
            recipient: assignee._id,
            type: 'task_overdue',
            title: 'Task Overdue',
            message: `Task "${task.title}" is past its due date.`,
            relatedTask: task._id,
            relatedTeam: task.team,
          });
          notifyUser(assignee._id, 'notification:received', notif);
        }
      }
    }
  } catch (err) {
    logger.error('Error executing deadline notifier job', err);
  }
}

export function startDeadlineJob(intervalMs = 5 * 60 * 1000) {
  // Run once immediately
  checkDeadlinesAndNotify();
  // Run periodically
  intervalHandle = setInterval(checkDeadlinesAndNotify, intervalMs);
  logger.info('Started background deadline notifier scheduled job.');
}

export function stopDeadlineJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info('Stopped deadline notifier scheduled job.');
  }
}

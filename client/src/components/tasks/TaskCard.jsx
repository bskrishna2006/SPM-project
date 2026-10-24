import React from 'react';
import {
  Calendar,
  Clock,
  Paperclip,
  MessageSquare,
  Users,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Edit,
  Copy,
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { formatDate, isOverdue, isDueToday } from '../../lib/utils';

export function TaskCard({
  task,
  onClick,
  onStatusChange,
  onEdit,
  onDelete,
  onDuplicate,
  isDraggable = false,
  onDragStart,
}) {
  const overdue = isOverdue(task.dueDate, task.status);
  const dueToday = isDueToday(task.dueDate);

  return (
    <div
      draggable={isDraggable}
      onDragStart={(e) => onDragStart && onDragStart(e, task._id)}
      onClick={() => onClick && onClick(task)}
      className={`group relative bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer select-none ${
        overdue
          ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Header: Priority & Status / Due Date */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <PriorityBadge priority={task.priority} />
        {task.team && (
          <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded-md truncate max-w-[120px]">
            {task.team.name}
          </span>
        )}
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {task.title}
      </h4>

      {/* Description Preview */}
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-normal">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {task.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-slate-400 font-medium">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer Info: Deadline, Assignees, Metadata */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 font-medium ${
                overdue
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : dueToday
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : ''
              }`}
              title={`Due ${formatDate(task.dueDate)}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {overdue ? 'Overdue' : dueToday ? 'Due Today' : formatDate(task.dueDate)}
            </span>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <span className="flex items-center gap-1" title={`${task.attachments.length} attachment(s)`}>
              <Paperclip className="w-3.5 h-3.5" />
              {task.attachments.length}
            </span>
          )}
        </div>

        {/* Assignees Avatars */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {task.assignees && task.assignees.length > 0 ? (
            task.assignees.slice(0, 3).map((a, i) => (
              <div
                key={a._id || i}
                className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 border-2 border-white dark:border-slate-900 text-brand-700 dark:text-brand-300 font-bold text-[10px] flex items-center justify-center shrink-0"
                title={a.name}
              >
                {a.name ? a.name.charAt(0).toUpperCase() : 'U'}
              </div>
            ))
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 text-slate-400 flex items-center justify-center text-[10px]">
              -
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

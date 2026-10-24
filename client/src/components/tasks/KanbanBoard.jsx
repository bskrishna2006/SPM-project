import React, { useState } from 'react';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

const COLUMNS = [
  { id: 'To Do', title: 'To Do', color: 'border-slate-300 dark:border-slate-700' },
  { id: 'In Progress', title: 'In Progress', color: 'border-brand-500' },
  { id: 'In Review', title: 'In Review', color: 'border-purple-500' },
  { id: 'Completed', title: 'Completed', color: 'border-emerald-500' },
];

export function KanbanBoard({ tasks = [], onTaskClick, onStatusChange, onAddNewTask }) {
  const [activeDragId, setActiveDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragStart = (e, taskId) => {
    setActiveDragId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== columnId) {
      setDragOverCol(columnId);
    }
  };

  const handleDragLeave = (e, columnId) => {
    if (dragOverCol === columnId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || activeDragId;
    setActiveDragId(null);
    setDragOverCol(null);

    if (taskId && onStatusChange) {
      const task = tasks.find((t) => t._id === taskId);
      if (task && task.status !== columnId) {
        onStatusChange(taskId, columnId);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const isTarget = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={(e) => handleDragLeave(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border-2 p-3 transition-colors duration-150 min-h-[500px] ${
              isTarget
                ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                : 'border-slate-200/80 dark:border-slate-800/80'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <StatusBadge status={col.id} />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {columnTasks.length}
                </span>
              </div>

              {onAddNewTask && (
                <button
                  onClick={() => onAddNewTask(col.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  title={`Add task to ${col.title}`}
                  aria-label={`Add task to ${col.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Task Cards Column */}
            <div className="flex-1 overflow-y-auto space-y-3 pt-3">
              {columnTasks.length === 0 ? (
                <div className="h-32 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-400 text-center px-4">
                  Drag tasks here or click + to create
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    isDraggable={true}
                    onDragStart={handleDragStart}
                    onClick={onTaskClick}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

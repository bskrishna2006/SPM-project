import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  List,
  Kanban,
  Filter,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, isOverdue } from '../lib/utils';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');

  // Sync searchParam changes
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) setSearch(q);
    const view = searchParams.get('view');
    if (view === 'my') {
      // My tasks
    }
  }, [searchParams]);

  // Fetch Tasks with current filters
  const { data: tasksData, isLoading } = useQuery({
    queryKey: [
      'tasks',
      { search, statusFilter, priorityFilter, typeFilter, teamFilter, overdueOnly, dueTodayOnly, sortBy, sortOrder },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (typeFilter) params.set('type', typeFilter);
      if (teamFilter) params.set('team', teamFilter);
      if (overdueOnly) params.set('overdue', 'true');
      if (dueTodayOnly) params.set('dueToday', 'true');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await api.get(`/tasks?${params.toString()}`);
      return res.data.data;
    },
  });

  // Fetch User Teams for filter dropdown
  const { data: teamsData } = useQuery({
    queryKey: ['myTeams'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data.data.teams;
    },
  });

  const tasks = tasksData?.tasks || [];
  const teams = teamsData || [];

  // Status Change Mutation with Optimistic Updates
  const statusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }) => {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      return res.data.data;
    },
    onMutate: async ({ taskId, newStatus }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousData = queryClient.getQueryData(['tasks']);

      // Optimistic update
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old) => {
        if (!old || !old.tasks) return old;
        return {
          ...old,
          tasks: old.tasks.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['tasks'], context.previousData);
      }
      toast.error('Failed to update task status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    },
  });

  const handleStatusChange = (taskId, newStatus) => {
    statusMutation.mutate({ taskId, newStatus });
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setTypeFilter('');
    setTeamFilter('');
    setOverdueOnly(false);
    setDueTodayOnly(false);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Task Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize personal workloads, track team projects, and maintain deadline visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <Button
            onClick={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            icon={Plus}
            size="sm"
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {/* Search Input */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, tags..."
              className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Teams & Personal</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="dueDate-asc">Due Date (Earliest)</option>
            <option value="dueDate-desc">Due Date (Latest)</option>
            <option value="createdAt-desc">Newest Created</option>
            <option value="priority-desc">Highest Priority</option>
          </select>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOverdueOnly(!overdueOnly)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                overdueOnly
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Overdue Tasks Only
            </button>

            <button
              onClick={() => setDueTodayOnly(!dueTodayOnly)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                dueTodayOnly
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Due Today
            </button>
          </div>

          <button
            onClick={handleClearFilters}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Task Content: Kanban or List */}
      {tasks.length === 0 && !isLoading ? (
        <EmptyState
          icon={CheckCircle2}
          title="No tasks match your criteria"
          description="Try clearing some filters or create a new task to get started."
          actionText="Create New Task"
          onAction={() => setIsTaskModalOpen(true)}
        />
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={tasks}
          onTaskClick={(task) => setSelectedTaskId(task._id)}
          onStatusChange={handleStatusChange}
          onAddNewTask={(status) => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
        />
      ) : (
        /* List View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map((task) => (
              <div
                key={task._id}
                onClick={() => setSelectedTaskId(task._id)}
                className="p-4 px-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    {task.team && (
                      <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded">
                        {task.team.name}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  {task.dueDate && (
                    <span
                      className={`flex items-center gap-1 ${
                        isOverdue(task.dueDate, task.status)
                          ? 'text-rose-500 font-semibold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(task.dueDate)}
                    </span>
                  )}

                  <div className="flex items-center -space-x-1.5">
                    {task.assignees?.slice(0, 3).map((a, i) => (
                      <div
                        key={a._id || i}
                        className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 border-2 border-white dark:border-slate-900 text-brand-700 dark:text-brand-300 font-bold text-[10px] flex items-center justify-center shrink-0"
                        title={a.name}
                      >
                        {a.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Edit / Create Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        onEditTask={(task) => {
          setSelectedTaskId(null);
          setTaskToEdit(task);
          setIsTaskModalOpen(true);
        }}
      />
    </div>
  );
}

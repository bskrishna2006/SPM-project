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

export function TasksPage({ view: initialView = 'all' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user, isAdmin, isTeamLeader } = useAuth();

  const isMyTasks = initialView === 'my' || searchParams.get('view') === 'my';

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
  const [assigneeFilter, setAssigneeFilter] = useState(isMyTasks ? 'me' : '');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');

  // Sync searchParam changes
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) setSearch(q);
    if (isMyTasks) {
      setAssigneeFilter('me');
    }
  }, [searchParams, isMyTasks]);

  // Fetch Tasks with current filters
  const { data: tasksData, isLoading } = useQuery({
    queryKey: [
      'tasks',
      {
        view: isMyTasks ? 'my' : 'all',
        search,
        statusFilter,
        priorityFilter,
        typeFilter,
        teamFilter,
        assigneeFilter: isMyTasks ? 'me' : assigneeFilter,
        overdueOnly,
        dueTodayOnly,
        sortBy,
        sortOrder,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (isMyTasks) {
        params.set('view', 'my');
      } else if (assigneeFilter) {
        params.set('assignee', assigneeFilter);
      }
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

  // Fetch Students for assignee filter (in All Tasks mode)
  const { data: studentsData } = useQuery({
    queryKey: ['taskAssigneesList'],
    enabled: !isMyTasks,
    queryFn: async () => {
      const res = await api.get('/students?limit=100');
      return res.data.data.students || [];
    },
  });

  const tasks = tasksData?.tasks || [];
  const teams = teamsData || [];
  const students = studentsData || [];

  // Computed summary metrics
  const totalCount = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const inReviewCount = tasks.filter((t) => t.status === 'In Review').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'Completed').length;

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
    if (!isMyTasks) setAssigneeFilter('');
    setOverdueOnly(false);
    setDueTodayOnly(false);
    setSearchParams(isMyTasks ? { view: 'my' } : {});
  };

  return (
    <div className="space-y-5">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide border ${
              isMyTasks
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60'
            }`}>
              {isMyTasks ? 'PERSONAL WORKSPACE' : 'ACADEMIC REPOSITORY'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isMyTasks ? 'My Tasks' : 'All Tasks & Team Backlog'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            {isMyTasks
              ? `Action items, milestones, and deliverables assigned to ${user?.name || 'you'}.`
              : 'Cross-team collaboration board, sprints, and project-wide deliverables.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-slate-500" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <List className="w-3.5 h-3.5 text-slate-500" />
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
            New Task
          </Button>
        </div>
      </div>

      {/* Quick Summary Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Workload</span>
          <span className="text-base font-mono font-semibold text-slate-900 dark:text-slate-100">
            {totalCount < 10 ? `0${totalCount}` : totalCount}
          </span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">In Progress</span>
          <span className="text-base font-mono font-semibold text-blue-600 dark:text-blue-400">
            {inProgressCount < 10 ? `0${inProgressCount}` : inProgressCount}
          </span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">In Review</span>
          <span className="text-base font-mono font-semibold text-purple-600 dark:text-purple-400">
            {inReviewCount < 10 ? `0${inReviewCount}` : inReviewCount}
          </span>
        </div>
        <div className={`p-3 bg-white dark:bg-slate-900 rounded-lg border flex items-center justify-between ${
          overdueCount > 0
            ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}>
          <span className={`text-xs font-medium ${overdueCount > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
            Overdue
          </span>
          <span className={`text-base font-mono font-semibold ${overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
            {overdueCount < 10 ? `0${overdueCount}` : overdueCount}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {/* Search Input */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks, descriptions, tags..."
              className="w-full text-xs rounded-md bg-slate-50 dark:bg-slate-800/80 pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
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
            className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {/* If All Tasks, show Assignee Filter */}
          {!isMyTasks ? (
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="">All Assignees</option>
              <option value="me">Assigned to Me</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          ) : (
            /* If My Tasks, show Task Type Filter */
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="">All Types (Team & Personal)</option>
              <option value="team">Team Projects</option>
              <option value="personal">Personal Tasks</option>
              <option value="academic">Academic Milestones</option>
            </select>
          )}

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Filter Pills & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOverdueOnly(!overdueOnly)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 border ${
                overdueOnly
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Overdue Only
            </button>

            <button
              onClick={() => setDueTodayOnly(!dueTodayOnly)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 border ${
                dueTodayOnly
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Due Today
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1 text-slate-600 dark:text-slate-400 focus:outline-none"
            >
              <option value="dueDate-asc">Due Date (Earliest)</option>
              <option value="dueDate-desc">Due Date (Latest)</option>
              <option value="createdAt-desc">Newest Created</option>
              <option value="priority-desc">Highest Priority</option>
            </select>

            <button
              onClick={handleClearFilters}
              className="text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
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

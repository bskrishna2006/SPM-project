import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  FolderKanban,
  FileText,
  Activity,
  Plus,
  ExternalLink,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { PriorityBadge, StatusBadge, RoleBadge } from '../components/common/Badge';
import { formatDate, isOverdue, isDueToday } from '../lib/utils';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';

export function DashboardPage() {
  const { user, isStudent, isLeader, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data.data;
    },
  });

  const { data: teamsData } = useQuery({
    queryKey: ['myTeams'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data.data.teams || [];
    },
  });

  const metrics = analyticsData?.metrics || {};
  const recentTasks = analyticsData?.recentTasks || [];
  const recentActivity = analyticsData?.recentActivity || [];
  const teams = teamsData || [];

  // Filter tasks based on selected tab
  const filteredTasks = recentTasks.filter((t) => {
    if (taskFilter === 'in_progress') return t.status === 'In Progress';
    if (taskFilter === 'urgent') return t.priority === 'Urgent' || t.priority === 'High';
    if (taskFilter === 'completed') return t.status === 'Completed';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {user?.name || 'Academic Workspace'}
            </h1>
            <RoleBadge role={user?.role} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {user?.department ? `${user.department} · ` : ''}
            Term 2026-27 · Milestone Tracking & Deliverables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsTaskModalOpen(true)}
            size="sm"
            variant="primary"
            icon={Plus}
          >
            New Task
          </Button>
          <Button
            onClick={() => navigate('/tasks')}
            size="sm"
            variant="outline"
          >
            Kanban Board
          </Button>
        </div>
      </div>

      {/* Metric Tiles (Compact & Non-Slop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total / Assigned */}
        <div className="p-3.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {isAdmin ? 'Total Tasks' : isLeader ? 'Team Tasks' : 'Assigned Tasks'}
            </span>
            <CheckSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {metrics.totalTasks ?? metrics.totalAssigned ?? 0}
            </span>
            <span className="text-[11px] text-slate-500">active items</span>
          </div>
        </div>

        {/* Completed */}
        <div className="p-3.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {metrics.completed ?? metrics.completedTasks ?? 0}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {metrics.completionRate ?? 0}% rate
            </span>
          </div>
        </div>

        {/* In Progress / In Review */}
        <div className="p-3.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {isLeader ? 'Awaiting Review' : 'In Progress'}
            </span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {isLeader
                ? metrics.inReviewTasks ?? 0
                : metrics.inProgress ?? metrics.inProgressTasks ?? 0}
            </span>
            <span className="text-[11px] text-slate-500">in turnaround</span>
          </div>
        </div>

        {/* Overdue */}
        <div className="p-3.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {metrics.overdue ?? metrics.overdueTasks ?? 0}
            </span>
            <span className="text-[11px] text-slate-500">needs attention</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 2/3 Primary Tasks & Teams + 1/3 Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Task Deliverables & Teams */}
        <div className="lg:col-span-2 space-y-5">
          {/* Deliverables Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Academic Deliverables & Tasks</CardTitle>
                <CardDescription>Direct milestone items currently assigned across enrolled courses</CardDescription>
              </div>

              {/* Tab Filters */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-xs">
                <button
                  onClick={() => setTaskFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    taskFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTaskFilter('in_progress')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    taskFilter === 'in_progress'
                      ? 'bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setTaskFilter('urgent')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    taskFilter === 'urgent'
                      ? 'bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Urgent
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <p>No tasks match the active filter.</p>
                  <Button onClick={() => setIsTaskModalOpen(true)} size="sm" variant="outline">
                    + Create a Task
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredTasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    const dueToday = isDueToday(task.dueDate);

                    return (
                      <div
                        key={task._id}
                        onClick={() => setSelectedTaskId(task._id)}
                        className="p-3.5 px-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <StatusBadge status={task.status} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate hover:underline">
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              {task.team && <span>{task.team.name}</span>}
                              {task.team && <span>·</span>}
                              <span
                                className={
                                  overdue
                                    ? 'text-rose-600 font-medium'
                                    : dueToday
                                    ? 'text-amber-600 font-medium'
                                    : ''
                                }
                              >
                                {overdue
                                  ? 'Overdue'
                                  : dueToday
                                  ? 'Due Today'
                                  : task.dueDate
                                  ? `Due ${formatDate(task.dueDate)}`
                                  : 'No deadline'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <PriorityBadge priority={task.priority} />
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>

            <div className="p-2.5 px-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-right">
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:underline"
              >
                View all tasks in Kanban board →
              </button>
            </div>
          </Card>

          {/* Active Teams Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Academic Project Teams</CardTitle>
                <CardDescription>Collaborative engineering cohorts and capstone groups</CardDescription>
              </div>
              <button
                onClick={() => navigate('/teams')}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              >
                Manage teams →
              </button>
            </CardHeader>

            <CardContent>
              {teams.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No active team memberships yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teams.slice(0, 4).map((team) => (
                    <div
                      key={team._id}
                      onClick={() => navigate(`/teams`)}
                      className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer space-y-2 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {team.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">
                          {team.members?.length || 1} members
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {team.description || team.course || 'Academic capstone project'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Rail Column: Upcoming Deadlines & Activity Feed */}
        <div className="space-y-5">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Chronological milestones due soon</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {recentTasks.filter((t) => t.dueDate && t.status !== 'Completed').length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">No pending deadlines</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {recentTasks
                    .filter((t) => t.dueDate && t.status !== 'Completed')
                    .slice(0, 4)
                    .map((t) => {
                      const overdue = isOverdue(t.dueDate, t.status);
                      return (
                        <div
                          key={t._id}
                          onClick={() => setSelectedTaskId(t._id)}
                          className="p-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{t.title}</p>
                            <span
                              className={`text-[11px] font-mono ${
                                overdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                              }`}
                            >
                              {overdue ? 'Overdue · ' : ''}
                              {formatDate(t.dueDate)}
                            </span>
                          </div>
                          <PriorityBadge priority={t.priority} />
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log (Compact & Human) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Audit & Activity Log</CardTitle>
              <CardDescription>Recent team milestone changes</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {recentActivity.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">No recent events recorded</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {recentActivity.slice(0, 6).map((log, idx) => (
                    <div key={idx} className="p-3 px-4 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {log.actor?.name ? log.actor.name.charAt(0) : 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-800 dark:text-slate-200 leading-snug">
                          <span className="font-semibold">{log.actor?.name || 'User'}</span>{' '}
                          <span className="text-slate-500">{log.action?.replace(/_/g, ' ')}</span>
                        </p>
                        <span className="text-[10px] font-mono text-slate-400">
                          {log.createdAt ? formatDate(log.createdAt) : 'Recently'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Creation & Detail Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />

      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}

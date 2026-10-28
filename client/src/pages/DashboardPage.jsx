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
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  FolderKanban,
  FileText,
  Activity,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { formatDate, formatDateTime, isOverdue } from '../lib/utils';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';

const PRIORITY_COLORS = {
  Low: '#94a3b8',
  Medium: '#38bdf8',
  High: '#f59e0b',
  Urgent: '#ef4444',
};

export function DashboardPage() {
  const { user, isStudent, isLeader, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data.data;
    },
  });

  const metrics = analyticsData?.metrics || {};
  const priorityDist = analyticsData?.priorityDistribution || [];
  const weeklyTrend = analyticsData?.weeklyTrend || [];
  const recentTasks = analyticsData?.recentTasks || [];
  const recentActivity = analyticsData?.recentActivity || [];
  const memberWorkload = analyticsData?.memberWorkload || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-medium">
              {isAdmin ? 'System Telemetry // Admin' : isLeader ? 'Team Leadership // Workspace' : 'Academic Workstation // Overview'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-[11px] font-mono text-slate-500">Term 2026-27</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {user?.name ? user.name : 'Academic Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            {isAdmin
              ? 'Institutional oversight, user access policies, and academic project audit logs.'
              : isLeader
              ? 'Milestone tracking, team workload distribution, and deliverable reviews.'
              : 'Coursework assignments, project milestones, and upcoming deadlines.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => setIsTaskModalOpen(true)}
            size="sm"
            variant="primary"
            icon={Plus}
          >
            Create Task
          </Button>
          <Button
            onClick={() => navigate('/calendar')}
            size="sm"
            variant="outline"
            icon={Calendar}
          >
            Calendar
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isAdmin ? 'Total Tasks' : isLeader ? 'Team Tasks' : 'Assigned Tasks'}
              </p>
              <span className="w-2 h-2 rounded-full bg-slate-400" />
            </div>
            <h3 className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-2">
              {metrics.totalTasks || metrics.totalAssigned || 0}
            </h3>
          </CardContent>
        </Card>

        {/* Metric 2: Completed */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Completed</p>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <h3 className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-2">
              {metrics.completed || metrics.completedTasks || 0}
            </h3>
          </CardContent>
        </Card>

        {/* Metric 3: In Progress & In Review */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isLeader ? 'In Review' : 'In Progress'}
              </p>
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
            <h3 className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-2">
              {isLeader ? metrics.inReviewTasks || 0 : metrics.inProgress || metrics.inProgressTasks || 0}
            </h3>
          </CardContent>
        </Card>

        {/* Metric 4: Overdue Alert */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Overdue</p>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <h3 className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400 mt-2">
              {metrics.overdue || metrics.overdueTasks || 0}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Charts / Trends */}
        <div className="lg:col-span-2 space-y-6">
          {/* Productivity Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Completion & Productivity Trend</CardTitle>
                <CardDescription>Academic task turnaround performance over recent activity</CardDescription>
              </div>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-full">
                {metrics.completionRate || 0}% Completion Rate
              </span>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrend.length > 0 ? weeklyTrend : [{ _id: 'Mon', completed: 1 }, { _id: 'Tue', completed: 2 }, { _id: 'Wed', completed: 1 }, { _id: 'Thu', completed: 3 }, { _id: 'Fri', completed: 4 }, { _id: 'Sat', completed: 2 }, { _id: 'Sun', completed: 5 }]}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="completed" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Leader specific: Member Workload */}
          {isLeader && memberWorkload.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team Member Workload</CardTitle>
                <CardDescription>Task distribution and progress across team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberWorkload}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="totalTasks" name="Total Tasks" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completedTasks" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin specific: Platform Overview */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>System & Account Statistics</CardTitle>
                <CardDescription>Platform-wide distribution of students and team leaders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs text-slate-400">Total Users</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{metrics.totalUsers || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs text-slate-400">Active Accounts</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.activeUsers || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs text-slate-400">Total Teams</p>
                    <p className="text-2xl font-bold text-brand-600 mt-1">{metrics.totalTeams || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs text-slate-400">Inactive Users</p>
                    <p className="text-2xl font-bold text-rose-500 mt-1">{metrics.inactiveUsers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Tasks Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming & Priority Tasks</CardTitle>
                <CardDescription>Immediate action items requiring focus</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tasks')}
                className="text-brand-600 dark:text-brand-400"
              >
                View all tasks <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTasks.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-400">No tasks found. Create one to get started!</p>
                ) : (
                  recentTasks.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => setSelectedTaskId(t._id)}
                      className="p-4 px-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <PriorityBadge priority={t.priority} />
                          {t.team && (
                            <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                              {t.team.name}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {t.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={t.status} />
                        {t.dueDate && (
                          <span
                            className={`text-xs font-medium ${
                              isOverdue(t.dueDate, t.status) ? 'text-rose-500 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            {formatDate(t.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Priority Pie & Activity Log */}
        <div className="space-y-6">
          {/* Priority Distribution Pie */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
              <CardDescription>Workload categorization by urgency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 w-full flex items-center justify-center">
                {priorityDist.length === 0 ? (
                  <p className="text-xs text-slate-400">No priority data</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityDist}
                        dataKey="count"
                        nameKey="priority"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {priorityDist.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PRIORITY_COLORS[entry.priority] || '#6366f1'}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                {priorityDist.map((p) => (
                  <div key={p.priority} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PRIORITY_COLORS[p.priority] || '#6366f1' }}
                    />
                    <span className="text-slate-600 dark:text-slate-400 truncate">{p.priority}</span>
                    <span className="font-bold ml-auto">{p.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest team and project milestones</CardDescription>
              </div>
              <Activity className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3.5">
                {recentActivity.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No recent activity</p>
                ) : (
                  recentActivity.map((act) => (
                    <div key={act._id} className="flex items-start gap-2.5 text-xs">
                      <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                        {act.actor?.name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 dark:text-slate-200 leading-snug">
                          <span className="font-semibold">{act.actor?.name || 'Someone'}</span>{' '}
                          <span className="text-slate-500 dark:text-slate-400">
                            {act.action.replace(/_/g, ' ')}
                          </span>
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {formatDateTime(act.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />

      {/* Task Details Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}

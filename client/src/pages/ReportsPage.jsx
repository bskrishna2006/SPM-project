import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  PieChart as PieIcon,
  TrendingUp,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';

const STATUS_COLORS = {
  'To Do': '#94a3b8',
  'In Progress': '#6366f1',
  'In Review': '#a855f7',
  'Completed': '#10b981',
};

const PRIORITY_COLORS = {
  Low: '#94a3b8',
  Medium: '#38bdf8',
  High: '#f59e0b',
  Urgent: '#ef4444',
};

export function ReportsPage() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['taskAnalytics'],
    queryFn: async () => {
      const res = await api.get('/analytics/tasks');
      return res.data.data;
    },
  });

  const statusDist = analyticsData?.statusDistribution || [];
  const priorityDist = analyticsData?.priorityDistribution || [];
  const effort = analyticsData?.effort || { totalEstimatedHours: 0, totalActualHours: 0 };

  const effortData = [
    { name: 'Estimated Hours', hours: effort.totalEstimatedHours || 0, fill: '#6366f1' },
    { name: 'Actual Hours', hours: effort.totalActualHours || 0, fill: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Workload Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deep-dive into academic task progress, time estimation accuracy, and priority distribution.
          </p>
        </div>
      </div>

      {/* Effort Accuracy Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Estimated Effort</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {effort.totalEstimatedHours || 0} Hours
            </h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Actual Logged Effort</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {effort.totalActualHours || 0} Hours
            </h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Estimation Accuracy</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {effort.totalEstimatedHours > 0
                ? `${Math.round((effort.totalActualHours / effort.totalEstimatedHours) * 100)}%`
                : '100%'}
            </h3>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
            <CardDescription>Breakdown of tasks across workflow columns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDist}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Tasks" radius={[6, 6, 0, 0]}>
                    {statusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Effort Comparison Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Planned vs Actual Hours</CardTitle>
            <CardDescription>Comparison of estimated academic effort vs time spent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={effortData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="hours" name="Hours" radius={[6, 6, 0, 0]}>
                    {effortData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

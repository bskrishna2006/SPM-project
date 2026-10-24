import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Activity, Users, FolderKanban, CheckSquare, Layers } from 'lucide-react';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { formatDateTime } from '../../lib/utils';

export function AdminAnalyticsPage() {
  const { data: analyticsData } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const res = await api.get('/analytics/admin');
      return res.data.data;
    },
  });

  const userRoles = analyticsData?.userCountByRole || [];
  const deptDist = analyticsData?.departmentDistribution || [];
  const recentLogs = analyticsData?.recentLogs || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-purple-600" />
          Platform Health & Audit Logs
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          System telemetry, security audit trails, and departmental breakdown.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Roles Card */}
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>Number of registered accounts by access tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userRoles.map((r) => (
                <div key={r._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {r._id.replace(/_/g, ' ')}
                  </span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{r.count} Users</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Departments</CardTitle>
            <CardDescription>Active student participation by discipline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {deptDist.map((d) => (
                <div key={d._id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{d._id}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{d.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-500" />
            System Audit Trail
          </CardTitle>
          <CardDescription>Chronological log of platform events, status updates, and user changes</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentLogs.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No logs found.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log._id} className="p-3.5 px-6 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                    <div>
                      <p className="text-slate-900 dark:text-slate-100">
                        <span className="font-semibold">{log.actor?.name || 'Admin'}</span>{' '}
                        <span className="text-slate-500">{log.action.replace(/_/g, ' ')}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">Resource: {log.resourceType}</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 shrink-0">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

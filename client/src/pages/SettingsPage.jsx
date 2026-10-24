import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bell, Moon, Sun, Shield, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();

  const [inApp, setInApp] = useState(user?.notificationPreferences?.inApp ?? true);
  const [taskAssignment, setTaskAssignment] = useState(user?.notificationPreferences?.taskAssignment ?? true);
  const [deadlineReminder, setDeadlineReminder] = useState(user?.notificationPreferences?.deadlineReminder ?? true);
  const [comments, setComments] = useState(user?.notificationPreferences?.comments ?? true);

  const saveSettingsMutation = useMutation({
    mutationFn: (prefs) => api.patch('/users/me', { notificationPreferences: prefs }),
    onSuccess: (res) => {
      updateUser(res.data.data.user);
      toast.success('Preferences saved successfully');
    },
    onError: () => toast.error('Failed to save preferences'),
  });

  const handleSavePreferences = () => {
    saveSettingsMutation.mutate({ inApp, taskAssignment, deadlineReminder, comments });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
          Application Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure notification dispatch rules, interface appearance, and privacy settings.
        </p>
      </div>

      {/* Appearance Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Display Appearance</CardTitle>
          <CardDescription>Select your preferred color theme for the portal</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {isDark ? 'Dark Theme' : 'Light Theme'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isDark ? 'Comfortable for low-light study sessions' : 'Bright, crisp, and high-contrast interface'}
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={toggleTheme}>
            {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            Switch to {isDark ? 'Light' : 'Dark'} Mode
          </Button>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>In-App Alerts & Notifications</CardTitle>
          <CardDescription>Choose the events that trigger in-app updates and sound chimes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                Task Assignment Alerts
              </span>
              <span className="text-xs text-slate-400">
                Receive notifications when you are assigned or reassigned to a task
              </span>
            </div>
            <input
              type="checkbox"
              checked={taskAssignment}
              onChange={(e) => setTaskAssignment(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                Deadline Reminders
              </span>
              <span className="text-xs text-slate-400">
                Receive alerts 24 hours prior to assignment deadlines and overdue warnings
              </span>
            </div>
            <input
              type="checkbox"
              checked={deadlineReminder}
              onChange={(e) => setDeadlineReminder(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                Discussion Comments
              </span>
              <span className="text-xs text-slate-400">
                Notify when teammates comment on tasks you created or are assigned to
              </span>
            </div>
            <input
              type="checkbox"
              checked={comments}
              onChange={(e) => setComments(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
            />
          </label>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button onClick={handleSavePreferences} isLoading={saveSettingsMutation.isPending}>
              Save Notification Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

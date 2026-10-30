import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { TeamsPage } from './pages/TeamsPage';
import { StudentsPage } from './pages/StudentsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

// Admin Pages
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <SocketProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Authentication Routes */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <RegisterPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <PublicRoute>
                        <ForgotPasswordPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/reset-password"
                    element={
                      <PublicRoute>
                        <ResetPasswordPage />
                      </PublicRoute>
                    }
                  />

                  {/* Authenticated Dashboard Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/my-tasks" element={<TasksPage view="my" />} />
                      <Route path="/tasks" element={<TasksPage view="all" />} />
                      <Route path="/tasks/:id" element={<TasksPage />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/teams" element={<TeamsPage />} />
                      <Route path="/students" element={<StudentsPage />} />
                      <Route path="/documents" element={<DocumentsPage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />

                      {/* Admin-Only Routes */}
                      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/admin/users" element={<AdminUsersPage />} />
                        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                      </Route>
                    </Route>
                  </Route>

                  {/* 404 Catch-All */}
                  <Route
                    path="*"
                    element={
                      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
                        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 font-display">404</h1>
                        <p className="text-sm text-slate-500 mt-2">The requested page does not exist.</p>
                        <a
                          href="/dashboard"
                          className="mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-colors"
                        >
                          Return to Dashboard
                        </a>
                      </div>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </SocketProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

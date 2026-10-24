import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  Lock,
  Upload,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { RoleBadge } from '../components/common/Badge';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [course, setCourse] = useState(user?.course || '');
  const [academicYear, setAcademicYear] = useState(user?.academicYear || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Update Profile Mutation
  const profileMutation = useMutation({
    mutationFn: (payload) => api.patch('/users/me', payload),
    onSuccess: (res) => {
      updateUser(res.data.data.user);
      toast.success('Profile details updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });

  // Change Password Mutation
  const passwordMutation = useMutation({
    mutationFn: (payload) => api.patch('/auth/change-password', payload),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to change password');
    },
  });

  // Avatar Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatar: res.data.data.avatarUrl });
      toast.success('Avatar updated successfully');
    } catch (err) {
      toast.error('Failed to upload avatar image');
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    profileMutation.mutate({ name, department, course, academicYear });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
          Account Profile & Credentials
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your personal university credentials, academic department, and password.
        </p>
      </div>

      {/* User Header Card */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-brand-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute inset-0 rounded-2xl bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-xs font-semibold">
              <Upload className="w-4 h-4 mr-1" /> Change
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{user?.name}</h2>
              <RoleBadge role={user?.role} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {user?.department || 'Department not specified'} • {user?.course || 'Undergraduate'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Academic & Personal Details</CardTitle>
          <CardDescription>Update how your name and details appear across project teams</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="College Email Address"
                value={user?.email || ''}
                disabled
                helperText="Email is bound to your university account"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Department"
                placeholder="Computer Science & Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />

              <Input
                label="Degree / Course"
                placeholder="B.Tech Computer Science"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />

              <Input
                label="Academic Year"
                placeholder="Final Year (2026)"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" isLoading={profileMutation.isPending}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security: Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Security & Password</CardTitle>
          <CardDescription>Ensure your account is protected with a robust password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
            <Input
              label="Current Password *"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              label="New Password *"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              helperText="Minimum 6 characters"
            />

            <Input
              label="Confirm New Password *"
              type="password"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button type="submit" variant="outline" isLoading={passwordMutation.isPending}>
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Search, CheckCircle2, XCircle, UserX, UserCheck, Shield, Plus, CheckSquare } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { RoleBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { TaskModal } from '../../components/tasks/TaskModal';

export function AdminUsersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRole, setNewRole] = useState('student');

  // Task assignment from Admin Panel
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTargetUser, setTaskTargetUser] = useState(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers', { search, roleFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get(`/users?${params.toString()}`);
      return res.data.data.users;
    },
  });

  const users = usersData || [];

  // Toggle active status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }) => api.patch(`/users/${userId}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Account status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  // Role change mutation
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => api.patch(`/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User role modified');
      setSelectedUserForRole(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update role'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            User Administration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage system privileges, activate/deactivate accounts, and assign academic tasks to students.
          </p>
        </div>

        <Button
          onClick={() => {
            setTaskTargetUser(null);
            setIsTaskModalOpen(true);
          }}
          icon={Plus}
          size="sm"
        >
          Assign Task to Student
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user name or email..."
            className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="team_leader">Team Leader</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</p>
                    <p className="text-[10px] text-slate-400">{u.email}</p>
                  </td>

                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {u.department || 'Not specified'}
                  </td>

                  <td className="py-3 px-4">
                    <RoleBadge role={u.role} />
                  </td>

                  <td className="py-3 px-4">
                    <span className={`font-semibold ${u.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Direct Task Assignment for Students and Leaders */}
                      {u.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs py-1 flex items-center gap-1 text-slate-800 dark:text-slate-200"
                          onClick={() => {
                            setTaskTargetUser(u);
                            setIsTaskModalOpen(true);
                          }}
                          title={`Assign task to ${u.name}`}
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          Assign Task
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs py-1"
                        onClick={() => {
                          setSelectedUserForRole(u);
                          setNewRole(u.role);
                        }}
                      >
                        Change Role
                      </Button>

                      {u._id !== user?._id && (
                        <Button
                          size="sm"
                          variant={u.isActive ? 'danger' : 'success'}
                          className="text-xs py-1"
                          onClick={() => toggleStatusMutation.mutate({ userId: u._id, isActive: !u.isActive })}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Creation Modal for Admin Direct Assignment */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskTargetUser(null);
        }}
        initialAssigneeId={taskTargetUser?._id}
      />

      {/* Change Role Modal */}
      {selectedUserForRole && (
        <Modal
          isOpen={Boolean(selectedUserForRole)}
          onClose={() => setSelectedUserForRole(null)}
          title={`Assign Role to ${selectedUserForRole.name}`}
          maxWidth="max-w-sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Platform Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="student">Student</option>
                <option value="team_leader">Team Leader</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedUserForRole(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => roleMutation.mutate({ userId: selectedUserForRole._id, role: newRole })}
                isLoading={roleMutation.isPending}
              >
                Apply Role
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  UserPlus,
  CheckCircle2,
  XCircle,
  LogOut,
  Trash2,
  FolderKanban,
  ShieldCheck,
  Mail,
  ChevronRight,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal, ConfirmDialog } from '../components/common/Modal';
import { Input, Textarea } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate } from '../lib/utils';

export function TeamsPage() {
  const { user, isLeader, isAdmin } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');

  const [inviteModalTeam, setInviteModalTeam] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');

  const [activeTeamDetail, setActiveTeamDetail] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);

  // 1. Fetch User Teams
  const { data: teamsData, isLoading: isTeamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data.data.teams;
    },
  });

  // 2. Fetch User Pending Invitations
  const { data: invitationsData } = useQuery({
    queryKey: ['myInvitations'],
    queryFn: async () => {
      const res = await api.get('/teams/invitations/my');
      return res.data.data.invitations;
    },
  });

  const teams = teamsData || [];
  const invitations = invitationsData || [];

  // Create Team Mutation
  const createTeamMutation = useMutation({
    mutationFn: (payload) => api.post('/teams', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      toast.success('Team created successfully!');
      setIsCreateModalOpen(false);
      setTeamName('');
      setTeamDescription('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create team');
    },
  });

  // Send Invitation Mutation
  const inviteMutation = useMutation({
    mutationFn: ({ teamId, email }) => api.post(`/teams/${teamId}/invitations`, { email }),
    onSuccess: () => {
      toast.success('Invitation sent to student successfully');
      setInviteModalTeam(null);
      setInviteEmail('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    },
  });

  // Accept Invitation Mutation
  const acceptInviteMutation = useMutation({
    mutationFn: (inviteId) => api.post(`/teams/invitations/${inviteId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['myInvitations'] });
      toast.success('You have joined the team!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    },
  });

  // Reject Invitation Mutation
  const rejectInviteMutation = useMutation({
    mutationFn: (inviteId) => api.post(`/teams/invitations/${inviteId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInvitations'] });
      toast.info('Invitation rejected');
    },
  });

  // Delete Team Mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (teamId) => api.delete(`/teams/${teamId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted successfully');
      setTeamToDelete(null);
      if (activeTeamDetail?._id === teamToDelete) {
        setActiveTeamDetail(null);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete team');
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Project Teams
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Collaborate on group capstones, coordinate deliverables, and manage student assignments.
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} icon={Plus} size="sm">
          Create New Team
        </Button>
      </div>

      {/* Pending Invitations Banner (if any) */}
      {invitations.length > 0 && (
        <div className="p-4 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-xs font-bold text-brand-900 dark:text-brand-200">
              Pending Team Invitations ({invitations.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {invitations.map((inv) => (
              <div
                key={inv._id}
                className="p-3 bg-white dark:bg-slate-900 border border-brand-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {inv.team?.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Invited by {inv.invitedBy?.name} • Expires {formatDate(inv.expiresAt)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="success"
                    className="py-1 px-2.5 text-xs"
                    onClick={() => acceptInviteMutation.mutate(inv._id)}
                    isLoading={acceptInviteMutation.isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="py-1 px-2.5 text-xs"
                    onClick={() => rejectInviteMutation.mutate(inv._id)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams Grid */}
      {teams.length === 0 && !isTeamsLoading ? (
        <EmptyState
          icon={Users}
          title="No teams joined yet"
          description="Create a team to lead capstone projects, or wait for an invitation from your team leader."
          actionText="Create Team"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => {
            const isUserLeader = team.leader?._id === user?._id || team.leader === user?._id;

            return (
              <Card key={team._id} className="hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    {isUserLeader && (
                      <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                        Leader
                      </span>
                    )}
                  </div>

                  <CardTitle className="mt-3 text-base">{team.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {team.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="py-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5" />
                      {team.members?.length || 1} Member(s)
                    </span>
                    <span className="truncate max-w-[130px]">
                      Lead: {team.leader?.name || 'Leader'}
                    </span>
                  </div>

                  {/* Members preview */}
                  <div className="flex items-center -space-x-1.5 mt-3 overflow-hidden">
                    {team.members?.slice(0, 5).map((m, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 text-slate-700 dark:text-slate-300 font-bold text-[9px] flex items-center justify-center"
                        title={m.user?.name}
                      >
                        {m.user?.name?.charAt(0).toUpperCase() || 'M'}
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="gap-2">
                  {(isUserLeader || isAdmin) && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={UserPlus}
                      onClick={() => setInviteModalTeam(team)}
                    >
                      Invite
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setActiveTeamDetail(team)}
                  >
                    View Team <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>

                  {(isUserLeader || isAdmin) && (
                    <button
                      onClick={() => setTeamToDelete(team._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      title="Delete Team"
                      aria-label="Delete Team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Academic Team"
        description="Establish a collaborative workspace for group projects and task assignment."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (teamName.trim()) {
              createTeamMutation.mutate({ name: teamName.trim(), description: teamDescription.trim() });
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Team Name *"
            placeholder="e.g. Distributed Database Research Group"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="Project scope, team goals, milestones..."
            value={teamDescription}
            onChange={(e) => setTeamDescription(e.target.value)}
            rows={3}
          />

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createTeamMutation.isPending}>
              Create Team
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        isOpen={Boolean(inviteModalTeam)}
        onClose={() => setInviteModalTeam(null)}
        title={`Invite Student to "${inviteModalTeam?.name}"`}
        description="Enter the college email address of the student to send an in-app team invitation."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inviteEmail.trim() && inviteModalTeam) {
              inviteMutation.mutate({ teamId: inviteModalTeam._id, email: inviteEmail.trim() });
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Student Email Address *"
            type="email"
            placeholder="student@stms.edu"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setInviteModalTeam(null)}>
              Cancel
            </Button>
            <Button type="submit" icon={UserPlus} isLoading={inviteMutation.isPending}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Team Detail View Modal */}
      {activeTeamDetail && (
        <Modal
          isOpen={Boolean(activeTeamDetail)}
          onClose={() => setActiveTeamDetail(null)}
          title={activeTeamDetail.name}
          description={activeTeamDetail.description || 'Academic Project Team'}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Team Members ({activeTeamDetail.members?.length || 1})
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {activeTeamDetail.members?.map((m, idx) => (
                  <div key={idx} className="p-3 px-4 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center">
                        {m.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {m.user?.name || 'Member'}
                        </p>
                        <p className="text-[10px] text-slate-400">{m.user?.email}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {m.role || 'Member'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button onClick={() => setActiveTeamDetail(null)} size="sm">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Team Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(teamToDelete)}
        onClose={() => setTeamToDelete(null)}
        onConfirm={() => deleteTeamMutation.mutate(teamToDelete)}
        title="Delete Team"
        message="Are you sure you want to delete this team? Associated team tasks will be detached from this team."
        confirmText="Yes, Delete Team"
        isLoading={deleteTeamMutation.isPending}
      />
    </div>
  );
}

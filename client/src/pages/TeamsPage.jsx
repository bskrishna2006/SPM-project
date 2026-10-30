import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  Kanban,
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  BarChart3,
  ExternalLink,
  UserMinus,
  Send,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal, ConfirmDialog } from '../components/common/Modal';
import { Input, Textarea } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, isOverdue } from '../lib/utils';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { TaskModal } from '../components/tasks/TaskModal';

export function TeamsPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Create Team Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');

  // Team Hub Drawer / Modal State
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [hubTab, setHubTab] = useState('tasks'); // 'tasks' | 'members' | 'invitations'

  // Task Creation Modal for Team
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalTeamId, setTaskModalTeamId] = useState(null);

  // Invite Member State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteModalTeam, setInviteModalTeam] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');

  // Confirmation Dialog States
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null); // { teamId, userId, userName, isSelf }

  // 1. Fetch User Teams
  const { data: teamsData, isLoading: isTeamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data.data.teams;
    },
  });

  // 2. Fetch User Pending Invitations (sent to the current logged-in user)
  const { data: invitationsData } = useQuery({
    queryKey: ['myInvitations'],
    queryFn: async () => {
      const res = await api.get('/teams/invitations/my');
      return res.data.data.invitations;
    },
  });

  // 3. Fetch Full Team Details for Selected Team in Hub
  const { data: teamDetailData, isLoading: isTeamDetailLoading } = useQuery({
    queryKey: ['teamDetail', selectedTeamId],
    enabled: Boolean(selectedTeamId),
    queryFn: async () => {
      const res = await api.get(`/teams/${selectedTeamId}`);
      return res.data.data;
    },
  });

  // 4. Fetch Sent Invitations for Selected Team (Leader view)
  const { data: teamSentInvitesData } = useQuery({
    queryKey: ['teamSentInvitations', selectedTeamId],
    enabled: Boolean(selectedTeamId),
    queryFn: async () => {
      const res = await api.get(`/teams/${selectedTeamId}/invitations`);
      return res.data.data.invitations || [];
    },
  });

  // 5. Fetch Registered Students Directory (for quick invitation selection)
  const { data: studentsData } = useQuery({
    queryKey: ['availableStudents'],
    queryFn: async () => {
      const res = await api.get('/students?limit=100');
      return res.data.data.students || [];
    },
  });

  const teams = teamsData || [];
  const myInvitations = invitationsData || [];
  const students = studentsData || [];

  const activeTeam = teamDetailData?.team || null;
  const activeTeamTasks = teamDetailData?.tasks || [];
  const activeTeamStats = teamDetailData?.stats || {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    inReviewTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  };
  const activeTeamPermissions = teamDetailData?.permissions || { isLeader: false, isMember: false };
  const activeTeamSentInvites = teamSentInvitesData || [];

  // ================= MUTATIONS =================

  // Create Team
  const createTeamMutation = useMutation({
    mutationFn: (payload) => api.post('/teams', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      toast.success('Team workspace created successfully!');
      setIsCreateModalOpen(false);
      setTeamName('');
      setTeamDescription('');
      if (res.data?.data?.team?._id) {
        setSelectedTeamId(res.data.data.team._id);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create team');
    },
  });

  // Send Invitation
  const inviteMutation = useMutation({
    mutationFn: ({ teamId, email }) => api.post(`/teams/${teamId}/invitations`, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSentInvitations', selectedTeamId] });
      toast.success('Invitation sent to student successfully');
      setIsInviteModalOpen(false);
      setInviteModalTeam(null);
      setInviteEmail('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    },
  });

  // Cancel Sent Invitation
  const cancelInviteMutation = useMutation({
    mutationFn: (inviteId) => api.delete(`/teams/invitations/${inviteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSentInvitations', selectedTeamId] });
      toast.info('Invitation cancelled');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to cancel invitation');
    },
  });

  // Accept My Invitation
  const acceptInviteMutation = useMutation({
    mutationFn: (inviteId) => api.post(`/teams/invitations/${inviteId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['myInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      toast.success('You have joined the team!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    },
  });

  // Reject My Invitation
  const rejectInviteMutation = useMutation({
    mutationFn: (inviteId) => api.post(`/teams/invitations/${inviteId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInvitations'] });
      toast.info('Invitation declined');
    },
  });

  // Remove Member or Leave Team
  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }) => api.delete(`/teams/${teamId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teamDetail', selectedTeamId] });
      toast.success(memberToRemove?.isSelf ? 'You have left the team.' : 'Member removed from team.');
      setMemberToRemove(null);
      if (memberToRemove?.isSelf) {
        setSelectedTeamId(null);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    },
  });

  // Delete Team
  const deleteTeamMutation = useMutation({
    mutationFn: (teamId) => api.delete(`/teams/${teamId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      toast.success('Team deleted successfully');
      setTeamToDelete(null);
      if (selectedTeamId === teamToDelete) {
        setSelectedTeamId(null);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete team');
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60">
              COLLABORATION HUBS
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {teams.length} {teams.length === 1 ? 'team' : 'teams'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Project Teams
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            Coordinate capstone deliverables, assign sprint milestones, and track member velocity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={() => setIsCreateModalOpen(true)} icon={Plus} size="sm">
            Create Team
          </Button>
        </div>
      </div>

      {/* Pending Invitations Banner (if any received by the current student) */}
      {myInvitations.length > 0 && (
        <div className="p-4 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-200">
              Pending Team Invitations ({myInvitations.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myInvitations.map((inv) => (
              <div
                key={inv._id}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {inv.team?.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Invited by {inv.invitedBy?.name} • Expires {formatDate(inv.expiresAt)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    className="py-1 px-2.5 text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900"
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
          description="Create an academic team to coordinate your capstone project, or accept an invitation from your team leader."
          actionText="Create Team"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const isUserLeader = team.leader?._id === user?._id || team.leader === user?._id;

            return (
              <Card
                key={team._id}
                className="hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    {isUserLeader && (
                      <span className="text-[10px] font-mono font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/60">
                        LEADER
                      </span>
                    )}
                  </div>

                  <CardTitle className="mt-2.5 text-base">{team.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">
                    {team.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="py-2 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5" />
                      {team.members?.length || 1} Member(s)
                    </span>
                    <span className="truncate max-w-[140px] text-[11px] font-mono text-slate-400">
                      Lead: {team.leader?.name || 'Leader'}
                    </span>
                  </div>

                  {/* Members preview */}
                  <div className="flex items-center -space-x-1.5 overflow-hidden">
                    {team.members?.slice(0, 5).map((m, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 text-slate-800 dark:text-slate-200 font-bold text-[9px] flex items-center justify-center"
                        title={m.user?.name}
                      >
                        {m.user?.name?.charAt(0).toUpperCase() || 'M'}
                      </div>
                    ))}
                    {(team.members?.length || 0) > 5 && (
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 text-slate-500 font-bold text-[9px] flex items-center justify-center">
                        +{(team.members?.length || 0) - 5}
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs flex items-center gap-1"
                    onClick={() => {
                      setTaskModalTeamId(team._id);
                      setIsTaskModalOpen(true);
                    }}
                    title="Assign a new task to this team"
                  >
                    <Plus className="w-3.5 h-3.5" /> Task
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="ml-auto text-xs"
                    onClick={() => {
                      setSelectedTeamId(team._id);
                      setHubTab('tasks');
                    }}
                  >
                    Team Hub <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>

                  {(isUserLeader || isAdmin) && (
                    <button
                      onClick={() => setTeamToDelete(team._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded transition-colors"
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

      {/* ================= TEAM HUB MODAL (COMPLETE WORKSPACE) ================= */}
      {selectedTeamId && (
        <Modal
          isOpen={Boolean(selectedTeamId)}
          onClose={() => setSelectedTeamId(null)}
          title={activeTeam?.name || 'Team Workspace'}
          description={activeTeam?.description || 'Academic Collaboration Hub'}
          maxWidth="max-w-4xl"
        >
          {isTeamDetailLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading team workspace...</div>
          ) : (
            <div className="space-y-5">
              {/* Top Hub Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Total Tasks</span>
                  <span className="text-base font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {activeTeamStats.totalTasks}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">In Progress</span>
                  <span className="text-base font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {activeTeamStats.inProgressTasks}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">In Review</span>
                  <span className="text-base font-mono font-semibold text-purple-600 dark:text-purple-400">
                    {activeTeamStats.inReviewTasks}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Completed</span>
                  <span className="text-base font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {activeTeamStats.completedTasks}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80 col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Completion</span>
                  <span className="text-base font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {activeTeamStats.completionRate}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-900 dark:bg-slate-100 h-full transition-all duration-300"
                  style={{ width: `${activeTeamStats.completionRate}%` }}
                />
              </div>

              {/* Tab Navigation & Hub Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHubTab('tasks')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      hubTab === 'tasks'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    Tasks ({activeTeamTasks.length})
                  </button>
                  <button
                    onClick={() => setHubTab('members')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      hubTab === 'members'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    Members ({activeTeam?.members?.length || 1})
                  </button>
                  {activeTeamPermissions.isLeader && (
                    <button
                      onClick={() => setHubTab('invitations')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        hubTab === 'invitations'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      Pending Invites ({activeTeamSentInvites.length})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      setSelectedTeamId(null);
                      navigate(`/tasks?team=${activeTeam?._id}`);
                    }}
                    icon={Kanban}
                  >
                    Open Kanban Board
                  </Button>

                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setTaskModalTeamId(activeTeam?._id);
                      setIsTaskModalOpen(true);
                    }}
                    icon={Plus}
                  >
                    Assign Task
                  </Button>
                </div>
              </div>

              {/* TAB 1: TEAM TASKS */}
              {hubTab === 'tasks' && (
                <div className="space-y-3">
                  {activeTeamTasks.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No tasks assigned yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Create the first milestone or deliverable for this team.
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 text-xs"
                        onClick={() => {
                          setTaskModalTeamId(activeTeam?._id);
                          setIsTaskModalOpen(true);
                        }}
                        icon={Plus}
                      >
                        Create Deliverable
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-lg overflow-hidden">
                      {activeTeamTasks.map((t) => (
                        <div
                          key={t._id}
                          className="p-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between gap-3 text-xs transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <PriorityBadge priority={t.priority} />
                              <StatusBadge status={t.status} />
                              {t.dueDate && (
                                <span className={`text-[10px] font-mono ${
                                  isOverdue(t.dueDate) && t.status !== 'Completed' ? 'text-rose-500 font-semibold' : 'text-slate-400'
                                }`}>
                                  Due: {formatDate(t.dueDate)}
                                </span>
                              )}
                            </div>
                            <h5 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {t.title}
                            </h5>
                          </div>

                          {/* Assignees */}
                          <div className="flex items-center -space-x-1.5 shrink-0">
                            {t.assignees?.map((a, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[8px] flex items-center justify-center border border-white dark:border-slate-900"
                                title={a.name}
                              >
                                {a.name?.charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MEMBERS & WORKLOAD */}
              {hubTab === 'members' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                      Enrolled Students & Faculty ({activeTeam?.members?.length || 1})
                    </span>
                    {activeTeamPermissions.isLeader && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          setInviteModalTeam(activeTeam);
                          setIsInviteModalOpen(true);
                        }}
                        icon={UserPlus}
                      >
                        Invite Student
                      </Button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    {activeTeam?.members?.map((m, idx) => {
                      const memberUserId = m.user?._id || m.user;
                      const isLeaderOfTeam = activeTeam.leader?._id === memberUserId || activeTeam.leader === memberUserId;
                      const isCurrentUser = user?._id === memberUserId;

                      // Count tasks assigned to this member in this team
                      const assignedCount = activeTeamTasks.filter((t) =>
                        t.assignees?.some((a) => (a._id || a).toString() === memberUserId.toString())
                      ).length;

                      return (
                        <div key={idx} className="p-3 px-4 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                              {m.user?.name?.charAt(0).toUpperCase() || 'M'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {m.user?.name || 'Member'}{' '}
                                {isCurrentUser && <span className="text-slate-400 font-normal">(You)</span>}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {m.user?.email} • {m.user?.department || 'Engineering'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[11px] font-mono text-slate-500">
                              {assignedCount} {assignedCount === 1 ? 'task' : 'tasks'}
                            </span>

                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              isLeaderOfTeam
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}>
                              {isLeaderOfTeam ? 'LEADER' : 'MEMBER'}
                            </span>

                            {/* Remove or Leave Action */}
                            {!isLeaderOfTeam && (activeTeamPermissions.isLeader || isCurrentUser) && (
                              <button
                                onClick={() =>
                                  setMemberToRemove({
                                    teamId: activeTeam._id,
                                    userId: memberUserId,
                                    userName: m.user?.name || 'this member',
                                    isSelf: isCurrentUser,
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                                title={isCurrentUser ? 'Leave Team' : 'Remove from Team'}
                              >
                                {isCurrentUser ? <LogOut className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: PENDING INVITATIONS (LEADER PERSPECTIVE) */}
              {hubTab === 'invitations' && activeTeamPermissions.isLeader && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                      Sent Team Invitations ({activeTeamSentInvites.length})
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        setInviteModalTeam(activeTeam);
                        setIsInviteModalOpen(true);
                      }}
                      icon={UserPlus}
                    >
                      Invite Another Student
                    </Button>
                  </div>

                  {activeTeamSentInvites.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400">
                      No pending invitations for this team.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      {activeTeamSentInvites.map((inv) => (
                        <div key={inv._id} className="p-3 px-4 flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {inv.invitee?.name || inv.invitee?.email || 'Student'}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {inv.invitee?.email} • Sent {formatDate(inv.createdAt)} • Status: {inv.status}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase">
                              {inv.status}
                            </span>

                            {inv.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="py-1 px-2 text-[11px] text-rose-600 hover:text-rose-700 border-rose-200"
                                onClick={() => cancelInviteMutation.mutate(inv._id)}
                                isLoading={cancelInviteMutation.isPending}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hub Modal Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button onClick={() => setSelectedTeamId(null)} size="sm">
                  Close Hub
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ================= CREATE TEAM MODAL ================= */}
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
            placeholder="e.g. Distributed Systems Research Group"
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

      {/* ================= INVITE MEMBER MODAL WITH QUICK DIRECTORY SELECT ================= */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteModalTeam(null);
        }}
        title={`Invite Student to "${inviteModalTeam?.name}"`}
        description="Select a registered student or enter their college email to send an in-app team invitation."
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
          {/* Quick Select from Students Directory */}
          {students.length > 0 && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Quick Select Registered Student
              </label>
              <select
                onChange={(e) => setInviteEmail(e.target.value)}
                value={inviteEmail}
                className="w-full text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">-- Or choose from student directory --</option>
                {students
                  .filter((s) => s.email !== user?.email)
                  .map((s) => (
                    <option key={s._id} value={s.email}>
                      {s.name} ({s.email}) — {s.department || s.course}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <Input
            label="Student Email Address *"
            type="email"
            placeholder="student@stms.edu"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setIsInviteModalOpen(false);
                setInviteModalTeam(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" icon={UserPlus} isLoading={inviteMutation.isPending}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= TASK MODAL FOR TEAM ================= */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskModalTeamId(null);
          // Refresh team hub tasks
          if (selectedTeamId) {
            queryClient.invalidateQueries({ queryKey: ['teamDetail', selectedTeamId] });
          }
        }}
        defaultTeamId={taskModalTeamId}
      />

      {/* ================= REMOVE MEMBER / LEAVE TEAM CONFIRMATION ================= */}
      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={() =>
          memberToRemove &&
          removeMemberMutation.mutate({ teamId: memberToRemove.teamId, userId: memberToRemove.userId })
        }
        title={memberToRemove?.isSelf ? 'Leave Team' : 'Remove Team Member'}
        message={
          memberToRemove?.isSelf
            ? 'Are you sure you want to leave this team? Any tasks assigned to you in this team will remain attached to the team.'
            : `Are you sure you want to remove ${memberToRemove?.userName} from this team?`
        }
        confirmText={memberToRemove?.isSelf ? 'Leave Team' : 'Remove Member'}
        isLoading={removeMemberMutation.isPending}
      />

      {/* ================= DELETE TEAM CONFIRMATION ================= */}
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

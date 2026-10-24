import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Calendar,
  Clock,
  User,
  Paperclip,
  MessageSquare,
  Upload,
  Download,
  Trash2,
  Edit,
  Copy,
  Send,
  CheckCircle2,
  AlertTriangle,
  History,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatDate, formatDateTime, isOverdue } from '../../lib/utils';
import { ConfirmDialog } from '../common/Modal';

export function TaskDetailDrawer({ taskId, isOpen, onClose, onEditTask }) {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { joinTask, leaveTask } = useSocket();

  const [commentInput, setCommentInput] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'attachments' | 'activity'
  const [isUploading, setIsUploading] = useState(false);

  // Join socket room for real-time comments & task updates
  useEffect(() => {
    if (isOpen && taskId) {
      joinTask(taskId);
      return () => leaveTask(taskId);
    }
  }, [isOpen, taskId, joinTask, leaveTask]);

  // Fetch Task Details
  const { data: taskData, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}`);
      return res.data.data;
    },
    enabled: Boolean(isOpen && taskId),
  });

  const task = taskData?.task;
  const permissions = taskData?.permissions || {};

  // Fetch Comments
  const { data: commentsData } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}/comments`);
      return res.data.data.comments;
    },
    enabled: Boolean(isOpen && taskId),
  });

  // Fetch Activity Log
  const { data: activityData } = useQuery({
    queryKey: ['taskActivity', taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}/activity`);
      return res.data.data.activities;
    },
    enabled: Boolean(isOpen && taskId && activeTab === 'activity'),
  });

  // Change Status Mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus) => api.patch(`/tasks/${taskId}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      toast.success('Task status updated');
    },
  });

  // Add Comment Mutation
  const commentMutation = useMutation({
    mutationFn: (content) => api.post(`/tasks/${taskId}/comments`, { content }),
    onSuccess: () => {
      setCommentInput('');
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      toast.success('Comment posted');
    },
  });

  // Delete Comment Mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      toast.success('Comment removed');
    },
  });

  // Delete Task Mutation
  const deleteTaskMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      toast.success('Task deleted successfully');
      setIsDeleteDialogOpen(false);
      onClose();
    },
  });

  // Upload Attachments
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      setIsUploading(true);
      await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('File(s) uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Download Attachment
  const handleDownload = (attachmentId, filename) => {
    window.open(`/api/v1/attachments/${attachmentId}/download`, '_blank');
  };

  // Delete Attachment
  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await api.delete(`/attachments/${attachmentId}`);
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Attachment deleted');
    } catch (err) {
      toast.error('Failed to delete attachment');
    }
  };

  if (!isOpen) return null;

  const overdue = task ? isOverdue(task.dueDate, task.status) : false;

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Drawer Container */}
        <div className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 animate-slide-left">
          {/* Drawer Header */}
          <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task && <PriorityBadge priority={task.priority} />}
              {task?.team && (
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-0.5 rounded-full">
                  {task.team.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {permissions.canEdit && onEditTask && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={Edit}
                  onClick={() => {
                    onEditTask(task);
                  }}
                >
                  Edit
                </Button>
              )}

              {permissions.canDelete && (
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  title="Delete Task"
                  aria-label="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close task details drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading || !task ? (
              <div className="space-y-4">
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            ) : (
              <>
                {/* Title and Status Control */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {task.title}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500">Status:</span>
                    <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950">
                      {['To Do', 'In Progress', 'In Review', 'Completed'].map((s) => (
                        <button
                          key={s}
                          onClick={() => statusMutation.mutate(s)}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                            task.status === s
                              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Description
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {task.description || 'No description provided.'}
                  </p>
                </div>

                {/* Key Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Due Date</span>
                    <p className={`font-semibold mt-1 flex items-center gap-1 ${overdue ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      {task.dueDate ? formatDate(task.dueDate) : 'None'}
                      {overdue && ' (Overdue)'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium">Estimated Effort</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {task.estimatedHours || 0} hrs
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium">Created By</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1 truncate">
                      <User className="w-3.5 h-3.5" />
                      {task.createdBy?.name || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Assignees */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Assignees ({task.assignees?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {task.assignees?.map((a) => (
                      <div
                        key={a._id}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                      >
                        <div className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[9px] flex items-center justify-center">
                          {a.name?.charAt(0).toUpperCase()}
                        </div>
                        <span>{a.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {task.tags.map((t, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collaboration Tabs: Comments / Attachments / Activity */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mb-4">
                    <button
                      onClick={() => setActiveTab('comments')}
                      className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                        activeTab === 'comments'
                          ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Comments ({commentsData?.length || 0})
                    </button>

                    <button
                      onClick={() => setActiveTab('attachments')}
                      className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                        activeTab === 'attachments'
                          ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      Attachments ({task.attachments?.length || 0})
                    </button>

                    <button
                      onClick={() => setActiveTab('activity')}
                      className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                        activeTab === 'activity'
                          ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      Activity Log
                    </button>
                  </div>

                  {/* Tab 1: Comments */}
                  {activeTab === 'comments' && (
                    <div className="space-y-4">
                      {/* Comments Feed */}
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {!commentsData || commentsData.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">No comments yet. Start the conversation!</p>
                        ) : (
                          commentsData.map((c) => (
                            <div
                              key={c._id}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-[10px] flex items-center justify-center">
                                    {c.author?.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                    {c.author?.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {formatDateTime(c.createdAt)}
                                  </span>
                                </div>

                                {(c.author?._id === user?._id || user?.role === 'admin') && (
                                  <button
                                    onClick={() => deleteCommentMutation.mutate(c._id)}
                                    className="text-slate-400 hover:text-rose-500 p-1"
                                    title="Delete comment"
                                    aria-label="Delete comment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">
                                {c.content}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Comment Input */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (commentInput.trim()) {
                            commentMutation.mutate(commentInput.trim());
                          }
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Write a comment or update..."
                          className="flex-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          icon={Send}
                          disabled={!commentInput.trim() || commentMutation.isPending}
                        >
                          Send
                        </Button>
                      </form>
                    </div>
                  )}

                  {/* Tab 2: Attachments */}
                  {activeTab === 'attachments' && (
                    <div className="space-y-4">
                      {/* Upload Box */}
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-xl cursor-pointer bg-slate-50/50 dark:bg-slate-950/40 transition-colors">
                        <Upload className="w-6 h-6 text-brand-500 mb-1" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {isUploading ? 'Uploading...' : 'Click to upload task attachments'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          PDF, DOCX, XLSX, TXT, PNG, JPG (up to 10MB)
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>

                      {/* Attachments List */}
                      <div className="space-y-2">
                        {task.attachments?.map((att) => (
                          <div
                            key={att._id}
                            className="flex items-center justify-between p-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {att.originalName}
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                ({(att.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDownload(att._id, att.originalName)}
                                className="p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                title="Download"
                                aria-label="Download attachment"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              {(att.uploadedBy?._id === user?._id || permissions.canEdit) && (
                                <button
                                  onClick={() => handleDeleteAttachment(att._id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                                  title="Delete attachment"
                                  aria-label="Delete attachment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Activity Log */}
                  {activeTab === 'activity' && (
                    <div className="space-y-3">
                      {!activityData || activityData.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No activity recorded yet.</p>
                      ) : (
                        activityData.map((act) => (
                          <div key={act._id} className="flex items-start gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                            <div>
                              <p className="text-slate-800 dark:text-slate-200">
                                <span className="font-semibold">{act.actor?.name || 'System'}</span>{' '}
                                {act.action.replace(/_/g, ' ')}
                              </p>
                              <span className="text-[10px] text-slate-400">{formatDateTime(act.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deleteTaskMutation.mutate()}
        title="Delete Task"
        message="Are you sure you want to delete this task? All attached comments, files, and activity logs will be permanently removed."
        confirmText="Yes, Delete Task"
        isLoading={deleteTaskMutation.isPending}
      />
    </>
  );
}

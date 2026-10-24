import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderOpen,
  Search,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  FileCode,
  FileSpreadsheet,
  Calendar,
  User,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate } from '../lib/utils';

export function DocumentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Fetch all documents accessible to user
  const { data: docsData, isLoading } = useQuery({
    queryKey: ['documents', { search, typeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);

      const res = await api.get(`/documents?${params.toString()}`);
      return res.data.data.documents;
    },
  });

  const documents = docsData || [];

  const deleteDocMutation = useMutation({
    mutationFn: (id) => api.delete(`/attachments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  const handleDownload = (id) => {
    window.open(`/api/v1/attachments/${id}/download`, '_blank');
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-rose-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel'))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    return <FileCode className="w-5 h-5 text-brand-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Document & Attachment Library
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Central repository of all research PDFs, lab reports, code archives, and team attachments.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by filename or task title..."
            className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
        >
          <option value="">All Document Types</option>
          <option value="pdf">PDF Documents</option>
          <option value="image">Images</option>
          <option value="word">Word Documents</option>
          <option value="sheet">Spreadsheets</option>
          <option value="text">Text Files</option>
        </select>
      </div>

      {/* Documents Grid / Table */}
      {documents.length === 0 && !isLoading ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents found"
          description="Upload attachments inside any task drawer to populate your centralized document library."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Associated Task</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {getFileIcon(doc.mimeType)}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                          {doc.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
                        {doc.task?.title}
                      </p>
                      {doc.team && (
                        <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                          {doc.team.name}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {(doc.size / 1024).toFixed(1)} KB
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {doc.uploadedBy?.name || 'User'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(doc.uploadedAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownload(doc._id)}
                          className="p-1.5 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors"
                          title="Download Document"
                          aria-label="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {(doc.uploadedBy?._id === user?._id || user?.role === 'admin') && (
                          <button
                            onClick={() => deleteDocMutation.mutate(doc._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

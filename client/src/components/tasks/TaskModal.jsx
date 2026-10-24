import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Input, Textarea, Select } from '../common/Input';
import { Button } from '../common/Button';

export function TaskModal({ isOpen, onClose, taskToEdit = null }) {
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('personal');
  const [status, setStatus] = useState('To Do');
  const [priority, setPriority] = useState('Medium');
  const [team, setTeam] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [tagsInput, setTagsInput] = useState('');
  const [errors, setErrors] = useState({});

  // Fetch teams the user is member or leader of
  const { data: teamsData } = useQuery({
    queryKey: ['myTeams'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data.data.teams;
    },
    enabled: isOpen,
  });

  const teams = teamsData || [];

  // Populate form if editing
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setType(taskToEdit.type || 'personal');
      setStatus(taskToEdit.status || 'To Do');
      setPriority(taskToEdit.priority || 'Medium');
      setTeam(taskToEdit.team?._id || taskToEdit.team || '');
      setAssignees(taskToEdit.assignees?.map((a) => a._id || a) || []);
      setStartDate(taskToEdit.startDate ? taskToEdit.startDate.substring(0, 10) : '');
      setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.substring(0, 10) : '');
      setEstimatedHours(taskToEdit.estimatedHours || 0);
      setTagsInput(taskToEdit.tags?.join(', ') || '');
    } else {
      setTitle('');
      setDescription('');
      setType('personal');
      setStatus('To Do');
      setPriority('Medium');
      setTeam('');
      setAssignees([user?._id].filter(Boolean));
      setStartDate('');
      setDueDate('');
      setEstimatedHours(0);
      setTagsInput('');
    }
    setErrors({});
  }, [taskToEdit, isOpen, user]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (taskToEdit) {
        const res = await api.patch(`/tasks/${taskToEdit._id}`, payload);
        return res.data.data;
      } else {
        const res = await api.post('/tasks', payload);
        return res.data.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      toast.success(taskToEdit ? 'Task updated successfully' : 'Task created successfully');
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to save task';
      toast.error(msg);
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        err.response.data.errors.forEach((e) => {
          fieldErrors[e.field] = e.message;
        });
        setErrors(fieldErrors);
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrors({ title: 'Task title is required' });
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      type: team ? (type === 'academic_project' ? 'academic_project' : 'team') : 'personal',
      status,
      priority,
      team: team || null,
      assignees: assignees.length > 0 ? assignees : [user?._id],
      startDate: startDate ? new Date(startDate).toISOString() : null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      estimatedHours: Number(estimatedHours) || 0,
      tags,
    };

    saveMutation.mutate(payload);
  };

  // Get eligible assignees from selected team
  const selectedTeamObj = teams.find((t) => t._id === team);
  const eligibleAssignees = selectedTeamObj
    ? [
        { _id: selectedTeamObj.leader?._id || selectedTeamObj.leader, name: `${selectedTeamObj.leader?.name || 'Leader'} (Leader)` },
        ...(selectedTeamObj.members || []).map((m) => ({
          _id: m.user?._id || m.user,
          name: m.user?.name || 'Team Member',
        })),
      ]
    : [{ _id: user?._id, name: `${user?.name || 'You'} (Self)` }];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'Create New Task'}
      description="Plan academic workloads, set deadlines, and coordinate deliverables."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title *"
          placeholder="e.g. Implement Graph Search Algorithm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />

        <Textarea
          label="Description"
          placeholder="Detailed task instructions, requirements, and deliverables..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Task Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="personal">Personal Task</option>
            <option value="team">Team Assignment</option>
            <option value="academic_project">Academic Project</option>
          </Select>

          <Select
            label="Priority Level"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
            <option value="Urgent">Urgent Priority</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Team (Optional)"
            value={team}
            onChange={(e) => {
              setTeam(e.target.value);
              if (!e.target.value) {
                setType('personal');
                setAssignees([user?._id]);
              } else {
                setType('team');
              }
            }}
          >
            <option value="">None (Personal Task)</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </Select>

          <Select
            label="Task Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Completed">Completed</option>
          </Select>
        </div>

        {/* Assignees Selection if Team Selected */}
        {team && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Assignee(s)
            </label>
            <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              {eligibleAssignees.map((a) => {
                const isSelected = assignees.includes(a._id);
                return (
                  <button
                    key={a._id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setAssignees(assignees.filter((id) => id !== a._id));
                      } else {
                        setAssignees([...assignees, a._id]);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Estimated Effort (Hours)"
            type="number"
            min="0"
            step="0.5"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
          />

          <Input
            label="Tags (Comma separated)"
            placeholder="homework, exam, coding"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            {taskToEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { Invitation } from '../models/Invitation.js';
import { Task } from '../models/Task.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { notifyUser, notifyTeamRoom } from '../sockets/socketManager.js';

export async function createTeam(req, res, next) {
  try {
    const { name, description = '' } = req.body;

    const team = await Team.create({
      name,
      description,
      leader: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'leader',
          joinedAt: new Date(),
        },
      ],
      status: 'active',
    });

    // If student created team, upgrade user role to team_leader if student
    if (req.user.role === 'student') {
      await User.findByIdAndUpdate(req.user._id, { role: 'team_leader' });
      req.user.role = 'team_leader';
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email avatar role')
      .populate('members.user', 'name email avatar role department course academicYear');

    await ActivityLog.create({
      actor: req.user._id,
      action: 'created_team',
      resourceType: 'team',
      resourceId: team._id,
      team: team._id,
      metadata: { name: team.name },
    });

    return sendSuccess(res, 'Team created successfully', { team: populatedTeam }, 201);
  } catch (err) {
    return next(err);
  }
}

export async function getTeams(req, res, next) {
  try {
    const { search, status = 'active' } = req.query;
    const query = {};

    if (status) query.status = status;

    if (req.user.role !== 'admin') {
      // Find teams where user is leader or member
      query.$or = [{ leader: req.user._id }, { 'members.user': req.user._id }];
    }

    if (search) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const teams = await Team.find(query)
      .populate('leader', 'name email avatar role')
      .populate('members.user', 'name email avatar role department')
      .sort({ updatedAt: -1 });

    return sendSuccess(res, 'Teams retrieved successfully', { teams });
  } catch (err) {
    return next(err);
  }
}

export async function getTeamById(req, res, next) {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leader', 'name email avatar role department course academicYear')
      .populate('members.user', 'name email avatar role department course academicYear');

    if (!team) {
      return sendError(res, 'Team not found', null, 404);
    }

    const isMember = team.members.some((m) => m.user._id.toString() === req.user._id.toString());
    const isLeader = team.leader._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isMember && !isLeader && !isAdmin) {
      return sendError(res, 'You are not authorized to view this private team.', null, 403);
    }

    // Get team tasks and stats
    const tasks = await Task.find({ team: team._id })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ dueDate: 1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
    const inReviewTasks = tasks.filter((t) => t.status === 'In Review').length;
    const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;

    return sendSuccess(res, 'Team retrieved successfully', {
      team,
      tasks,
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        inReviewTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      permissions: {
        isLeader: isLeader || isAdmin,
        isMember,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateTeam(req, res, next) {
  try {
    const { name, description, status } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return sendError(res, 'Team not found', null, 404);
    }

    const isLeader = team.leader.toString() === req.user._id.toString();
    if (!isLeader && req.user.role !== 'admin') {
      return sendError(res, 'Only the team leader or an administrator can update this team.', null, 403);
    }

    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (status) team.status = status;

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email avatar role')
      .populate('members.user', 'name email avatar role department');

    await ActivityLog.create({
      actor: req.user._id,
      action: 'updated_team',
      resourceType: 'team',
      resourceId: team._id,
      team: team._id,
      metadata: { name: team.name },
    });

    notifyTeamRoom(team._id, 'team:updated', populatedTeam);

    return sendSuccess(res, 'Team updated successfully', { team: populatedTeam });
  } catch (err) {
    return next(err);
  }
}

export async function deleteTeam(req, res, next) {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return sendError(res, 'Team not found', null, 404);
    }

    const isLeader = team.leader.toString() === req.user._id.toString();
    if (!isLeader && req.user.role !== 'admin') {
      return sendError(res, 'Only the team leader or administrator can delete this team.', null, 403);
    }

    // Set tasks with this team to unassigned team
    await Task.updateMany({ team: team._id }, { $set: { team: null, type: 'personal' } });
    await Invitation.deleteMany({ team: team._id });
    await Team.findByIdAndDelete(team._id);

    await ActivityLog.create({
      actor: req.user._id,
      action: 'deleted_team',
      resourceType: 'team',
      resourceId: team._id,
      metadata: { name: team.name },
    });

    notifyTeamRoom(team._id, 'team:deleted', { teamId: team._id });

    return sendSuccess(res, 'Team deleted successfully');
  } catch (err) {
    return next(err);
  }
}

export async function sendInvitation(req, res, next) {
  try {
    const { email, userId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return sendError(res, 'Team not found', null, 404);
    }

    const isLeader = team.leader.toString() === req.user._id.toString();
    if (!isLeader && req.user.role !== 'admin') {
      return sendError(res, 'Only the team leader or administrator can invite members.', null, 403);
    }

    let targetUser = null;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase() });
    }

    if (!targetUser) {
      return sendError(res, 'Student account not found with the provided details.', null, 404);
    }

    if (!targetUser.isActive) {
      return sendError(res, 'Cannot invite an inactive user.', null, 400);
    }

    // Check if already a member
    const alreadyMember = team.members.some((m) => m.user.toString() === targetUser._id.toString());
    if (alreadyMember) {
      return sendError(res, 'Student is already a member of this team.', null, 409);
    }

    // Check for existing pending invitation
    const existingInvite = await Invitation.findOne({
      team: team._id,
      invitee: targetUser._id,
      status: 'pending',
    });

    if (existingInvite) {
      return sendError(res, 'A pending invitation has already been sent to this student.', null, 409);
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      team: team._id,
      invitedBy: req.user._id,
      invitee: targetUser._id,
      status: 'pending',
      expiresAt,
    });

    const populatedInvite = await Invitation.findById(invitation._id)
      .populate('team', 'name description')
      .populate('invitedBy', 'name email avatar')
      .populate('invitee', 'name email avatar');

    // In-app notification to invitee
    const notif = await Notification.create({
      recipient: targetUser._id,
      type: 'team_invitation_received',
      title: 'Team Invitation',
      message: `${req.user.name} invited you to join team "${team.name}".`,
      relatedTeam: team._id,
    });
    notifyUser(targetUser._id, 'notification:received', notif);

    await ActivityLog.create({
      actor: req.user._id,
      action: 'invited_member',
      resourceType: 'team',
      resourceId: team._id,
      team: team._id,
      metadata: { inviteeEmail: targetUser.email },
    });

    return sendSuccess(res, 'Invitation sent successfully', { invitation: populatedInvite }, 201);
  } catch (err) {
    return next(err);
  }
}

export async function getTeamInvitations(req, res, next) {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return sendError(res, 'Team not found', null, 404);
    }

    const isLeader = team.leader.toString() === req.user._id.toString();
    if (!isLeader && req.user.role !== 'admin') {
      return sendError(res, 'Only the team leader can view team invitations.', null, 403);
    }

    const invitations = await Invitation.find({ team: team._id })
      .populate('invitee', 'name email avatar department course academicYear')
      .populate('invitedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Team invitations retrieved', { invitations });
  } catch (err) {
    return next(err);
  }
}

export async function getUserInvitations(req, res, next) {
  try {
    const invitations = await Invitation.find({
      invitee: req.user._id,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .populate('team', 'name description leader')
      .populate('invitedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'User invitations retrieved', { invitations });
  } catch (err) {
    return next(err);
  }
}

export async function acceptInvitation(req, res, next) {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return sendError(res, 'Invitation not found', null, 404);
    }

    if (invitation.invitee.toString() !== req.user._id.toString()) {
      return sendError(res, 'You are not authorized to accept this invitation.', null, 403);
    }

    if (invitation.status !== 'pending') {
      return sendError(res, `Invitation has already been ${invitation.status}.`, null, 400);
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return sendError(res, 'Invitation has expired.', null, 400);
    }

    const team = await Team.findById(invitation.team);
    if (!team) {
      return sendError(res, 'The team for this invitation no longer exists.', null, 404);
    }

    // Add user to team members if not already present
    const alreadyMember = team.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!alreadyMember) {
      team.members.push({
        user: req.user._id,
        role: 'member',
        joinedAt: new Date(),
      });
      await team.save();
    }

    invitation.status = 'accepted';
    await invitation.save();

    // Notify team leader
    const notif = await Notification.create({
      recipient: team.leader,
      type: 'team_invitation_accepted',
      title: 'Invitation Accepted',
      message: `${req.user.name} accepted your invitation to join "${team.name}".`,
      relatedTeam: team._id,
    });
    notifyUser(team.leader, 'notification:received', notif);

    await ActivityLog.create({
      actor: req.user._id,
      action: 'joined_team',
      resourceType: 'team',
      resourceId: team._id,
      team: team._id,
      metadata: { teamName: team.name },
    });

    notifyTeamRoom(team._id, 'team:updated', team);

    return sendSuccess(res, 'Invitation accepted! You are now a member of the team.', { team });
  } catch (err) {
    return next(err);
  }
}

export async function rejectInvitation(req, res, next) {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return sendError(res, 'Invitation not found', null, 404);
    }

    if (invitation.invitee.toString() !== req.user._id.toString()) {
      return sendError(res, 'You are not authorized to reject this invitation.', null, 403);
    }

    if (invitation.status !== 'pending') {
      return sendError(res, `Invitation has already been ${invitation.status}.`, null, 400);
    }

    invitation.status = 'rejected';
    await invitation.save();

    return sendSuccess(res, 'Invitation rejected.');
  } catch (err) {
    return next(err);
  }
}

export async function removeMember(req, res, next) {
  try {
    const { userId } = req.params;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return sendError(res, 'Team not found', null, 404);
    }

    const isLeader = team.leader.toString() === req.user._id.toString();
    const isSelf = req.user._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isLeader && !isSelf && !isAdmin) {
      return sendError(res, 'You are not authorized to remove this member.', null, 403);
    }

    if (team.leader.toString() === userId) {
      return sendError(res, 'Team leader cannot be removed. Transfer leadership or delete the team.', null, 400);
    }

    team.members = team.members.filter((m) => m.user.toString() !== userId);
    await team.save();

    // Reassign or unassign tasks where this member was assignee in this team
    await Task.updateMany(
      { team: team._id, assignees: userId },
      { $pull: { assignees: userId } }
    );

    await ActivityLog.create({
      actor: req.user._id,
      action: isSelf ? 'left_team' : 'removed_team_member',
      resourceType: 'team',
      resourceId: team._id,
      team: team._id,
      metadata: { targetUserId: userId },
    });

    notifyTeamRoom(team._id, 'team:updated', team);

    return sendSuccess(res, isSelf ? 'You have left the team.' : 'Member removed from team.');
  } catch (err) {
    return next(err);
  }
}

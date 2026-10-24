# 📡 STMS REST API Specification

The Student Task Management System exposes a standardized RESTful API under the `/api/v1` namespace.

All responses adhere to the standard envelope format:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "errors": null
}
```

Errors return appropriate HTTP status codes with an error array or message:
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

---

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user (`name`, `email`, `password`, `role`, `department`, `course`) |
| `POST` | `/auth/login` | Public | Authenticate user (`email`, `password`). Returns user and sets HttpOnly cookies |
| `POST` | `/auth/logout` | Public | Clears authentication cookies and terminates session |
| `GET` | `/auth/me` | Authenticated | Retrieve the authenticated user's current profile |
| `POST` | `/auth/refresh` | Public | Issues a new access token using the HttpOnly refresh token cookie |
| `POST` | `/auth/forgot-password`| Public | Requests a password reset token for the specified email |
| `POST` | `/auth/reset-password` | Public | Resets password using `token` and `newPassword` |
| `POST` | `/auth/change-password`| Authenticated | Updates password (`oldPassword`, `newPassword`) |

---

## 2. Tasks (`/api/v1/tasks`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/tasks` | Authenticated | List tasks with filters (`type`, `status`, `priority`, `teamId`, `search`, `page`, `limit`) |
| `POST` | `/tasks` | Authenticated | Create a new task (`title`, `description`, `type`, `priority`, `dueDate`, `assignees`, `team`, `tags`, `estimatedHours`) |
| `GET` | `/tasks/:id` | Authenticated | Get detailed task information by ID |
| `PATCH`| `/tasks/:id` | Authenticated | Update task fields (Ownership or leader access enforced) |
| `PATCH`| `/tasks/:id/status` | Authenticated | Quick status update (`To Do`, `In Progress`, `In Review`, `Completed`) |
| `DELETE`| `/tasks/:id` | Authenticated | Delete task (Task creator, team leader, or admin only) |
| `GET` | `/tasks/:id/activities` | Authenticated | Get audit trail and activity history for a task |
| `POST` | `/tasks/:id/attachments`| Authenticated | Upload attachment files to a task |

---

## 3. Teams (`/api/v1/teams`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/teams` | Authenticated | List teams where user is leader or member |
| `POST` | `/teams` | `team_leader`, `admin` | Create a new project team (`name`, `description`, `course`, `semester`) |
| `GET` | `/teams/:id` | Authenticated | Get team details, member list, and team progress |
| `PATCH`| `/teams/:id` | Team Leader, Admin | Update team details |
| `DELETE`| `/teams/:id` | Team Leader, Admin | Delete team |
| `POST` | `/teams/:id/invitations` | Team Leader, Admin | Send invitation to student by email |
| `GET` | `/teams/invitations/me` | Authenticated | List pending invitations for the logged-in user |
| `POST` | `/teams/invitations/:id/respond` | Authenticated | Accept or reject a team invitation (`action: 'accept' | 'reject'`) |
| `DELETE`| `/teams/:id/members/:userId` | Team Leader, Admin | Remove a student from the team |
| `POST` | `/teams/:id/leave` | Member | Voluntarily leave a team |

---

## 4. Users (`/api/v1/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/users` | Authenticated | Search directory of active students and leaders (`search`, `department`, `page`, `limit`) |
| `GET` | `/users/:id` | Authenticated | Get public user profile |
| `PATCH`| `/users/me` | Authenticated | Update profile details (bio, phone, avatar, preferences) |
| `PATCH`| `/users/:id/role` | `admin` | Update user role (`student`, `team_leader`, `admin`) |
| `PATCH`| `/users/:id/status` | `admin` | Activate or deactivate user account |

---

## 5. Comments (`/api/v1/comments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/comments/task/:taskId` | Authenticated | Retrieve comments for a task (sorted chronological) |
| `POST` | `/comments/task/:taskId` | Authenticated | Add a new comment (`content`) |
| `PATCH`| `/comments/:id` | Authenticated | Edit comment content (Author only) |
| `DELETE`| `/comments/:id` | Authenticated | Delete comment (Author or Admin only) |

---

## 6. Documents Library (`/api/v1/documents`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/documents` | Authenticated | List uploaded task attachments accessible to the user |
| `GET` | `/documents/:id/download` | Authenticated | Secure streaming file download with content disposition |

---

## 7. Notifications (`/api/v1/notifications`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/notifications` | Authenticated | Get notifications for current user (`unreadOnly`, `page`, `limit`) |
| `PATCH`| `/notifications/:id/read` | Authenticated | Mark a single notification as read |
| `PATCH`| `/notifications/read-all` | Authenticated | Mark all notifications as read |

---

## 8. Dashboards & Analytics (`/api/v1/analytics`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/analytics/student` | Authenticated | Student dashboard statistics (task counts, overdue, completion rate, priority breakdown) |
| `GET` | `/analytics/team/:teamId`| Authenticated | Team workload distribution, completion ratios, and assignee stats |
| `GET` | `/analytics/admin` | `admin` | System-wide statistics: active users by role, department distribution, audit logs |

---

## 9. Health & Uptime (`/api/v1/health`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Returns database status, uptime, server timestamp, and environment |

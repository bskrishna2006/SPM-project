# 🎓 Student Task Management System (STMS)

A modern, production-grade **MERN Stack (MongoDB, Express.js, React, Node.js)** web application engineered for university students, team leaders, and academic administrators. STMS delivers comprehensive task management, real-time collaboration, deadline tracking, role-based workflows, and academic project oversight.

---

## ✨ Features & Capabilities

- 🔐 **Authentication & RBAC:**
  - Secure JSON Web Tokens (Access & Refresh tokens) with HttpOnly cookies & Bearer fallback.
  - Three strictly enforced roles: `student`, `team_leader`, and `admin` with deny-by-default route authorization.
  - Profile management, avatar upload, password changes, and self-service password reset flows.

- 📋 **Task Management:**
  - Full CRUD operations with types: **Personal**, **Team**, and **Academic**.
  - Workflow status progression: `To Do` ➔ `In Progress` ➔ `In Review` ➔ `Completed`.
  - Priority levels (`Low`, `Medium`, `High`, `Urgent`), start dates, due dates, and effort estimates (hours).
  - Multi-assignee support, subtask checklists, and file attachments with previews.
  - Interactive **Kanban Board** with HTML5 drag-and-drop column transitions + filterable **List View**.

- 👥 **Team Collaboration:**
  - Create and manage academic project teams with student rosters.
  - Invitation workflow: send invitations by student email with instant `accept` or `reject` actions.
  - Team-scoped task assignment and shared team progress metrics.

- 📅 **Academic Calendar:**
  - Monthly calendar view plotting task deadlines with priority indicators.
  - Quick task inspect modal directly from calendar cells.
  - Urgent and upcoming deadline sidebar widget.

- 💬 **Real-Time Collaboration (Socket.IO):**
  - Authenticated WebSocket rooms (`task:${id}`, `team:${id}`, `user:${id}`).
  - Instant task updates, live comments, team membership changes, and in-app toasts without page reloads.

- 📁 **Documents & File Library:**
  - Upload assignment files, lab reports, and reference materials with MIME & file size validation.
  - Secure, authorized streaming downloads preventing unauthorized directory traversal.

- 📊 **Dashboards & Analytics:**
  - Real-time MongoDB aggregation pipelines (no hardcoded mocks).
  - Visualized charts with **Recharts**: Task completion rates, priority distribution, team workloads, and admin system telemetry.

- 🔔 **Intelligent Deadline Reminders:**
  - Automated background scheduler checking upcoming deadlines (<24h) and overdue tasks every 5 minutes.
  - Prevents duplicate alerts and notifies students in real time.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS, TanStack Query v5, React Router v6, Lucide React, Recharts, Socket.IO Client |
| **Backend** | Node.js (ES Modules), Express.js, MongoDB / Mongoose ODM, Socket.IO, Multer, Helmet, CORS, Rate Limit |
| **Security & Validation** | bcryptjs, Zod validation schemas, JSON Web Tokens (JWT), Cookie-Parser, Safe Path File Streamer |
| **Database Resilience** | MongoDB Atlas connection support with automatic embedded In-Memory MongoDB fallback (`mongodb-memory-server`) |
| **Testing** | Vitest, React Testing Library, Supertest (17/17 backend tests + 5/5 frontend tests passing) |

---

## 🚀 Quick Start & Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- *(Optional)* **MongoDB Atlas URI** (if you don't have MongoDB installed locally, STMS automatically starts an embedded in-memory database in development mode!)

### 2. Clone & Install Dependencies

From the project root:
```bash
npm install
```

### 3. Environment Configuration

The root `.env` is already configured for out-of-the-box development:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=stms_development_secret_access_jwt_2026_xyz123_random_key_token
JWT_ACCESS_EXPIRES_IN=7d
JWT_REFRESH_SECRET=stms_development_secret_refresh_jwt_2026_abc456_random_key_token
JWT_REFRESH_EXPIRES_IN=30d
COOKIE_NAME=stms_access_token
COOKIE_REFRESH_NAME=stms_refresh_token
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
```

> 💡 **Using MongoDB Atlas**: Simply paste your Atlas connection string into `MONGODB_URI`:
> ```env
> MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/stms?retryWrites=true&w=majority
> ```
> If `MONGODB_URI` is left blank, the server automatically starts an embedded MongoDB in-memory instance.

### 4. Seed Demo Data

Run the database seeder to populate sample students, teams, tasks, comments, and notifications:

```bash
npm run seed
```

### 5. Start the Application

You can start both backend and frontend concurrently with a single command from the root:

```bash
npm run dev
```

Or start them individually in separate terminals:

```bash
# Terminal 1 - Backend Server (Port 5000)
npm run dev:server

# Terminal 2 - Frontend Client (Port 5173)
npm run dev:client
```

Open your browser at **`http://localhost:5173`**.

---

## 🔑 Demo Credentials

All seeded accounts use the password: `Password123!`

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@stms.edu` | `Password123!` | System oversight, user directory, role management, audit logs |
| **Team Leader** | `maya.leader@stms.edu` | `Password123!` | Team management, task assignments, team analytics, invitations |
| **Student** | `alex.student@stms.edu` | `Password123!` | Personal tasks, team board, calendar, documents, notifications |
| **Student (Member)** | `liam.chen@stms.edu` | `Password123!` | Academic project peer, tasks, team collaboration |

---

## 🧪 Testing

Execute the automated test suites:

```bash
# Run all tests (Server + Client)
npm run test

# Run backend API tests only (17 test cases)
npm run test:server

# Run frontend component tests only
npm run test:client
```

---

## 📁 Project Structure

```text
├── client/                     # Frontend React + Vite Application
│   ├── src/
│   │   ├── api/client.js       # Axios HTTP client with interceptors
│   │   ├── components/         # Reusable UI & domain components
│   │   │   ├── common/         # Button, Card, Input, Modal, Badge, EmptyState
│   │   │   ├── layout/         # Header, Sidebar, Navigation
│   │   │   └── tasks/          # KanbanBoard, TaskCard, TaskModal, TaskDetailDrawer
│   │   ├── context/            # AuthContext, ThemeContext, ToastContext, SocketContext
│   │   ├── layouts/            # DashboardLayout master shell
│   │   ├── lib/utils.js        # Formatting, cn() class merger
│   │   ├── pages/              # Application views
│   │   │   ├── admin/          # AdminUsersPage, AdminAnalyticsPage
│   │   │   ├── auth/           # LoginPage, RegisterPage, Forgot/ResetPassword
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   ├── CalendarPage.jsx
│   │   │   ├── TeamsPage.jsx
│   │   │   ├── StudentsPage.jsx
│   │   │   ├── DocumentsPage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── routes/             # ProtectedRoute & Role Guards
│   │   ├── test/               # Vitest component test suites
│   │   ├── App.jsx             # React Router configuration
│   │   ├── index.css           # Tailwind design tokens & typography
│   │   └── main.jsx            # Application entrypoint
│   └── vite.config.js          # Vite config with HMR & API proxy
│
├── server/                     # Backend Node.js + Express API
│   ├── src/
│   │   ├── config/             # Environment, Database (Atlas & In-Memory)
│   │   ├── controllers/        # Auth, Tasks, Teams, Users, Comments, Docs, Analytics
│   │   ├── jobs/               # Background deadline reminder scheduler
│   │   ├── middleware/         # Auth JWT, Role RBAC, Rate Limiter, Multer Upload, Errors
│   │   ├── models/             # User, Task, Team, Comment, Notification, Invitation, Log
│   │   ├── routes/             # Express API v1 route definitions
│   │   ├── scripts/seed.js     # Comprehensive database seed script
│   │   ├── sockets/            # Socket.IO authenticated room manager
│   │   ├── utils/              # Structured Logger, JWT helper, Response envelope
│   │   ├── validators/         # Zod request payload schemas
│   │   ├── app.js              # Express app setup (Helmet, CORS, Middlewares)
│   │   └── server.js           # Server bootstrap & graceful shutdown
│   └── tests/api.test.js       # 17 Vitest backend integration test cases
│
├── docs/                       # Technical & Architectural Documentation
│   ├── architecture.md         # Architecture diagrams, RBAC design & Socket flows
│   ├── api.md                  # REST API endpoint reference
│   └── setup.md                # Deployment, Atlas setup & troubleshooting
└── package.json                # Root workspace configuration
```

---

## 🛡️ Security Features

1. **Deny-by-Default Access Control**: All task and team mutations verify user ownership or team leadership on the server side.
2. **Safe File Handling**: Uploaded files are assigned random UUID names, stripped of dangerous characters, MIME-checked, and stored outside the web root. File downloads use sanitized, streaming handlers.
3. **NoSQL Injection Defense**: Strict Zod schema validation on body, query params, and route IDs.
4. **Brute Force Protection**: Multi-tiered rate limiters for general API routes and strict limiters for authentication endpoints (`/auth/login`, `/auth/register`).
5. **Secure Headers**: Express Helmet configured with Content Security Policy, XSS filtering, frameguard, and referrer policies.

---

## 📜 License
Licensed under the ISC License.

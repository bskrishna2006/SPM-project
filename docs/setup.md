# 🚀 STMS Setup & Operations Guide

This guide details environment setup, database connectivity (MongoDB Atlas & embedded fallback), running development and production builds, running test suites, and troubleshooting common issues.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or later (Tested with Node v24.14.0)
- **npm**: v9.0.0 or later (Tested with npm 11.9.0)
- **Git**

---

## 2. Environment Variables

Create or review the `.env` file in the project root:

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

### MongoDB Connection Options:
1. **Embedded In-Memory Mode (Zero Setup)**:
   - Leave `MONGODB_URI` empty or unset.
   - When the backend starts, `mongodb-memory-server` will automatically spin up an embedded MongoDB binary. This allows you to immediately run and test the full application without installing MongoDB locally.
2. **MongoDB Atlas (Production / Cloud)**:
   - When you have your MongoDB Atlas URI, set:
     ```env
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/stms?retryWrites=true&w=majority
     ```
   - STMS will automatically detect the Atlas URI and establish a persistent cloud connection.

---

## 3. Database Seeding

Populate the database with realistic academic data:
- **1 Admin** (`admin@stms.edu`)
- **2 Team Leaders** (`maya.leader@stms.edu`, `david.leader@stms.edu`)
- **8 Students** (`alex.student@stms.edu`, `liam.chen@stms.edu`, `sarah.kim@stms.edu`, etc.)
- **2 Academic Project Teams** (Software Engineering Capstone, AI/ML Research Group)
- **7 Detailed Tasks** across `To Do`, `In Progress`, `In Review`, and `Completed` statuses
- Comments, subtasks, activity audit logs, and notifications

Run:
```bash
npm run seed
```

---

## 4. Running the Application

### Option A: Run Both Together (Recommended)
Run both backend Express server and frontend Vite client concurrently:
```bash
npm run dev
```

### Option B: Run in Separate Terminals
```bash
# Terminal 1: Backend API
npm run dev:server

# Terminal 2: Frontend Client
npm run dev:client
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API Base**: `http://localhost:5000/api/v1`
- **Health Check Probe**: `http://localhost:5000/api/v1/health`

---

## 5. Automated Testing

STMS includes comprehensive automated test suites for both frontend and backend:

### Running All Tests:
```bash
npm run test
```

### Backend API Tests (Vitest & Supertest):
```bash
npm run test:server
```
Verifies:
- User registration, duplicate email rejection, input validation
- Login flow, password verification, JWT cookie issuance
- Profile lookup with valid and invalid tokens
- Team creation and member invitations
- Task CRUD, status updates, assignees, effort estimation
- Task commenting and activity logs
- Health endpoint status and uptime

### Frontend Tests (Vitest & React Testing Library):
```bash
npm run test:client
```
Verifies:
- Common components (`Button`, `Badge`, `Card`, `EmptyState`)
- Color coding and priority badge states

---

## 6. Troubleshooting Common Issues

### Issue 1: `[vite] failed to connect to websocket` / `ws://localhost:5173/?token=...`
- **Cause**: On Windows systems, `localhost` can resolve to IPv6 (`::1`), causing a mismatch with Vite's HMR WebSocket server.
- **Resolution**: `client/vite.config.js` is pre-configured with:
  ```js
  server: {
    host: 'localhost',
    port: 5173,
    hmr: {
      host: 'localhost',
      clientPort: 5173,
    },
  }
  ```
  Ensure both the client and server are running, and access the application via `http://localhost:5173`.

### Issue 2: Backend Fails with `PORT 5000 already in use`
- **Resolution**: Check if another instance is running:
  ```powershell
  # PowerShell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
  ```
  Or change `PORT=5001` in `.env` and update the proxy target in `client/vite.config.js`.

### Issue 3: In-Memory MongoDB Download on First Run
- When running in-memory for the very first time without Atlas, `mongodb-memory-server` downloads the binary to `%USERPROFILE%/.cache/mongodb-binaries`. Subsequent starts are near-instantaneous.

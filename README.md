# YouTube Watch Party

A real-time, synchronized YouTube watch party web application built with Next.js, a custom Express server, Socket.io WebSockets, and MongoDB.
Live Deployment Link : https://watchparty-96e5.onrender.com/
---

## Table of Contents

1. [Overview & Features](#overview--features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
5. [WebSocket Event Reference](#websocket-event-reference)
6. [Folder Structure](#folder-structure)
7. [Environment Variables](#environment-variables)
8. [Local Development](#local-development)
9. [Deployment on Render (Free, No Docker)](#deployment-on-render-free-no-docker)
10. [License](#license)

---

## Overview & Features

- **Zero-Latency Video Sync**: Real-time play, pause, seek, and track change synchronized across all connected viewers via Socket.io.
- **Drift Auto-Correction**: Automatic client-side detection that smoothly seeks if a viewer's playback drifts by more than 1.5 seconds from the room timestamp.
- **Role-Based Permissions (RBAC)**:
  - **Host**: Complete control over playback, role management, video loading, participant kicking, and request approvals.
  - **Moderator**: Delegated playback authority (play, pause, seek, load video, approve requests).
  - **Participant / Viewer**: Synchronized viewer mode with locked controls, transparent click-guard, and video request capability.
- **Interactive Participant Management**: Live sidebar showing connected viewers, role badges, and an animated dropdown menu for the Host to promote, demote, or remove participants.
- **Video Request Workflow**: Viewers can request YouTube videos; Hosts and Moderators receive an approval notification toast to accept or decline.
- **Unified Single-Port Server**: A custom Node.js/Express server powers both Next.js routing and the Socket.io WebSocket engine on a single unified port.
- **Modern Dark UI**: Designed with Tailwind CSS, Framer Motion animations, and Lucide React icons (no emojis).

---

## Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS, Framer Motion, Lucide React, React Player
- **Server**: Node.js, Express (Custom unified server)
- **Real-Time Layer**: Socket.io (Engine & Client)
- **Database**: MongoDB with Mongoose (with cached connection and fallback support)

---

## Architecture

The application runs a single-process, unified architecture that simplifies local development and cloud hosting without requiring Docker or reverse proxies:

```
Browser Client 1 (Host)        Browser Client 2 (Participant)
       │                                     │
       ▼                                     ▼
 ┌─────────────────────────────────────────────────────────┐
 │               Unified Express Server (server.js)        │
 │                                                         │
 │  ┌───────────────────────────────────────────────────┐  │
 │  │        Socket.io WebSocket Layer                  │  │
 │  │        - Event Listeners (lib/socketHandlers.js)  │  │
 │  │        - Memory State Manager (lib/roomManager.js)│  │
 │  └──────────────────────────┬────────────────────────┘  │
 │                             │                           │
 │  ┌──────────────────────────┼────────────────────────┐  │
 │  │        Next.js App Router (app/)                  │  │
 │  │        - Landing Page (/)                         │  │
 │  │        - Watch Party Room (/room/[roomId])        │  │
 │  └──────────────────────────┼────────────────────────┘  │
 └─────────────────────────────┼───────────────────────────┘
                               │
                               ▼
                   MongoDB (Mongoose ODM)
                   - Room & User Collections
```

1. **HTTP Routing**: Incoming requests first reach Express. Unhandled routes are forwarded to Next.js (`handle(req, res)`).
2. **WebSocket Upgrades**: Socket.io attaches to the underlying Node HTTP server (`http.createServer(app)`) on the exact same port.
3. **In-Memory + Database Hybrid**:
   - `RoomManager` (in-memory) provides O(1) state lookups and broadcasts for fast frame-accurate synchronization.
   - MongoDB asynchronously persists room and user state so rooms survive restarts and maintain history.

---

## Role-Based Access Control (RBAC)

| Capability | Host | Moderator | Participant |
| :--- | :---: | :---: | :---: |
| Play / Pause / Seek | Yes | Yes | No (Locked) |
| Change Video URL directly | Yes | Yes | No |
| Request Video to be played | Yes | Yes | Yes (Sent for approval) |
| Approve / Reject Video Requests | Yes | Yes | No |
| Promote / Demote Participants | Yes | No | No |
| Remove / Kick Participant | Yes | No | No |

---

## WebSocket Event Reference

### Room Lifecycle
- `join_room`: `{ roomId, userId, username }` — Joins the room. The first user to join becomes `Host`. Subsequent users become `Participant`.
- `leave_room`: `{ roomId }` — Gracefully leaves the room and broadcasts updated participant list.
- `disconnect`: Triggered automatically on tab close or network drop; cleans up in-memory mappings.

### Playback Synchronization
- `play`: `{ roomId, currentTime }` — Broadcasts play state (Host/Mod only).
- `pause`: `{ roomId, currentTime }` — Broadcasts pause state (Host/Mod only).
- `seek`: `{ roomId, currentTime }` — Broadcasts scrub position (Host/Mod only).
- `change_video`: `{ roomId, url, title }` — Loads a new YouTube video for all viewers (Host/Mod only).
- `sync_state`: `{ roomId }` — Broadcasts current video state to all viewers.

### Permissions & Moderation
- `assign_role`: `{ targetUserId, newRole }` — Promotes or demotes participant (Host only). Emits `role_assigned` to room.
- `remove_participant`: `{ targetUserId }` — Kicks participant from the room (Host only). Emits `kicked_from_room` to target and `participant_removed` to room.
- `request_video_change`: `{ roomId, url, title }` — Sent by participants to request a video. Emits `video_change_requested` to Host and Mods.
- `respond_video_request`: `{ requestId, approved, url, title, requesterUserId }` — Host/Mod approval or denial.

---

## Folder Structure

```
.
├── app/
│   ├── globals.css              # Tailwind CSS styling and theme
│   ├── layout.js               # Root layout with dark mode configuration
│   ├── page.js                 # Landing page with code generator and entry
│   └── room/[roomId]/
│       └── page.js             # Watch room page (dynamic sync & controls)
├── components/
│   ├── VideoPlayer.js          # Synchronized player with participant guard
│   └── Sidebar.js              # Animated participants sidebar & Host dropdown
├── lib/
│   ├── db.js                   # Mongoose connection with cached pooling
│   ├── roomManager.js          # In-memory RoomManager class (OOP)
│   ├── socket.js               # Client Socket.io singleton
│   └── socketHandlers.js       # Real-time WebSocket event listeners
├── models/
│   ├── Room.js                 # Mongoose Room schema
│   └── User.js                 # Mongoose User schema
├── .env.example                # Environment variables template
├── package.json                # Project dependencies and npm scripts
├── server.js                   # Unified Express + Next.js + Socket.io server
└── README.md                   # Project documentation
```

---

## Environment Variables

Create a `.env.local` file in the root directory (or configure them in your hosting provider's dashboard):

```bash
# Server Port (Render and Railway set this automatically)
PORT=3000

# Node Environment
NODE_ENV=development

# MongoDB Connection String
# For local development:
MONGODB_URI=mongodb://127.0.0.1:27017/youtube_watch_party

# For cloud production (MongoDB Atlas):
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/watchparty?retryWrites=true&w=majority
```

---

## Local Development

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)
- MongoDB (Local daemon or free MongoDB Atlas cluster)

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "Internship assesment"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env.local` and set your MongoDB URI:
   ```bash
   cp .env.example .env.local
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open the application**:
   Navigate to `http://localhost:3000` in your browser. Open a second browser window (or incognito) to test multi-user synchronization.

---

## Deployment on Render (Free, No Docker)

Render supports running Node.js Web Services for free without Docker.

### Step 1: Push Code to GitHub / GitLab
Ensure all changes are committed and pushed to your git repository:
```bash
git add .
git commit -m "Complete YouTube Watch Party application"
git push origin main
```

### Step 2: Create a Free MongoDB Atlas Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free shared cluster (M0).
2. Under **Database Access**, create a database user and note the password.
3. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`).
4. Under **Clusters > Connect**, copy your connection string (e.g. `mongodb+srv://...`).

### Step 3: Create Web Service on Render
1. Log in to [Render](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `youtube-watch-party` (or your choice)
   - **Language / Runtime**: `Node`
   - **Region**: Choose the closest region to your audience
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`

### Step 4: Configure Environment Variables on Render
In the **Environment** section of your Render service, add:
- `NODE_ENV` = `production`
- `MONGODB_URI` = `mongodb+srv://<username>:<password>@cluster0.mongodb.net/watchparty?retryWrites=true&w=majority`

*(Note: Render automatically injects the `PORT` variable, and `server.js` automatically binds to `process.env.PORT`)*.

### Step 5: Deploy
Click **Deploy Web Service**. Render will install dependencies, build the Next.js bundle, and launch `server.js`. Your synchronized Watch Party will be live at your custom Render URL (e.g., `https://watchparty-96e5.onrender.com/`).

---

## License

This project is licensed under the MIT License.

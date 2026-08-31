# NeighborLink — AI-Enabled Smart Neighborhood Support System

A full-stack B.Tech software engineering project connecting people who need
everyday help with nearby community volunteers — structured assistance
coordination, not another social feed.

---

## Problem Statement

People often need local help (groceries, medicine, tutoring, emergency
transport) but don't know who nearby is available and trustworthy. Volunteers
willing to help don't know who currently needs it. NeighborLink solves this
with a structured, trackable request → match → accept → complete → rate flow.

## Objectives

- Let any verified community member post or fulfil a help request.
- Rank volunteers with a transparent, explainable matching score (skills,
  distance, availability, rating) — no black-box ML.
- Compute request urgency with an explainable rule-based priority engine
  instead of trusting a self-selected field.
- Provide real-time-ish progress tracking, in-app notifications, optional
  consent-based live location sharing, and post-completion ratings.

## Features

- Firebase Authentication (sign up, login, email verification, password reset)
- Admin-driven community verification (Pending / Verified / Rejected)
- Help requests across 5 categories with full status lifecycle
- Explainable AI-style priority engine (`server/services/priorityEngine.js`)
- Explainable volunteer matching engine (`server/services/matchingEngine.js`)
- Race-safe request acceptance (only one volunteer can ever win)
- Progress timeline with timestamps
- In-app notifications with unread badge
- Optional, consent-based, auto-expiring live location sharing (Leaflet/OSM)
- 1–5 star ratings with duplicate/early-review protection
- Search/filter/sort on Browse Requests
- Admin dashboard with platform statistics
- Role-based authorization enforced at the database-query level, not just the UI

## Customer Benefits

- Requesters get a fast, transparent way to ask for help and know exactly
  what's happening and who's coming.
- Volunteers see a prioritized, skill-matched list instead of scrolling a feed.
- Admins get a lightweight moderation and oversight layer.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | Firebase Authentication (client) + Firebase Admin SDK (server verification) |
| Notifications | In-app (FCM-ready hook, disabled by default) |
| Location | Browser Geolocation API + Leaflet/OpenStreetMap |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas (DB) |

## Architecture

See `docs/architecture.md` and `docs/diagrams.md` for the full system diagram,
use-case diagram, ER diagram, request-state diagram, and DFD.

## Folder Structure

```
neighborlink/
├── client/                # React + Vite frontend
│   ├── src/
│   │   ├── pages/         # route-level screens
│   │   ├── components/    # reusable UI pieces
│   │   ├── context/       # AuthContext (Firebase + profile)
│   │   ├── services/      # axios API client
│   │   └── styles/        # global CSS
│   └── .env.example
├── server/                 # Express backend
│   ├── config/             # db.js, firebase.js
│   ├── controllers/
│   ├── middleware/         # auth, role, error, validation
│   ├── models/              # User, HelpRequest, Notification, Review
│   ├── routes/
│   ├── services/            # priorityEngine, matchingEngine, notificationService
│   ├── utils/
│   ├── tests/
│   ├── seed/                # demo data script
│   └── .env.example
├── docs/                    # architecture, schema, API docs, Mermaid diagrams
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js 18+ and npm
- A free MongoDB Atlas cluster
- A free Firebase project (Authentication enabled)
- Git

## Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com) → Create project.
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Project Settings → General → Your apps** → Add a Web app → copy the
   config values into `client/.env` (see `client/.env.example`).
4. **Project Settings → Service Accounts** → Generate new private key →
   copy `project_id`, `client_email`, `private_key` into `server/.env`
   (see `server/.env.example`). Never commit the downloaded JSON file.

## MongoDB Setup

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add a database user with a password.
3. **Network Access** → add your IP (or `0.0.0.0/0` for local dev only).
4. **Connect → Drivers** → copy the connection string into
   `server/.env` as `MONGODB_URI` (replace `<username>`, `<password>`, and
   add `/neighborlink` before the `?`).

## Environment Variables

Copy the example files and fill in real values:

```bash
# Windows (PowerShell)
copy server\.env.example server\.env
copy client\.env.example client\.env

# macOS / Linux
cp server/.env.example server/.env
cp client/.env.example client/.env
```

See each `.env.example` for what every variable is and where to get it.

## Installation

```bash
# Backend
cd server
npm install

# Frontend (in a new terminal)
cd client
npm install
```

## Running the Backend

```bash
cd server
npm run dev      # nodemon, auto-restarts
# or: npm start
```
Server runs at `http://localhost:5000`. Health check: `GET /api/health`.

## Running the Frontend

```bash
cd client
npm run dev
```
App runs at `http://localhost:5173`.

## Seed Data

```bash
cd server
npm run seed
```
This creates demo Users, HelpRequests, Notifications, and a Review in MongoDB.
**Important:** these are MongoDB profile documents only. To actually log in as
a seeded user, create a matching account in Firebase Authentication Console
with the same email (Authentication → Users → Add user), or simply register
normally through the app — the `/users/register` step links a fresh Firebase
account to a new MongoDB profile.

## Testing

```bash
cd server
npm test
```
Runs Jest unit tests for the priority engine and matching engine, plus an
integration test (using an in-memory MongoDB) proving that concurrent accept
attempts on the same request never double-assign it.

See `server/tests/README.md` for the full manual testing checklist covering
the end-to-end user journey.

## Deployment

**Frontend → Vercel**
1. Push `client/` to GitHub, import into Vercel.
2. Set environment variables (the `VITE_*` ones) in Vercel project settings.
3. Build command `npm run build`, output directory `dist`.

**Backend → Render**
1. New Web Service → point at `server/`.
2. Build command `npm install`, start command `npm start`.
3. Set all `server/.env` variables in Render's environment settings.
4. Update `CLIENT_ORIGIN` to your deployed Vercel URL.

**Database → MongoDB Atlas** — already cloud-hosted; just ensure Render's
outbound IPs are allowed in Atlas Network Access (or allow `0.0.0.0/0`).

## Demo Credentials

No credentials ship out of the box (Firebase accounts can't be pre-created by
a seed script). To get a working demo:
1. Register a normal account through the UI.
2. Run `npm run seed` in `server/` for extra sample requests/users to browse.
3. To get an admin account: seed creates a Mongo user with
   `email: admin@neighborlink.demo, role: 'admin'` — create a matching Firebase
   user with that email (any password) via Firebase Console, then log in.

## Known Limitations

- Live location uses simple polling (`watchPosition` + periodic PATCH), not a
  WebSocket push — acceptable for a student project, noted as future work.
- No automated email templates beyond Firebase's default verification/reset emails.
- Admin accounts must be created manually (no self-service admin signup, by design).
- No payment, chat, or social feed features — intentionally out of scope.

## Future Scope

- WebSocket-based real-time status/location updates.
- Firebase Cloud Messaging push notifications (hook already scaffolded).
- Volunteer skill verification/certification badges.
- Multi-language support for the UI.
- Analytics dashboard for admins (response times, category trends).

---

Built as a college Software Engineering semester project. Every module —
especially the priority and matching engines — is intentionally kept simple
and explainable so it can be presented and defended during evaluation.

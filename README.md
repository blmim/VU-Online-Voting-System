# VU Online Voting System — NIT3003 Capstone Project 1 (Complete)

**Victoria University Sydney | Block 4 Semester 1 2026 | Group 6 — Project 11**

| Team Member | Student ID |
|-------------|------------|
| Adil Ahnaf | s8114083 |
| Amith Hassan | s8072671 |
| Ranjana Nepal | s8116502 |
| Mr Samir Sapkota | s8139428 |

MERN stack web application for secure, accessible campus elections with selfie verification, candidate applications, real-time public results, and SMTP notifications.

**Group 6 source repository:** https://github.com/blmim/VU-Online-Voting-System

## Features

- Student registration (S####### ID, VU email, OTP, reference selfie)
- Login with password then **mandatory email OTP**, optional **Remember me**
- **Forgot password** flow: email + student ID → 6-digit OTP (15 min) → reset at `/reset-password`
- Profile page (`/profile`) with read-only account details and change-password (logged-in)
- Help & FAQ (`/help`) with voting steps and elections office contact
- Admin election/position/ballot management with persisted options
- Position eligibility rules (faculty, year, department)
- Candidate **apply → admin approve/reject** workflow
- Search for admin (users, candidates, applications) and voters (elections)
- Vote casting with vote-time selfie + perceptual hash face comparison
- Duplicate vote prevention (website + MongoDB unique index + transactions)
- Real-time counting: admin dashboard + **public live view**
- Auto result certification, PDF + Excel export
- Tamper-evident chained SHA-256 audit logs
- SMTP emails for all key interactions (see FR-10 — 16 templates, 20 events)
- **SMS not implemented** — Project 11 allows email *or* SMS; email covers every notification requirement
- WCAG-oriented Material-UI responsive UI with VU Sydney branding (logo at `client/public/vu-logo.png`, team footer, `/about` page)
- Toast notifications, loading states, password visibility toggles, logout confirmation
- Swagger API docs, Jest tests, health check

## Quick start for teammates

Full clone-and-run instructions (Windows PowerShell + macOS/Linux, env vars, MongoDB/Docker, demo logins, tests, common errors):

**[TEAMMATE_SETUP_GUIDE.md](./TEAMMATE_SETUP_GUIDE.md)**

Short version: install **Node 20**, **Git**, and **MongoDB 7** (or Docker). Clone the GitHub repo, copy `server/.env.example` → `server/.env`, run `npm install` in `server/` and `client/`, then `npm run seed` and `npm run dev` in `server/`, and `npm run dev` in `client/`. Website: http://localhost:5173 — API: http://localhost:5000.

## Prerequisites

- Node.js **20** (18+ may work; Dockerfiles use Node 20)
- MongoDB **7** (local `mongod`, Docker `mongo:7`, or Atlas)
- Git
- SMTP credentials optional (Gmail App Password or Ethereal). Without SMTP, OTP codes print as `[DEV EMAIL]` in the server terminal.

## Quick Start

### 1. MongoDB

```bash
# Option A: Docker
docker run -d -p 27017:27017 --name ovs-mongo mongo:7

# Option B: docker-compose (full stack)
docker-compose up -d
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env with your SMTP and MongoDB URI
npm install
npm run seed    # Creates admin + team voter accounts
npm run dev
```

API: http://localhost:5000  
Swagger: http://localhost:5000/api/docs  
Health: http://localhost:5000/api/health

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Website: http://localhost:5173

**Public availability:** The website runs on **localhost only** during development (`http://localhost:5173` frontend, `http://localhost:5000` API). It is **not publicly accessible on the internet** unless you deploy it (e.g. Vercel for the client, Render/Heroku for the API, MongoDB Atlas for the database).

### Default Accounts (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | s8139428@live.vu.edu.au | Admin@12345 |
| Voter (Adil) | s8114083@live.vu.edu.au | Voter@12345 |
| Voter (Amith) | s8072671@live.vu.edu.au | Voter@12345 |
| Voter (Ranjana) | s8116502@live.vu.edu.au | Voter@12345 |

All seeded voters are verified with reference selfies for demo voting.

### SMTP for Demo Day

Copy `server/.env.example` to `server/.env` and set:

| Variable | Example | Notes |
|----------|---------|-------|
| `SMTP_HOST` | `smtp.gmail.com` | Gmail or Ethereal |
| `SMTP_PORT` | `587` | TLS |
| `SMTP_USER` | your Gmail | Use App Password, not account password |
| `SMTP_PASS` | 16-char app password | Google Account → Security → App passwords |
| `SMTP_FROM` | `"VU Election Services <you@gmail.com>"` | Display name in emails |

**Without SMTP:** dev mode logs `[DEV EMAIL]` to the server terminal — OTP codes, welcome emails, and vote confirmations all appear there. Sufficient for oral demo on localhost.

## Forgot Password (manual test)

1. Open http://localhost:5173/login and click **Forgot password?**
2. Enter seeded voter email `s8114083@live.vu.edu.au` and student ID `S8114083`
3. Check the server console for `[DEV EMAIL]` with the 6-digit reset code (when SMTP is not configured)
4. On `/reset-password`, enter the OTP, new password (min 8 chars), and confirm
5. Sign in at `/login` with the new password — a success toast should appear

API endpoints: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/change-password` (authenticated).

## Admin Test Data Generator (dev/demo)

Available in **Admin Dashboard → Testing Tools** tab (admin login required).

| Action | API | Description |
|--------|-----|-------------|
| Generate 5/10/20 voters | `POST /api/admin/generate/voters` `{ count: 10 }` | Random S8XXXXXX voters, verified, with reference selfies. Password: `Test@12345` |
| Generate candidates | `POST /api/admin/generate/candidates` `{ electionId, count: 5 }` | Adds approved candidates to a draft/published/active election |
| Reset demo election | `POST /api/admin/generate/demo` | Deletes prior auto-generated demo and creates a fresh active election |

**Security:** Routes require admin auth. Disabled when `NODE_ENV=production` unless `ALLOW_TEST_GENERATOR=true` in `server/.env`. All generations are recorded in audit logs.

## SMS Notifications (Out of Scope)

Project 11 Module 8 allows **email or SMS** for reminders and announcements. This NIT3003 deliverable implements **SMTP email only** — all 20 notification events (OTP, vote confirmation, application status, election reminders, results, etc.) are covered by email templates in `server/src/services/emailService.js`. SMS gateway integration is documented as a NIT3004 *Could* enhancement in the proposal MoSCoW table.

## Tests

```bash
cd server
npm test
```

## NFR evidence (executed)

Real Capstone verification pack (not fabricated): **[NFR_EVIDENCE/](./NFR_EVIDENCE/)**

| Evidence | Headline |
|----------|----------|
| Jest | 53/53 passed |
| axe | 0 WCAG violations / 6 public pages |
| Lighthouse | Accessibility ~98 (Vite **dev** perf scores are not production) |
| JMeter 5.6.3 | 350 samples; 300×200 + 50×429 (rate-limit working) |
| OWASP ZAP | API 0 alerts; client 0 High / 2 Medium (CSP/SRI on Vite SPA — documented) |

Start at [`NFR_EVIDENCE/README.md`](./NFR_EVIDENCE/README.md). HTML reports under `lighthouse/`, `jmeter/results/html-report/`, and `zap/` can be opened in Chrome → Print → Save as PDF for Collaborate.

## Branding & Logo

The UI uses Victoria University Sydney branding (navy `#003366`, gold accent `#D4AF37`).

- **Logo asset:** `client/public/vu-logo.png` — official Victoria University Sydney Australia logo
- **Legacy placeholder:** `client/public/vu-logo.svg` kept as backup; the app uses the PNG via `VuLogo`
- **Branding components:** `VuLogo`, `Footer`, team constants in `src/constants/team.js`
- **About page:** `/about` — full team credits and project information

## Project Structure

```
VU-Online-Voting-System/
├── client/              # React + Vite + MUI frontend
├── server/              # Express + MongoDB API (+ .env.example)
├── NFR_EVIDENCE/        # Jest/axe/Lighthouse/JMeter/ZAP evidence
├── docker-compose.yml
├── TEAMMATE_SETUP_GUIDE.md
└── README.md
```

## Documentation

- Teammate setup: [`TEAMMATE_SETUP_GUIDE.md`](./TEAMMATE_SETUP_GUIDE.md)
- Requirements map: [`REQUIREMENTS_TRACEABILITY.md`](./REQUIREMENTS_TRACEABILITY.md)
- NFR pack: [`NFR_EVIDENCE/README.md`](./NFR_EVIDENCE/README.md)

## Reference

**This project:** https://github.com/blmim/VU-Online-Voting-System  

Earlier open-source MERN voting demos (e.g. community Online-Voting-System samples) informed learning only; Capstone implementation, VU branding, security controls, and Group 6 deliverables are original coursework.

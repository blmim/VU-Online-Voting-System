# Teammate setup guide — VU Online Voting System

Copy-paste these steps to run the app on your own machine.

This folder is a **MERN** app: Express API (`server/`) + React/Vite website (`client/`) + MongoDB.

| What | URL |
|------|-----|
| Website (use this) | http://localhost:5173 |
| API | http://localhost:5000 |
| Swagger docs | http://localhost:5000/api/docs |
| Health check | http://localhost:5000/api/health |

---

## 1. Prerequisites

Install these **before** cloning.

| Tool | Version | Why |
|------|---------|-----|
| **Node.js** | **20** (LTS) | Dockerfiles use `node:20`. Node 18 may work; use 20 to match the team. |
| **Git** | Latest | Clone the repo |
| **MongoDB** | **7** | Database. Use **Docker** *or* a local `mongod` install *or* **MongoDB Atlas** (cloud). |
| **npm** | Comes with Node | Installs packages |

Optional:

| Tool | Why |
|------|-----|
| **Docker Desktop** | Easiest way to run MongoDB 7 (`mongo:7`) |
| **Gmail SMTP** (App Password) | Real emails. **Not required** for local demo — OTP codes print in the server terminal. |

### Check versions

**PowerShell (Windows)**

```powershell
node -v
npm -v
git --version
docker --version
```

You want `node -v` to start with `v20`.

**macOS / Linux / Git Bash**

```bash
node -v
npm -v
git --version
docker --version
```

### Windows: npm blocked by execution policy

If PowerShell says `npm.ps1 cannot be loaded because running scripts is disabled`, fix it **once**:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then close and reopen PowerShell. Alternative: run `npm.cmd install` instead of `npm install`, or use **Command Prompt**.

---

## 2. Clone from GitHub

This machine did **not** have a `git remote` configured, so the clone URL is a placeholder.

Replace `YOUR-REPO-URL` with the team GitHub URL (the person who created the repo should send it).

The website/docs currently link to: https://github.com/gurneeshs/Online-Voting-System  
Use that URL **only if** that is the team repository you were told to clone.

**PowerShell / macOS / Linux**

```powershell
cd $HOME\Desktop
git clone YOUR-REPO-URL.git
cd Online-Voting-System
```

If `git clone` created a different folder name, `cd` into that folder instead. You should see `server\`, `client\`, and `docker-compose.yml`.

```bash
cd ~/Desktop
git clone YOUR-REPO-URL.git
cd Online-Voting-System
```

If you already have the zip/folder (no GitHub clone):

```powershell
cd "C:\path\to\Online-Voting-System-Complete"
```

---

## 3. Start MongoDB

The API needs MongoDB on **port 27017** (or an Atlas URI). Pick **one** option.

### Option A — Docker (recommended)

```powershell
docker run -d -p 27017:27017 --name ovs-mongo mongo:7
```

If the container already exists:

```powershell
docker start ovs-mongo
```

Check it is running:

```powershell
docker ps
```

### Option B — Docker Compose (Mongo + optional full stack)

From the **project root** (the folder with `docker-compose.yml`):

```powershell
docker-compose up -d mongodb
```

That starts **only** MongoDB 7. To start Mongo + server + client containers:

```powershell
docker-compose up -d
```

For day-to-day coding, most teammates use Option A (Mongo in Docker) plus `npm run dev` for server and client (steps 5–6).

### Option C — Local MongoDB (`mongod`)

Install [MongoDB Community 7](https://www.mongodb.com/try/download/community), then:

**Windows PowerShell** (create the data folder once, then start):

```powershell
New-Item -ItemType Directory -Force -Path C:\data\db
mongod --dbpath C:\data\db
```

Leave that window open. Database name used by this app: `online_voting_system`.

**macOS (Homebrew)**

```bash
brew tap mongodb/brew
brew install mongodb-community@7
brew services start mongodb-community@7
```

**Linux (systemd)**

```bash
sudo systemctl start mongod
sudo systemctl status mongod
```

### Option D — MongoDB Atlas (no local database)

1. Create a free cluster at https://cloud.mongodb.com
2. Allow your IP (Network Access)
3. Create a database user
4. Copy the connection string into `server/.env` as `MONGODB_URI` (see step 4)

Example shape (not a real password):

```
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/online_voting_system?retryWrites=true&w=majority
```

---

## 4. Server: env file + install + seed

### 4a. Copy `.env.example` → `.env`

There is **no** client `.env`. Only the server needs one.

**PowerShell**

```powershell
cd server
Copy-Item .env.example .env
```

**macOS / Linux / Git Bash**

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill values. Defaults already work for local Mongo + localhost website.

### Required / important env vars

| Variable | Local default | Notes |
|----------|---------------|--------|
| `NODE_ENV` | `development` | Keep this for local work |
| `PORT` | `5000` | API port |
| `MONGODB_URI` | `mongodb://localhost:27017/online_voting_system` | Local/Docker. Use Atlas `mongodb+srv://...` if you skipped local Mongo. |
| `JWT_SECRET` | change this | Use a long random string (do not commit `.env`) |
| `JWT_EXPIRES_IN` | `8h` | Login token lifetime |
| `RECEIPT_SECRET` | change this | Vote receipt HMAC |
| `CLIENT_URL` | `http://localhost:5173` | Must match the Vite URL or you get **CORS** errors |
| `COOKIE_SECURE` | `false` | Keep `false` on http://localhost |
| `COOKIE_SAME_SITE` | `lax` | Fine for local |
| `TRUST_PROXY` | `false` | Keep `false` locally |
| `MAX_SELFIE_BYTES` | `5242880` | 5 MB selfie cap |

### SMTP (optional)

| Variable | Example | Notes |
|----------|---------|--------|
| `SMTP_HOST` | `smtp.gmail.com` | Gmail or Ethereal |
| `SMTP_PORT` | `587` | STARTTLS |
| `SMTP_SECURE` | `false` | `false` for port 587 |
| `SMTP_USER` | `you@gmail.com` | Your Gmail address |
| `SMTP_PASS` | 16-char app password | **App Password**, not your Gmail password |
| `SMTP_FROM` | `"Victoria University Election Services <you@gmail.com>"` | From-name in inbox |

Gmail App Password: Google Account → Security → 2-Step Verification → App passwords.

**Without SMTP:** leave the placeholders. In development, failed/missing SMTP logs `[DEV EMAIL]` in the **server** terminal, including OTP and password-reset codes.

### Seed admin (already in `.env.example`)

| Variable | Default |
|----------|---------|
| `ADMIN_STUDENT_ID` | `S8139428` |
| `ADMIN_EMAIL` | `s8139428@live.vu.edu.au` |
| `ADMIN_PASSWORD` | `Admin@12345` |

Voter seed password is `Voter@12345` (optional env `VOTER_PASSWORD`). Other useful vars: `FACE_MATCH_THRESHOLD`, `FACE_ANOMALY_THRESHOLD`, `ALLOW_TEST_GENERATOR=true`.

### 4b. Install server packages

```powershell
npm install
```

### 4c. Seed demo data

MongoDB must already be running.

```powershell
npm run seed
```

You should see `Seed complete`. Seed creates/updates:

- Admin + 3 team voters (verified, with demo reference selfies)
- Election **VU Student Council Election 2026** (usually `active`)
- Positions: President, Vice President, IT Faculty Representative
- Demo candidates: Adil → President, Amith → Vice President, Ranjana → IT Faculty Representative

Re-running `npm run seed` is safe: it updates the same accounts/election rather than duplicating them.

### 4d. Start the API

```powershell
npm run dev
```

Leave this terminal open. `npm run start` is production-style (`node`, no auto-reload). Use `npm run dev` while coding.

API: http://localhost:5000  
Health: http://localhost:5000/api/health  
Swagger: http://localhost:5000/api/docs

---

## 5. Client: install + start

Open a **second** terminal.

**PowerShell**

```powershell
cd client
npm install
npm run dev
```

**macOS / Linux / Git Bash**

```bash
cd client
npm install
npm run dev
```

Website: **http://localhost:5173**

Vite proxies `/api`, `/uploads`, and `/socket.io` to `http://localhost:5000`. You do **not** need a client `.env` for local work.

Other client scripts: `npm run build` (production bundle), `npm run preview` (serve the bundle).

---

## 6. Demo logins (after seed)

Open http://localhost:5173/login

| Role | Email | Student ID | Password |
|------|-------|------------|----------|
| **Admin** | `s8139428@live.vu.edu.au` | `S8139428` | `Admin@12345` |
| Voter (Adil) | `s8114083@live.vu.edu.au` | `S8114083` | `Voter@12345` |
| Voter (Amith) | `s8072671@live.vu.edu.au` | `S8072671` | `Voter@12345` |
| Voter (Ranjana) | `s8116502@live.vu.edu.au` | `S8116502` | `Voter@12345` |

All seeded voters are **verified** and can vote in the demo election.

Admin extra: **Admin Dashboard → Testing Tools** can generate extra voters (password `Test@12345`). Disabled in production unless `ALLOW_TEST_GENERATOR=true`.

---

## 7. Run tests

Tests use an **in-memory** MongoDB (`mongodb-memory-server`). You do **not** need Docker/`mongod` for tests.

```powershell
cd server
npm test
```

Watch mode:

```powershell
npm run test:watch
```

Audit-chain helper:

```powershell
npm run validate-audit
```

There is no `npm test` script on the client.

---

## 8. Everyday start (after first setup)

1. Start MongoDB (Docker `docker start ovs-mongo` **or** `mongod`).
2. Terminal 1: `cd server` → `npm run dev`
3. Terminal 2: `cd client` → `npm run dev`
4. Browser: http://localhost:5173

---

## 9. Common errors

### Port already in use (`EADDRINUSE`)

Something else is using **5000** (API) or **5173** (Vite).

**PowerShell — find and stop the process on 5000**

```powershell
netstat -ano | findstr :5000
taskkill /PID <the-pid-number> /F
```

Same for 5173:

```powershell
netstat -ano | findstr :5173
taskkill /PID <the-pid-number> /F
```

**macOS / Linux**

```bash
lsof -i :5000
kill <pid>
```

Or change `PORT` in `server/.env` **and** the proxy target in `client/vite.config.js` (they must stay in sync).

### MongoDB not running

Symptoms: `ECONNREFUSED 127.0.0.1:27017`, seed hangs/fails, API crash on startup.

- Docker: `docker start ovs-mongo` then `docker ps`
- Local: start `mongod` again
- Atlas: check `MONGODB_URI`, user password, and Network Access IP

### CORS errors in the browser

`CLIENT_URL` in `server/.env` must be exactly `http://localhost:5173` (no trailing slash). Restart `npm run dev` after changing `.env`. Use the website on **5173**, not 5000.

### SMTP missing / emails not arriving

Expected. Server logs look like:

```
[DEV EMAIL] To: s8114083@live.vu.edu.au | Subject: ...
[DEV EMAIL BODY] ... 6-digit code ...
```

Copy OTP/reset codes from that terminal. Real inbox delivery needs Gmail App Password (or Ethereal) in `.env`.

### `npm.ps1` cannot be loaded (Windows)

See [Windows: npm blocked by execution policy](#windows-npm-blocked-by-execution-policy).

### Seed before Mongo is up

Start Mongo first, then `npm run seed`.

### Website blank / API 404

- API must be running **before** you use the site
- Open **http://localhost:5173**, not 5000 (5000 is JSON/Swagger, not the UI)
- `cd` into `server` and `client` separately — there is no root `package.json`

### Face / selfie camera

Use Chrome or Edge on **http://localhost** (not `file://`). Allow camera permission. Seeded demo selfies are generated colour squares so voting still works for the oral demo.

### `sharp` install fails

Use **Node 20**. On Windows, a full Node reinstall (not just the zip) usually fixes native builds.

---

## 10. What not to commit

`.gitignore` already excludes `.env`, `node_modules/`, and `server/uploads/`. Never push SMTP passwords or `JWT_SECRET`.

---

## Quick command cheat sheet

**PowerShell (two terminals)**

```powershell
# MongoDB
docker run -d -p 27017:27017 --name ovs-mongo mongo:7

# Terminal 1 — API
cd server
Copy-Item .env.example .env
npm install
npm run seed
npm run dev

# Terminal 2 — website
cd client
npm install
npm run dev
```

**macOS / Linux**

```bash
docker run -d -p 27017:27017 --name ovs-mongo mongo:7

# Terminal 1
cd server
cp .env.example .env
npm install
npm run seed
npm run dev

# Terminal 2
cd client
npm install
npm run dev
```

Then open http://localhost:5173 and log in with `s8139428@live.vu.edu.au` / `Admin@12345`.

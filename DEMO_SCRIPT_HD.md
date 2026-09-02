# VU Online Voting System — 3-Minute HD Demo Script

**Course:** NIT3004 Capstone | **Audience:** Lecturer / assessor | **Duration:** ~3 minutes  
**Prerequisites:** `npm run seed` completed; server on `:5000`, client on `:5173`

| Role | Email | Password |
|------|-------|----------|
| Admin | s8139428@live.vu.edu.au | Admin@12345 |
| Voter (Amith — not a candidate) | s8072671@live.vu.edu.au | Voter@12345 |
| Voter (Adil — President candidate) | s8114083@live.vu.edu.au | Voter@12345 |

> **OTP tip:** Without SMTP, copy the 6-digit code from the server terminal (`[DEV EMAIL]`).

---

## 0:00–0:25 — Landing & first impressions (guest)

1. Open **http://localhost:5173**
2. Point out the **Windows 8 Metro tile home** (navy/gold VU branding, animated tiles).
3. Show the featured **countdown** to the active Student Council election.
4. Press **Ctrl+K** → type `council` → show global search (elections, candidates, polls, pages).
5. Click **Tutorial** in the nav (or the “Take a tour” tile) — mention onboarding for new voters.

**Say:** *“This is our VU-branded election portal — accessible, searchable, and designed for campus elections.”*

---

## 0:25–0:50 — Public features (no login)

1. **Elections** (`/elections`) — type in the search box; show **live autocomplete** (elections + candidates).
2. Open **VU Student Council Election 2026** → **Election Hub** tabs:
   - **Candidates** — click a profile (bio, speech, why running).
   - **Discussion** — community comments.
   - **Insights** — AI-style sentiment summary.
3. **Polls** (`/polls`) — highlight the **“Public opinion — NOT an official vote”** chip.
4. **Live Results** (`/live`) — **championship scoreboard** + confetti on leader; mention **interactive line chart** on election hub.
5. **Calendar** (`/calendar`) — election timeline.
6. **Verify Receipt** (`/verify-receipt`) — explain tamper-evident receipts (demo after voting).

**Say:** *“Polls and discussion are clearly separated from official voting — a key HD requirement.”*

---

## 0:50–1:30 — Voter journey (official vote)

1. **Login** → Student portal → `s8072671@live.vu.edu.au` / `Voter@12345`.
2. Enter **email OTP** from server console.
3. **Dashboard** — eligible elections; **notification bell** (if seeded announcement exists).
4. **My Ballots** → **Vote Now** on Student Council election.
5. Walk through ballot: select candidates → **vote-time selfie** → confirm → **receipt code**.
6. Copy receipt → **Verify Receipt** page → confirm valid.
7. **Help** (`/help`) — FAQ; open the **AI chat assistant** (bottom-right FAB) — ask *“How do I vote?”*

**Say:** *“Selfie verification, duplicate-vote prevention, and receipt verification meet our security FRs.”*

---

## 1:30–2:00 — Candidate restriction demo (30 sec)

1. Log out → log in as **Adil** (`s8114083@live.vu.edu.au`) — he is the **President** candidate.
2. Open **My Ballots** → start vote → show that **President position is excluded** from ballot (cannot vote in own race).
3. He can still vote for VP / IT Rep if eligible.

**Say:** *“Candidates cannot vote in their own race — enforced in API and hidden on the ballot UI.”*

---

## 2:00–2:40 — Admin election management

1. Log out → **Admin login** (`s8139428@live.vu.edu.au` / `Admin@12345`).
2. **Admin Dashboard** (`/admin`):
   - **Elections** tab — show CRUD, **Publish / Activate / Close** on seeded election.
   - **Applications** tab — approve/reject candidate applications (or show existing approved candidates).
   - **Results** tab — live turnout; after close → **PDF + Excel export**.
   - **Audit Logs** — chained SHA-256 events (LOGIN, VOTE_CAST).
3. Optional: **Testing Tools** — generate demo voters (dev only).

**Say:** *“Full election lifecycle with audit trail and exportable certified results.”*

---

## 2:40–3:00 — NFR evidence & wrap-up

1. Open repo **`NFR_EVIDENCE/README.md`** — Jest 53/53, axe 0 violations, Lighthouse ~98 a11y, JMeter, ZAP.
2. Mention **Swagger** at http://localhost:5000/api/docs.
3. Return to **Live Results** — refresh after a vote to show real-time update.

**Closing line:** *“VU Online Voting delivers secure official elections, rich public engagement, and documented non-functional evidence — ready for HD assessment.”*

---

## Backup talking points (if asked)

| Topic | Where |
|-------|--------|
| Duplicate candidate names fix | `server/src/utils/dedupeCandidates.js` + seed dedupe |
| Eligibility rules | IT Faculty Rep requires IT faculty |
| Accessibility | Skip link, ARIA labels, `prefers-reduced-motion` on animations |
| Email coverage | 16 SMTP templates — dev fallback in terminal |
| SMS | Out of scope; email covers all notification events |

## Manual steps for student (before submission)

- [ ] Add team **signatures** to proposal / cover sheet (not in repo).
- [ ] Export NFR HTML reports → PDF via Chrome Print (see `NFR_EVIDENCE/README.md`).
- [ ] Record Collaborate demo using this script.
- [ ] Configure Gmail App Password in `server/.env` if live OTP email demo is required.
- [ ] Run `cd server && npm test` once MongoDB Memory Server binary is cached (first run downloads ~600 MB).

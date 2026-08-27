# Requirements Traceability Matrix — VU Online Voting System

**Project:** NIT3003 Capstone — Online Voting System for Campus Elections (Project 11)  
**Codebase:** `Online-Voting-System-Complete/`  
**Strict audit:** `../STRICT_REQUIREMENTS_AUDIT.md`  
**Test date:** 6 June 2026  

---

## Project 11 Base Requirements

| # | Requirement | Feature / Implementation | Test Evidence | Result |
|---|-------------|-------------------------|---------------|--------|
| 1 | User registration & authentication | `Register.jsx`, `Login.jsx`, `routes/auth.js` — VU email/ID validation, bcrypt, OTP | Voter login ✅; register form validation ✅; OTP + welcome in `email.test.js` | ✅ Pass |
| 2 | Election & ballot management | `AdminDashboard.jsx`, `routes/elections.js`, settings toggles, publish/activate/close | Admin create with stored options ✅; seed demo election ✅ | ✅ Pass |
| 3 | Vote casting | `Vote.jsx`, `routes/votes.js` — ballot, selfie (configurable), duplicate prevention | Ballot loads candidates ✅; unique index + txn fallback ✅ | ✅ Pass |
| 4 | Real-time vote counting | `LiveResults.jsx`, `resultsService.js`, Socket.io `vote:update` | `/live` shows turnout & charts ✅; admin turnout cards ✅ | ✅ Pass |
| 5 | Result declaration & export | `electionCron.js`, `certifyElectionResults`, `/results/export/:id/pdf\|excel`, manual close | Certification on close ✅; export buttons when closed | ✅ Pass* |
| 6 | Admin dashboard | `AdminDashboard.jsx`, `routes/admin.js` | Stats, turnout, search/apps/anomalies/audit/announcements ✅ | ✅ Pass |
| 7 | Audit & logging | `models/AuditLog.js`, chained SHA-256, `/admin/audit-logs` | Audit entries ✅; events: LOGIN, VOTE_CAST, etc. | ✅ Pass |
| 8 | Notifications (email) | `emailService.js` — 16 templates, 20 events wired | `email.test.js` ✅; dev console fallback ✅ | ✅ Pass* |
| 11 | Password recovery (FR-11) | `/forgot-password`, `/reset-password`, `OtpToken` purpose `password_reset` | Forgot-password Jest tests ✅ | ✅ Pass |

*SMTP delivery and PDF download depend on valid credentials / closed election; failures do not block voting.

**SMS (P11 §8):** Documented out-of-scope in proposal §1.5; email-only implementation.

---

## Supervisor Feedback (8 Items)

| # | Feedback | Feature | Test Evidence | Result |
|---|----------|---------|---------------|--------|
| 1 | Store options for elections/ballots | `Election.settings` + admin UI switches (create + per-election) | POST/PUT `/elections` with settings ✅ | ✅ Pass |
| 2 | Search for admin and voters | `/elections/search`, `/admin/users/search`, `/applications/search` | Voter dashboard search ✅; admin Search tab ✅ | ✅ Pass |
| 3 | Eligibility per position | `Position.eligibility`, `eligibilityService.js` | IT Rep requires IT faculty ✅; ApplyCandidate filters ✅ | ✅ Pass |
| 4 | Candidate apply → admin approve | `ApplyCandidate.jsx`, `CandidateApplication`, approve/reject routes | Apply page ✅; admin Applications tab ✅ | ✅ Pass |
| 5 | SMTP for all interactions | 18 event types → `sendTemplate` (see strict audit table) | `npm test` 17/17 ✅ | ✅ Pass* |
| 6 | Selfie register/vote + anomaly review | `SelfieCapture.jsx`, `faceVerification.js`, admin Anomalies tab | Vote requires selfie when enabled ✅; flag requires notes ✅ | ✅ Pass* |
| 7 | Vote confirmation email | `votes.js` → `voteConfirmation` template | `email.test.js` vote case ✅ | ✅ Pass |
| 8 | Public live results | `/results/live/:id`, `LiveResults.jsx`, public `/live` route | Public page no auth ✅ | ✅ Pass |

---

## Automated Test Coverage

| Suite | Command | Result |
|-------|---------|--------|
| All server tests | `cd server && npm test` | **28/28 passed** |
| Auth registration/login/forgot | `tests/auth.test.js` | ✅ |
| SMTP wiring | `tests/email.test.js` | ✅ |
| Test generator | `tests/generate.test.js` | ✅ |
| Health check | `tests/health.test.js` | ✅ |
| Face verification (register/vote) | `tests/faceVerification.test.js` | ✅ |
| Eligibility rules | `tests/eligibility.test.js` | ✅ |
| Audit hash chain | `tests/auditChain.test.js` | ✅ |
| Seed demo data | `npm run seed` | Admin + voters + election + candidates |

---

## Traceability Gaps (Manual Demo Only)

| Item | Reason | Demo Action |
|------|--------|---------------|
| End-to-end vote with webcam | Browser automation cannot grant camera | Demo live with laptop webcam on `/vote/:id` |
| OTP email receipt | Requires inbox access | Show server `[DEV EMAIL]` console or Gmail inbox |
| PDF/Excel export | Reports generated on election close | Admin **Close Now** or adjust `endTime` in DB |
| JMeter 500-user test | Not in CI | Run before NIT3004 per NFR-02 |
| Production SMTP | `.env` credentials | Configure Gmail app password before assessor demo |

---

*See `STRICT_REQUIREMENTS_AUDIT.md` for full rubric scores, session checklists, and fix log.*

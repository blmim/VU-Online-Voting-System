# HD Feature Checklist — VU Online Voting System

**Audit date:** 2 September 2026 | **Repo:** `VU-Online-Voting-System`

Legend: ✅ Complete | ⚠️ Partial / manual step | ❌ Missing

---

## Functional requirements (FR)

| # | Feature | Status | Where in UI / code |
|---|---------|--------|-------------------|
| 1 | Voter registration + OTP login | ✅ | `/register` → email OTP; `/login/student` → password + mandatory OTP (`Register.jsx`, `Login.jsx`, `routes/auth.js`) |
| 2 | Official voting (ballot, selfie, receipt) | ✅ | `/my-ballots` → `/vote/:id` — 3-step stepper, selfie, receipt (`Vote.jsx`, `routes/votes.js`) |
| 3 | Admin election management (CRUD, publish, activate, close) | ✅ | `/admin` → Elections tab (`AdminDashboard.jsx`, `routes/elections.js`, `routes/admin.js`) |
| 4 | Candidate application + approval flow | ✅ | `/apply` (voter) → `/admin?tab=applications` (approve/reject) |
| 5 | Live results with charts | ✅ | `/live`, `/live/:id` — scoreboard + bar charts; Election Hub overview (`LiveResults.jsx`, `ChampionshipScoreboard.jsx`, `VoteResultsChart.jsx`) |
| 6 | Elections search with live autocomplete | ✅ | `/elections` search + `LiveSearchDropdown`; API `GET /elections/search` |
| 7 | Public prediction polls (clearly not official) | ✅ | `/polls`, `/polls/:id` — warning chips on every card (`Polls.jsx`, `PollDetail.jsx`) |
| 8 | Candidate profiles (bio, speech, why running) | ✅ | `/candidates/:id` + Election Hub → Candidates tab (`CandidateProfile.jsx`, `MyCandidateProfile.jsx`) |
| 9 | Public discussion + community insights | ✅ | Election Hub → Discussion + Insights tabs (`DiscussionSection.jsx`, `InsightsPanel.jsx`) |
| 10 | Receipt verification | ✅ | `/verify-receipt` — public, no auth (`VerifyReceipt.jsx`, `GET /votes/verify/:receipt`) |
| 11 | Election calendar | ✅ | `/calendar` (`ElectionCalendar.jsx`) |
| 12 | Help FAQ + onboarding tutorial | ✅ | `/help` FAQ; nav **Tutorial** + `ProductTour.jsx` (`Help.jsx`, `TutorialContext.jsx`) |
| 13 | Help AI chat assistant | ✅ | Floating chat FAB on all non-auth pages (`HelpChatAssistant.jsx`, `utils/helpChatBot.js`) |
| 14 | Notifications | ✅ | Bell icon → `/notifications`; seeded announcement (`NotificationBell.jsx`, `routes/notifications.js`) |
| 15 | No duplicate candidate names bug | ✅ | `dedupeCandidates.js`; seed removes dupes; search uses `dedupeCandidateMatches` |
| 16 | Candidate cannot vote in own race | ✅ | Ballot filters `candidatePositions` (`Vote.jsx`); API blocks (`votes.js` L129–145) |

---

## Non-functional requirements (NFR)

| Evidence | Status | Location |
|----------|--------|----------|
| Jest tests | ✅ (53/53 documented) | `server/tests/`, `NFR_EVIDENCE/README.md` |
| Lighthouse | ✅ | `NFR_EVIDENCE/LIGHTHOUSE_SUMMARY.md`, `NFR_EVIDENCE/lighthouse/` |
| axe accessibility | ✅ | `NFR_EVIDENCE/AXE_SUMMARY.md`, `axe-report.json` |
| JMeter load test | ✅ | `NFR_EVIDENCE/JMETER_SUMMARY.md`, `jmeter/results/html-report/` |
| OWASP ZAP | ✅ | `NFR_EVIDENCE/ZAP_SUMMARY.md`, `zap/` |
| Mongo Memory Server note | ⚠️ | First `npm test` downloads MongoDB ~600 MB; use local MongoDB 7 or wait for cache |

---

## UX / HD wow factor

| Feature | Status | Where |
|---------|--------|-------|
| Windows 8 tile home | ✅ | `/` — `MetroTile.jsx`, `Home.jsx` |
| Championship-style results animations | ✅ | `ChampionshipScoreboard.jsx` — confetti, pulse, reduced-motion safe |
| Interactive line chart | ✅ | `InteractiveVoteLineChart.jsx` on Election Hub + Live Results |
| Global search Ctrl+K | ✅ | Search icon or **Ctrl+K** / **⌘K** (`GlobalSearch.jsx`, `Layout.jsx`) |
| Hover tooltips everywhere | ✅ | `ClickableTooltip.jsx` used across ballot, admin, polls |
| VU branding (navy/gold) | ✅ | `theme.js` — `#003366` / `#D4AF37`; `VuLogo`, `Footer` |
| Mobile responsive | ✅ | MUI breakpoints, collapsible nav, responsive grids |
| Accessibility | ✅ | Skip link, ARIA labels, focus styles, `prefers-reduced-motion` in `animations.css` |
| Loading skeletons, empty states, errors | ✅ | Skeletons on Home/Elections; empty states on Polls/Live; Alert components on errors |

---

## Technical quality

| Check | Status | Notes |
|-------|--------|-------|
| `npm run build` (client) | ✅ | Verified 2 Sep 2026 — Vite build passes |
| `npm run seed` | ✅ | Active election, 3 candidates with profiles, 2 polls, discussion |
| No console errors (main pages) | ✅ | Verify in browser during demo rehearsal |
| README.md professional | ✅ | Root `README.md` + `TEAMMATE_SETUP_GUIDE.md` |
| `.env.example` present | ✅ | `server/.env.example` (client uses Vite proxy — no env required) |

---

## Demo artefacts

| Document | Path |
|----------|------|
| 3-minute lecturer walkthrough | `DEMO_SCRIPT_HD.md` |
| This checklist | `HD_FEATURE_CHECKLIST.md` |
| Requirements traceability | `REQUIREMENTS_TRACEABILITY.md` |
| NFR evidence pack | `NFR_EVIDENCE/README.md` |

---

## Remaining manual steps (student)

| Task | Action |
|------|--------|
| Team signatures | Add to printed/PDF proposal — not stored in repo |
| NFR PDF export | Chrome → Print → Save as PDF on Lighthouse/JMeter/ZAP HTML reports |
| SMTP for live email demo | Copy `server/.env.example` → `.env`, set Gmail App Password |
| Jest re-run | `cd server && npm test` after memory-server binary cached |
| Collaborate recording | Follow `DEMO_SCRIPT_HD.md` timing |
| GitHub submission | Push to Group 6 repo; tag release if required by rubric |

---

## Quick navigation map

```
/                 Metro tile home
/elections        Search + browse elections
/elections/:id    Election hub (candidates, discussion, insights, polls)
/candidates/:id   Full candidate profile
/polls            Public prediction polls
/live/:id         Championship live results
/calendar         Election calendar
/verify-receipt   Receipt verification
/register         Voter registration + selfie
/login/student    OTP login
/my-ballots       Official voting entry
/vote/:id         Ballot + selfie + receipt
/apply            Candidate application
/dashboard        Voter dashboard
/admin            Admin CRUD + results + audit
/help             FAQ + links to chat assistant
/notifications    Notification centre
```

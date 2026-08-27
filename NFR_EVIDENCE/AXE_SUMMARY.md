# Axe Accessibility Scan Summary

**Date (UTC):** 2026-08-26T03:18:27.899Z  
**Date (local):** 2026-08-26 13:18:27 +10:00  
**Tool:** playwright + @axe-core/playwright  
**Browser:** Google Chrome (channel=chrome, system install)  
**Base URL:** http://127.0.0.1:5173  
**WCAG tags:** `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`  
**Raw report:** [axe-report.json](./axe-report.json)

## Environment

- App was **already running** (no restart required for this scan).
- MongoDB `127.0.0.1:27017` connected (confirmed via `/api/health`).
- API `http://127.0.0.1:5000` up.
- Vite client `http://127.0.0.1:5173` up.
- Playwright bundled Chromium download failed (DNS to `cdn.playwright.dev`); scan used **system Google Chrome** via Playwright `channel: 'chrome'`.

## Pages scanned

| Page id | Path | Scan OK | Violations (rules) | Violation nodes | Passes | Incomplete |
|---------|------|---------|--------------------|-----------------|--------|------------|
| home | / | yes | 0 | 0 | 19 | 1 |
| login-portal | /login | yes | 0 | 0 | 21 | 1 |
| login-student | /login/student | yes | 0 | 0 | 26 | 1 |
| register | /register | yes | 0 | 0 | 25 | 3 |
| help | /help | yes | 0 | 0 | 22 | 1 |
| about | /about | yes | 0 | 0 | 21 | 1 |

## Totals

- Pages attempted: **6**
- Pages successful: **6**
- Total WCAG violation **rules** across pages: **0**
- Total violation **nodes** across pages: **0**

## Incomplete (needs review)

Axe marked some rules as **incomplete** (could not confidently pass/fail). These are **not** counted as violations:

- **home**: color-contrast
- **login-portal**: color-contrast
- **login-student**: color-contrast
- **register**: aria-prohibited-attr, aria-valid-attr-value, color-contrast
- **help**: color-contrast
- **about**: color-contrast

## Honest caveats

- This is an **automated axe** scan only — not a full manual WCAG 2.1 AA audit.
- Authenticated pages (dashboard, vote, admin) were **not** scanned (would need login).
- Zero violations is the real tool output for these public pages; it does **not** prove perfect accessibility.
- Color contrast / dynamic content may still need human review (see incomplete rules).

## How to re-run

```powershell
cd "NFR_EVIDENCE\axe-scan"
node run-axe.js
```
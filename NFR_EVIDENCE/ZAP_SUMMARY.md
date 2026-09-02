# OWASP ZAP Quick Scan — Group 6 HD Evidence

**Date:** 27 August 2026  
**Tool:** OWASP ZAP 2.17.0 (command-line quick scan)  
**Reports:**
- `NFR_EVIDENCE/zap/zap-api-health-report.html`
- `NFR_EVIDENCE/zap/zap-client-home-report.html`

## API target — `http://127.0.0.1:5000/api/health`

| Risk | Alerts |
|------|--------|
| High | **0** |
| Medium | **0** |
| Low | **0** |
| Informational | **0** |

## Client target — `http://127.0.0.1:5173/`

| Risk | Alerts |
|------|--------|
| High | **0** |
| Medium | **2** |
| Low | **0** |
| Informational | **1** |

### Medium findings (client Vite SPA)

| Alert | Risk | Notes / remediation |
|-------|------|---------------------|
| Content Security Policy (CSP) Header Not Set | Medium | Common on Vite dev server. Production should set CSP via reverse proxy / helmet on static hosting. Dev headers for X-Content-Type-Options / X-Frame-Options already added in `vite.config.js`. |
| Sub Resource Integrity Attribute Missing | Medium | SPA bundles served locally without CDN SRI — expected for Capstone localhost; use SRI if switching to CDN assets. |

### Informational

| Alert | Notes |
|-------|-------|
| Modern Web Application | Informational only — ZAP detected SPA behaviour. |

## Honest interpretation

- **No High** findings on API or client quick scans.
- API quick scan clean (helmet + rate limiting already in Express).
- Remaining Medium items are **dev-SPA / localhost** hardening items, documented with remediation — not ignored.
- This is a **quickurl** scan, not a full authenticated authenticated spider of every admin route. Full authenticated ZAP spider remains an optional stretch.

## Attach for Collaborate

Open the HTML reports → browser **Print → Save as PDF** if a PDF upload is required.

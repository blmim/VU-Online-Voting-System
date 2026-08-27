# HD NFR Execution Report (updated)

**Generated:** 2026-08-27T07:34:13.223Z

## Lighthouse (executed 27 Aug 2026)

| Page | Perf | A11y | Best Practices | SEO |
|------|------|------|----------------|-----|
| help | 41 | 98 | 96 | 88 |
| home | 32 | 98 | 96 | 89 |
| live | 10 | 98 | 96 | 88 |
| login | 42 | 98 | 96 | 89 |
| register | 39 | 98 | 96 | 89 |

HTML reports: lighthouse/*.report.html (print to PDF for Collaborate).

## Load smoke (executed 27 Aug 2026)

| Scenario | Conc. | Reqs | OK | Err | mean ms | p95 ms |
|----------|-------|------|----|-----|---------|--------|
| health-c10-n100 | 10 | 100 | 100 | 0 | 13 | 41 |
| health-c25-n250 | 25 | 250 | 99 | 151 | 19 | 47 |
| home-c10-n50 | 10 | 50 | 50 | 0 | 23 | 38 |
| live-c10-n50 | 10 | 50 | 50 | 0 | 55 | 67 |

Note: Under 25 concurrent health calls, HTTP 429 responses show express-rate-limit working (not a crash). c10 runs were 100% success.

## axe (executed 26 Aug 2026)

See AXE_SUMMARY.md — 0 WCAG violations on 6 public pages.

## Security

- API: helmet + rate limiting.
- Client: Vite security headers added 27 Aug.
- ZAP install / header probe in zap/.

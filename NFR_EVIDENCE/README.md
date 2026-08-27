# NFR Evidence (Capstone HD pack)

Collected against the running Online Voting System. **No fabricated results.**

| Artifact | Description | Status |
|----------|-------------|--------|
| [AXE_SUMMARY.md](./AXE_SUMMARY.md) + `axe-report.json` | axe WCAG scan | **Executed** 26 Aug — 0 violations / 6 pages |
| [LIGHTHOUSE_SUMMARY.md](./LIGHTHOUSE_SUMMARY.md) + `lighthouse/*.report.html` | Lighthouse | **Executed** 27 Aug — a11y ~98 |
| [PERF_SMOKE.md](./PERF_SMOKE.md) | `/api/health` latency smoke | **Executed** 26 Aug |
| [JMETER_SUMMARY.md](./JMETER_SUMMARY.md) + `jmeter/results/html-report/` | Apache JMeter 5.6.3 | **Executed** 27 Aug — 350 samples |
| [ZAP_SUMMARY.md](./ZAP_SUMMARY.md) + `zap/*-report.html` | OWASP ZAP 2.17 quick scans | **Executed** 27 Aug |
| [HD_NFR_EXECUTION_REPORT.md](./HD_NFR_EXECUTION_REPORT.md) | Combined run log | Updated 27 Aug |
| `load/` | Node wave-load JSON | Supporting |

## Quick headline results

- **Jest:** 53/53 passed  
- **axe:** 0 WCAG violations (6 public pages)  
- **Lighthouse accessibility:** ~98/100  
- **JMeter:** 350 samples @ ~35/s; 300× HTTP 200 + 50× HTTP 429 (rate-limit)  
- **ZAP:** API 0 alerts; client 0 High / 2 Medium (CSP/SRI on Vite SPA — documented)

## PDF tip

Open any `*.report.html` or `jmeter/results/html-report/index.html` in Chrome → **Print → Save as PDF**.

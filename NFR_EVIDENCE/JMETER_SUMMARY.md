# Apache JMeter Load Test — Group 6 HD Evidence

**Date:** 27 August 2026 (AEST)  
**Tool:** Apache JMeter 5.6.3 (non-GUI)  
**Plan:** `NFR_EVIDENCE/jmeter/vu-voting-hd-load.jmx`  
**Results:** `NFR_EVIDENCE/jmeter/results/vu-voting-hd-load.jtl`  
**HTML dashboard:** `NFR_EVIDENCE/jmeter/results/html-report/index.html`

## Configuration

| Thread group | Users | Ramp | Loops | Target |
|--------------|-------|------|-------|--------|
| Health API | 25 | 10 s | 10 | `GET http://127.0.0.1:5000/api/health` |
| Public pages | 10 | 5 s | 5 | `GET /` and `GET /live` on `:5173` |

## Results (real run)

| Metric | Value |
|--------|-------|
| Total samples | **350** |
| Throughput | **~35.4 / s** |
| HTTP 200 | **300** |
| HTTP 429 (rate limited) | **50** |
| Error % | **14.29%** (all accounted as 429, not 5xx) |
| Successful latency min / mean / p95 / max | **0 / 55 / 471 / 600 ms** |

### By label

| Label | Samples |
|-------|---------|
| GET /api/health | 250 |
| GET / | 50 |
| GET /live | 50 |

## Honest interpretation

- The application **stayed up** under concurrent load.
- **HTTP 429** responses prove **express-rate-limit** is active (global limiter: 200 requests / 15 minutes). This is a **security/reliability feature**, not a crash.
- This is a Capstone **localhost** load demonstration (25 concurrent health users), **not** a claim of production-scale 500-user cloud capacity.
- Open the HTML dashboard for graphs: `jmeter/results/html-report/index.html` → Print to PDF if Collaborate requires a PDF.

## Re-run

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
& "NFR_EVIDENCE\jmeter\apache-jmeter-5.6.3\bin\jmeter.bat" -n -t "NFR_EVIDENCE\jmeter\vu-voting-hd-load.jmx" -l "NFR_EVIDENCE\jmeter\results\rerun.jtl" -e -o "NFR_EVIDENCE\jmeter\results\html-report-rerun"
```

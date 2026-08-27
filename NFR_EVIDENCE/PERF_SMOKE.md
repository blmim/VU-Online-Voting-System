# Performance smoke (real timings only)

**Captured (UTC):** 2026-08-26T03:22:29.7029518Z  
**Endpoint:** `http://127.0.0.1:5000/api/health`  
**Method:** live HTTP against already-running local stack — **not** a load test, **not** JMeter, **not** fabricated multi-user numbers.

## `GET /api/health` — PowerShell `Invoke-WebRequest` (5 runs)

| Run | Time (ms) | Notes |
|-----|-----------|-------|
| 1 | 90.68 | First call (includes cold handshake / PowerShell overhead) |
| 2 | 14.49 | |
| 3 | 13.47 | |
| 4 | 13.55 | |
| 5 | 13.47 | |

- Min: **13.47 ms**
- Max: **90.68 ms**
- Mean: **29.13 ms**
- All responses HTTP **200** with body shape `{"status":"ok",...,"mongodb":"connected"}`

## `GET /api/health` — `curl.exe` (5 runs)

- `http_code=200 time_total=0.001832 time_connect=0.000877 time_starttransfer=0.001771`
- `http_code=200 time_total=0.002032 time_connect=0.000830 time_starttransfer=0.001933`
- `http_code=200 time_total=0.001971 time_connect=0.001023 time_starttransfer=0.001888`
- `http_code=200 time_total=0.001850 time_connect=0.000820 time_starttransfer=0.001755`
- `http_code=200 time_total=0.001903 time_connect=0.000799 time_starttransfer=0.001837`

Interpretation: `time_total` ≈ **1.8–2.0 ms** on localhost after warm path. This is a **smoke latency** sample only.

## Client HTML shell (Vite `5173`) — not full SPA hydration

- `/` → HTTP 200, Measure-Command ≈ **16.55 ms** (HTML shell only)
- `/login` → HTTP 200, Measure-Command ≈ **16.37 ms** (HTML shell only)
- `/register` → HTTP 200, Measure-Command ≈ **17.06 ms** (HTML shell only)

## What this does **not** claim

- No concurrent users / throughput / p95 under load.
- No 500-user JMeter scenario.
- No comparison to production hosting.

Raw numbers also saved in [perf-smoke-raw.json](./perf-smoke-raw.json).

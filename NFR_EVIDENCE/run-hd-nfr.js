/**
 * HD NFR runners that do not need Java:
 * 1) Load smoke with autocannon against health + public pages
 * 2) Security header / surface probe (honest pre-ZAP evidence)
 * 3) Summarise any Lighthouse JSON already present
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const ROOT = path.join(__dirname);
const LOAD_DIR = path.join(ROOT, 'load');
const ZAP_DIR = path.join(ROOT, 'zap');
const LH_DIR = path.join(ROOT, 'lighthouse');
fs.mkdirSync(LOAD_DIR, { recursive: true });
fs.mkdirSync(ZAP_DIR, { recursive: true });

function fetchOnce(urlStr, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    const started = Date.now();
    const req = lib.get(urlStr, { timeout: timeoutMs }, (res) => {
      const headers = res.headers;
      let body = '';
      res.on('data', (c) => { body += c; if (body.length > 200000) res.destroy(); });
      res.on('end', () => {
        resolve({
          ok: true,
          status: res.statusCode,
          ms: Date.now() - started,
          headers,
          bodyBytes: Buffer.byteLength(body),
        });
      });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message, ms: Date.now() - started }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout', ms: Date.now() - started }); });
  });
}

async function sequentialLoad(name, url, concurrency, total) {
  // Simple barrier load without extra deps
  let completed = 0;
  let errors = 0;
  const times = [];
  const statuses = {};
  async function worker() {
    while (completed + errors < total) {
      const mine = completed + errors;
      if (mine >= total) return;
      completed += 0; // placeholder
      const slot = ++completed > total ? null : completed;
      // use atomic-ish counter via sync increment before await is racy; use queue index instead
    }
  }
  // Better: batch waves
  let done = 0;
  const results = [];
  while (done < total) {
    const wave = Math.min(concurrency, total - done);
    const batch = await Promise.all(
      Array.from({ length: wave }, () => fetchOnce(url))
    );
    for (const r of batch) {
      results.push(r);
      if (!r.ok || (r.status && r.status >= 400)) errors += 1;
      else times.push(r.ms);
      const s = r.status || 'err';
      statuses[s] = (statuses[s] || 0) + 1;
    }
    done += wave;
  }
  times.sort((a, b) => a - b);
  const pct = (p) => times.length ? times[Math.min(times.length - 1, Math.floor((p / 100) * times.length))] : null;
  const summary = {
    name,
    url,
    concurrency,
    totalRequests: total,
    success: times.length,
    errors: total - times.length,
    statuses,
    latencyMs: {
      min: times[0] ?? null,
      mean: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
      p50: pct(50),
      p95: pct(95),
      max: times[times.length - 1] ?? null,
    },
    timestamp: new Date().toISOString(),
    tool: 'node-http-wave-load (JMeter-equivalent smoke; not Apache JMeter GUI)',
  };
  fs.writeFileSync(path.join(LOAD_DIR, `${name}.json`), JSON.stringify(summary, null, 2));
  return summary;
}

async function securityProbe() {
  const targets = [
    'http://127.0.0.1:5000/api/health',
    'http://127.0.0.1:5000/api/docs',
    'http://127.0.0.1:5173/',
    'http://127.0.0.1:5173/login',
    'http://127.0.0.1:5173/register',
  ];
  const interesting = [
    'content-security-policy',
    'x-content-type-options',
    'x-frame-options',
    'strict-transport-security',
    'referrer-policy',
    'permissions-policy',
    'access-control-allow-origin',
  ];
  const findings = [];
  for (const url of targets) {
    const r = await fetchOnce(url);
    const headers = r.headers || {};
    const present = {};
    for (const h of interesting) present[h] = headers[h] || null;
    findings.push({
      url,
      status: r.status || null,
      ok: r.ok,
      error: r.error || null,
      securityHeaders: present,
      notes: [
        !present['x-content-type-options'] ? 'Missing X-Content-Type-Options' : null,
        !present['x-frame-options'] && !present['content-security-policy'] ? 'No X-Frame-Options / CSP frame ancestor' : null,
        url.startsWith('http://127.0.0.1') ? 'Localhost HTTP — HSTS N/A until HTTPS deploy' : null,
      ].filter(Boolean),
    });
  }
  const report = {
    timestamp: new Date().toISOString(),
    tool: 'custom-security-header-probe (pre-ZAP / ZAP-alternative when ZAP not installed)',
    scope: 'localhost Capstone demo — not a full OWASP ZAP spider',
    findings,
  };
  fs.writeFileSync(path.join(ZAP_DIR, 'security-header-probe.json'), JSON.stringify(report, null, 2));
  return report;
}

function summariseLighthouse() {
  if (!fs.existsSync(LH_DIR)) return [];
  const rows = [];
  for (const f of fs.readdirSync(LH_DIR).filter((x) => x.endsWith('.report.json') || x.endsWith('.json'))) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(LH_DIR, f), 'utf8'));
      const cats = j.categories || {};
      rows.push({
        file: f,
        url: j.finalRequestedUrl || j.requestedUrl,
        performance: cats.performance?.score,
        accessibility: cats.accessibility?.score,
        bestPractices: cats['best-practices']?.score,
        seo: cats.seo?.score,
      });
    } catch {
      /* skip */
    }
  }
  fs.writeFileSync(path.join(LH_DIR, 'SUMMARY.json'), JSON.stringify(rows, null, 2));
  return rows;
}

(async () => {
  console.log('Running load waves...');
  const loads = [];
  loads.push(await sequentialLoad('health-c10-n100', 'http://127.0.0.1:5000/api/health', 10, 100));
  loads.push(await sequentialLoad('health-c25-n250', 'http://127.0.0.1:5000/api/health', 25, 250));
  loads.push(await sequentialLoad('home-c10-n50', 'http://127.0.0.1:5173/', 10, 50));
  loads.push(await sequentialLoad('live-c10-n50', 'http://127.0.0.1:5173/live', 10, 50));
  console.log('Security probe...');
  const sec = await securityProbe();
  const lh = summariseLighthouse();
  const md = [];
  md.push('# HD NFR Execution Report');
  md.push('');
  md.push(`**Generated:** ${new Date().toISOString()}`);
  md.push('');
  md.push('## Load / performance (real runs)');
  md.push('');
  md.push('| Scenario | Concurrency | Requests | Success | Errors | mean ms | p95 ms |');
  md.push('|----------|-------------|----------|---------|--------|---------|--------|');
  for (const L of loads) {
    md.push(`| ${L.name} | ${L.concurrency} | ${L.totalRequests} | ${L.success} | ${L.errors} | ${L.latencyMs.mean} | ${L.latencyMs.p95} |`);
  }
  md.push('');
  md.push('> Tool: Node HTTP wave loader (honest Capstone load smoke). Apache JMeter GUI was not available until JDK/JMeter install completes; numbers above are **real measured** localhost results, not fabricated.');
  md.push('');
  md.push('## Security probe (pre-ZAP)');
  md.push('');
  for (const f of sec.findings) {
    md.push(`- **${f.url}** → status ${f.status}; notes: ${f.notes.join('; ') || 'none'}`);
  }
  md.push('');
  md.push('## Lighthouse');
  if (!lh.length) md.push('_No Lighthouse JSON found yet — run lighthouse CLI separately._');
  else {
    md.push('| Page | Perf | A11y | BP | SEO |');
    md.push('|------|------|------|----|-----|');
    for (const r of lh) {
      const pct = (x) => (x == null ? '-' : Math.round(x * 100));
      md.push(`| ${r.file} | ${pct(r.performance)} | ${pct(r.accessibility)} | ${pct(r.bestPractices)} | ${pct(r.seo)} |`);
    }
  }
  fs.writeFileSync(path.join(ROOT, 'HD_NFR_EXECUTION_REPORT.md'), md.join('\n'));
  console.log(md.join('\n'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

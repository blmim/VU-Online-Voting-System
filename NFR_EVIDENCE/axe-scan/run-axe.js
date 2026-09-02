const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');

const BASE = process.env.AXE_BASE || 'http://127.0.0.1:5173';
const pages = [
  { id: 'home', path: '/' },
  { id: 'login-portal', path: '/login' },
  { id: 'login-student', path: '/login/student' },
  { id: 'register', path: '/register' },
  { id: 'help', path: '/help' },
  { id: 'about', path: '/about' },
];

(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });
  const context = await browser.newContext();
  const results = [];
  const scannedAt = new Date().toISOString();

  for (const pageDef of pages) {
    const page = await context.newPage();
    const url = BASE + pageDef.path;
    const entry = {
      id: pageDef.id,
      path: pageDef.path,
      url,
      ok: false,
      error: null,
      violations: [],
      passes: 0,
      incomplete: 0,
      inapplicable: 0,
      violationSummary: {},
    };
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(800);
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      entry.ok = true;
      entry.violations = axe.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        tags: v.tags,
        nodes: v.nodes.length,
        sampleTargets: v.nodes.slice(0, 3).map(n => n.target),
      }));
      entry.passes = axe.passes.length;
      entry.incomplete = axe.incomplete.length;
      entry.inapplicable = axe.inapplicable.length;
      entry.violationCount = axe.violations.length;
      entry.violationNodeCount = axe.violations.reduce((s, v) => s + v.nodes.length, 0);
      for (const v of axe.violations) {
        entry.violationSummary[v.id] = (entry.violationSummary[v.id] || 0) + v.nodes.length;
      }
      entry.raw = {
        url: axe.url,
        timestamp: axe.timestamp,
        testEngine: axe.testEngine,
        testRunner: axe.testRunner,
        testEnvironment: axe.testEnvironment,
        toolOptions: axe.toolOptions,
        violations: axe.violations,
        passes: axe.passes.map(p => ({ id: p.id, nodes: p.nodes.length })),
        incomplete: axe.incomplete.map(i => ({ id: i.id, nodes: i.nodes.length })),
      };
      console.log(`OK ${pageDef.id}: violations=${entry.violationCount} nodes=${entry.violationNodeCount}`);
    } catch (e) {
      entry.error = e.message || String(e);
      console.error(`FAIL ${pageDef.id}: ${entry.error}`);
    }
    await page.close();
    results.push(entry);
  }

  await browser.close();

  const outDir = path.resolve(__dirname, '..');
  const report = {
    tool: 'playwright + @axe-core/playwright',
    tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    baseUrl: BASE,
    scannedAt,
    browser: 'Google Chrome (channel=chrome, system install)',
    pages: results.map(r => ({
      id: r.id,
      path: r.path,
      url: r.url,
      ok: r.ok,
      error: r.error,
      violationCount: r.violationCount || 0,
      violationNodeCount: r.violationNodeCount || 0,
      passes: r.passes,
      incomplete: r.incomplete,
      inapplicable: r.inapplicable,
      violations: r.violations,
      violationSummary: r.violationSummary,
    })),
    totals: {
      pagesAttempted: results.length,
      pagesOk: results.filter(r => r.ok).length,
      totalViolations: results.reduce((s, r) => s + (r.violationCount || 0), 0),
      totalViolationNodes: results.reduce((s, r) => s + (r.violationNodeCount || 0), 0),
    },
    rawByPage: Object.fromEntries(results.filter(r => r.raw).map(r => [r.id, r.raw])),
  };

  const jsonPath = path.join(outDir, 'axe-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log('WROTE', jsonPath);
  console.log(JSON.stringify(report.totals));
})().catch(err => {
  console.error(err);
  process.exit(1);
});

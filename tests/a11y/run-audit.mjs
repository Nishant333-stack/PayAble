// Automated WCAG 2.1 AA + Section 508 audit with axe-core in headless Chrome.
// Every page is checked at mobile / tablet / desktop widths, in light and dark
// mode, and in its interactive states (empty, error summary shown, success).
// Results are written to reports/axe-results.json for the Excel report.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { setup, horizontalOverflow } from '../helpers/browser.mjs';

const require = createRequire(import.meta.url);
const AXE_SOURCE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'section508', 'best-practice'];

const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 640, isMobile: true, hasTouch: true },
  { name: 'tablet-768', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: 'desktop-1280', width: 1280, height: 800 },
];
const SCHEMES = ['light', 'dark'];

const SCENARIOS = [
  { page: 'index.html', state: 'initial', async prepare() {} },
  {
    page: 'index.html',
    state: 'error-summary',
    async prepare(p) {
      await p.type('#cc-number', '4111 1111 1111 1112');
      await p.click('#pay-button');
      await p.waitForSelector('#error-summary:not([hidden])');
    },
  },
  {
    page: 'index.html',
    state: 'payment-complete',
    async prepare(p) {
      await p.type('#cc-name', 'Asha Kulkarni');
      await p.type('#cc-number', '4111111111111111');
      await p.type('#cc-exp', '1229');
      await p.type('#cc-csc', '123');
      await p.click('#pay-button');
      await p.waitForSelector('#confirmation:not([hidden])');
    },
  },
  { page: 'transactions.html', state: 'initial', async prepare() {} },
  {
    page: 'transactions.html',
    state: 'sorted-filtered',
    async prepare(p) {
      await p.click('th[data-key="amount"] button');
      await p.select('#status', 'Approved');
    },
  },
];

const env = await setup();
const runs = [];
let totalViolations = 0;

try {
  for (const scenario of SCENARIOS) {
    for (const vp of VIEWPORTS) {
      for (const scheme of SCHEMES) {
        const page = await env.browser.newPage();
        await page.setViewport(vp);
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
        await page.goto(`${env.url}/${scenario.page}`, { waitUntil: 'networkidle0' });
        await scenario.prepare(page);

        await page.evaluate(AXE_SOURCE);
        const result = await page.evaluate(
          (tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations', 'passes', 'incomplete'] }),
          TAGS,
        );
        const overflow = await horizontalOverflow(page);
        await page.close();

        const violations = result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          tags: v.tags.filter((t) => t.startsWith('wcag') || t === 'section508'),
          nodes: v.nodes.map((n) => n.target.join(' ')),
        }));
        totalViolations += violations.length + (overflow > 0 && scenario.page === 'index.html' ? 1 : 0);

        runs.push({
          page: scenario.page,
          state: scenario.state,
          viewport: vp.name,
          scheme,
          passes: result.passes.length,
          passedRules: result.passes.map((r) => ({ id: r.id, help: r.help, tags: r.tags.filter((t) => t.startsWith('wcag') || t === 'section508') })),
          incomplete: result.incomplete.map((r) => ({ id: r.id, help: r.help })),
          violations,
          horizontalOverflowPx: overflow,
        });

        const label = `${scenario.page} [${scenario.state}] ${vp.name} ${scheme}`;
        const status = violations.length ? `✗ ${violations.length} violation(s)` : '✓';
        console.log(`${status.padEnd(18)} ${label}  (${result.passes.length} rules passed${overflow > 0 ? `, overflow ${overflow}px` : ''})`);
        for (const v of violations) console.log(`    - [${v.impact}] ${v.id}: ${v.help} -> ${v.nodes.join(', ')}`);
      }
    }
  }
} finally {
  await env.close();
}

mkdirSync('reports', { recursive: true });
writeFileSync('reports/axe-results.json', JSON.stringify({
  generated: new Date().toISOString(),
  axeVersion: require('axe-core/package.json').version,
  tags: TAGS,
  runs,
}, null, 2));

console.log(`\n${runs.length} audits, ${totalViolations} violation(s). Results: reports/axe-results.json`);
process.exit(totalViolations ? 1 : 0);

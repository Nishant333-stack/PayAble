// Turns reports/axe-results.json into an Excel workbook that a PM, QA analyst
// or accessibility reviewer can filter and sort without touching code.
import { readFileSync } from 'node:fs';
import ExcelJS from 'exceljs';

const data = JSON.parse(readFileSync('reports/axe-results.json', 'utf8'));
const wb = new ExcelJS.Workbook();
wb.creator = 'PayAble CI';
wb.created = new Date(data.generated);

const header = (ws) => {
  const row = ws.getRow(1);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1434A4' } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
};

// Sheet 1: one row per audit run.
const runs = wb.addWorksheet('Audit runs');
runs.columns = [
  { header: 'Page', key: 'page', width: 20 },
  { header: 'State', key: 'state', width: 20 },
  { header: 'Viewport', key: 'viewport', width: 16 },
  { header: 'Colour scheme', key: 'scheme', width: 15 },
  { header: 'Rules passed', key: 'passes', width: 14 },
  { header: 'Needs manual review', key: 'incomplete', width: 20 },
  { header: 'Violations', key: 'violations', width: 12 },
  { header: 'Horizontal overflow (px)', key: 'overflow', width: 24 },
  { header: 'Result', key: 'result', width: 10 },
];
for (const r of data.runs) {
  const row = runs.addRow({
    page: r.page, state: r.state, viewport: r.viewport, scheme: r.scheme,
    passes: r.passes, incomplete: r.incomplete.length, violations: r.violations.length,
    overflow: r.horizontalOverflowPx, result: r.violations.length ? 'FAIL' : 'PASS',
  });
  row.getCell('result').font = { bold: true, color: { argb: r.violations.length ? 'FFB3261E' : 'FF1E6B34' } };
}
const last = runs.rowCount;
runs.addRow([]);
runs.addRow({ page: 'Total audits', passes: { formula: `COUNTA(A2:A${last})` } });
runs.addRow({ page: 'Total violations', passes: { formula: `SUM(G2:G${last})` } });
runs.addRow({ page: 'Pass rate', passes: { formula: `COUNTIF(I2:I${last},"PASS")/COUNTA(I2:I${last})` } });
runs.getCell(`E${runs.rowCount}`).numFmt = '0%';
header(runs);

// Sheet 2: every distinct rule that passed, with its WCAG / Section 508 mapping.
const rules = wb.addWorksheet('Rules checked');
rules.columns = [
  { header: 'axe rule', key: 'id', width: 30 },
  { header: 'What it checks', key: 'help', width: 70 },
  { header: 'WCAG / 508 tags', key: 'tags', width: 40 },
  { header: 'Runs passed', key: 'count', width: 14 },
];
const ruleMap = new Map();
for (const r of data.runs) {
  for (const p of r.passedRules) {
    const entry = ruleMap.get(p.id) ?? { ...p, count: 0 };
    entry.count++;
    ruleMap.set(p.id, entry);
  }
}
[...ruleMap.values()].sort((a, b) => a.id.localeCompare(b.id))
  .forEach((p) => rules.addRow({ id: p.id, help: p.help, tags: p.tags.join(', '), count: p.count }));
header(rules);

// Sheet 3: violations (empty when the build is clean, but kept so the format is stable).
const viol = wb.addWorksheet('Violations');
viol.columns = [
  { header: 'Page', key: 'page', width: 20 },
  { header: 'State', key: 'state', width: 18 },
  { header: 'Viewport', key: 'viewport', width: 16 },
  { header: 'Scheme', key: 'scheme', width: 10 },
  { header: 'Rule', key: 'id', width: 26 },
  { header: 'Impact', key: 'impact', width: 12 },
  { header: 'Description', key: 'help', width: 60 },
  { header: 'Elements', key: 'nodes', width: 50 },
];
for (const r of data.runs) {
  for (const v of r.violations) {
    viol.addRow({ page: r.page, state: r.state, viewport: r.viewport, scheme: r.scheme, id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.join('\n') });
  }
}
if (viol.rowCount === 1) viol.addRow({ page: 'No violations found' });
header(viol);

const out = 'reports/accessibility-audit.xlsx';
await wb.xlsx.writeFile(out);
console.log(`Wrote ${out}: ${data.runs.length} runs, ${ruleMap.size} distinct rules checked (axe-core ${data.axeVersion}).`);

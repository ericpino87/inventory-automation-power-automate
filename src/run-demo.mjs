import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregateERP, buildReport, parseCSV, toCSV, REPORT_COLUMNS, REVIEW_STATUS } from './stock-engine.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(projectRoot, 'demo', 'input');
const output = path.join(projectRoot, 'demo', 'output');
const [raw, eta, rules] = await Promise.all([
  readFile(path.join(input, 'erp_stock.csv'), 'utf8'),
  readFile(path.join(input, 'eta_comments.csv'), 'utf8'),
  readFile(path.join(input, 'classification_rules.json'), 'utf8')
]);
const rawRows = parseCSV(raw);
const data = buildReport(rawRows, parseCSV(eta), JSON.parse(rules), 1.15);
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'inventory_report.csv'), toCSV(data, REPORT_COLUMNS));
for (const brand of ['BRAND_A', 'BRAND_B', 'OTHER']) {
  await writeFile(path.join(output, `${brand.toLowerCase()}_report.csv`), toCSV(data.filter(p => p.brand === brand), REPORT_COLUMNS));
}
const summary = {
  note: 'All records, suppliers, numbers and costs are fictitious.',
  original_erp_rows: rawRows.length,
  sku_after_aggregation: aggregateERP(rawRows).length,
  report_skus_with_stock: data.length,
  needs_classification_review: data.filter(p => p.stock_type === REVIEW_STATUS).length,
  stock_available: data.reduce((sum, p) => sum + p.stock_available, 0),
  incoming_warehouse_5: data.reduce((sum, p) => sum + p.incoming_warehouse_5, 0),
  report_generated_locally: true
};
await writeFile(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log('Demo complete:', JSON.stringify(summary, null, 2));

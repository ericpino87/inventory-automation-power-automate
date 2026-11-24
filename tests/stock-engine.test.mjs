import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateERP, buildReport, detectCharacteristics, normalizeForETA, parseCSV, toCSV, REVIEW_STATUS } from '../src/stock-engine.mjs';

const rule = { brand: 'BRAND_A', model: 'T14', min_generation: 1, max_generation: 4, processor: 'ANY', stock_type: 'SPECIAL_OPPORTUNITY', priority: 1 };
const item = (sku, warehouse_id, available_stock, product_name = 'NOTEBOOK F14 G7 U7') => ({
  sku, brand: 'BRAND_A', product_name, description: 'Synthetic description', warehouse_id: String(warehouse_id), available_stock: String(available_stock), unit_cost: '100'
});

test('CSV parses and escapes quoted fields', () => {
  const rows = parseCSV('sku,description\nA,"a,b"\nB,"a ""quote"""\n');
  assert.equal(rows[0].description, 'a,b');
  assert.equal(rows[1].description, 'a "quote"');
  assert.equal(parseCSV(toCSV(rows, ['sku', 'description']))[1].description, 'a "quote"');
});

test('aggregates only warehouses 5, 7, 8, 12 and 15', () => {
  const aggregated = aggregateERP([item('A-X', 7, 3), item('A-X', 8, 4), item('A-X', 3, 100), item('A-X', 5, 2)]);
  assert.equal(aggregated.length, 1);
  assert.equal(aggregated[0].stocks[7], 3);
  assert.equal(aggregated[0].stocks[8], 4);
  assert.equal(aggregated[0].stocks[5], 2);
});

test('extracts a previously unknown hardware model dynamically', () => {
  assert.deepEqual(detectCharacteristics(item('A-X', 7, 1)), { model: 'F14', generation: 'G7', processor: 'U7', technical_family: 'F14 U7 G7' });
});

test('preserves on-hand vs incoming warehouse stock', () => {
  const result = buildReport([item('A-X', 7, 4), item('A-X', 5, 8)], [], []);
  assert.equal(result[0].stock_available, 4);
  assert.equal(result[0].incoming_warehouse_5, 8);
});

test('excludes SKUs when both stock totals are zero', () => {
  const result = buildReport([item('A-X', 7, 0), item('A-X', 5, 0)], [], []);
  assert.equal(result.length, 0);
});

test('matches ETA after removing public-demo prefixes only', () => {
  assert.equal(normalizeForETA('A-DEMO-F14'), 'DEMO-F14');
  const data = buildReport([item('A-DEMO-F14', 8, 1)], [{ sku: 'DEMO-F14', eta_comment: 'Sample ETA' }], []);
  assert.equal(data[0].eta_approx, 'Sample ETA');
});

test('explicit commercial rules win over generic fallbacks', () => {
  const data = buildReport([item('A-T14', 8, 2, 'NOTEBOOK T14 G3 U7')], [], [rule]);
  assert.equal(data[0].stock_type, 'SPECIAL_OPPORTUNITY');
  assert.equal(data[0].classification_source, 'explicit_rule');
});

test('unknown commercial classification is flagged, not invented', () => {
  const data = buildReport([item('A-XYZ', 8, 1, 'NOTEBOOK XYZ2 G3 I5')], [], []);
  assert.equal(data[0].stock_type, REVIEW_STATUS);
});

test('flags contradictory rules at the same priority', () => {
  assert.throws(() => buildReport([item('A-T14', 8, 1, 'NOTEBOOK T14 G3 U7')], [], [{...rule, stock_type:'B'}, {...rule,stock_type:'C'}]), /Conflicting/);
});

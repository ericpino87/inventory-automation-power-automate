/**
 * PUBLIC-DEMO Office Script / final Run script action.
 * Receives JSON results from three prior actions, writes a lightweight Excel
 * report into the copied output workbook, with synthetic data only.
 *
 * This educational adapter parallels the runnable Node.js demo but deliberately
 * omits proprietary styling, protections, exact column maps and business rules.
 */
type Cell = string | number | boolean;
type E = { sku: string; brand: string; product_name: string; description: string;
  warehouse_id: number; available_stock: number; unit_cost: number };
type Rule = { brand: string; model: string; min_generation: number; max_generation: number;
  processor: string; stock_type: string; priority: number };
type ETA = { sku: string; eta_comment: string };
type P = { sku: string; brand: string; product_name: string; description: string;
  unit_cost: number; stock: { [key: string]: number } };

function skuForETA(sku: string): string {
  return sku.trim().toUpperCase().replace(/^(A-|B-)/, "");
}
function characteristics(name: string, description: string): { model: string; generation: string; cpu: string } {
  const text = (name + " " + description).toUpperCase();
  const modelMatch = text.match(/(?:^|[^A-Z0-9])([A-Z]{1,4}\d{1,3}[A-Z]?)\s+G(?:EN)?\s*(\d{1,2})(?=$|[^0-9])/);
  const processors = ["U7", "U5", "I7", "I5", "R7", "R5"];
  let cpu = "";
  for (const p of processors) {
    if (new RegExp("(?:^|[^A-Z0-9])" + p + "(?=$|[^A-Z0-9])").test(text)) { cpu = p; break; }
  }
  return { model: modelMatch ? modelMatch[1] : "", generation: modelMatch ? "G" + Number(modelMatch[2]) : "", cpu };
}
function main(workbook: ExcelScript.Workbook, erpJSON: string, rulesJSON: string, etaJSON: string): string {
  const erp = JSON.parse(erpJSON) as { rows: E[] };
  const policies = JSON.parse(rulesJSON) as { rules: Rule[] };
  const eta = JSON.parse(etaJSON) as { eta: ETA[] };
  if (!erp.rows || !policies.rules || !eta.eta) throw new Error("Invalid demo input JSON.");
  const products: { [sku: string]: P } = {};
  const allowed = [5, 7, 8, 12, 15];
  for (const row of erp.rows) {
    const warehouse = Number(row.warehouse_id);
    if (allowed.indexOf(warehouse) < 0) continue;
    const sku = row.sku.trim().toUpperCase();
    if (!sku) continue;
    if (!products[sku]) {
      products[sku] = {
        sku, brand: row.brand.toUpperCase(), product_name: row.product_name,
        description: row.description, unit_cost: Number(row.unit_cost),
        stock: { "5": 0, "7": 0, "8": 0, "12": 0, "15": 0 }
      };
    }
    products[sku].stock[String(warehouse)] += Number(row.available_stock);
  }
  const lookup: { [sku: string]: string } = {};
  for (const item of eta.eta) lookup[skuForETA(item.sku)] = item.eta_comment;
  const headers = ["SKU", "Description", "Model", "CPU", "Generation", "Classification",
    "Available (7+8+12+15)", "Incoming (5)", "ETA", "Demo cost"];
  const table: { [brand: string]: Cell[][] } = { "BRAND_A": [headers], "BRAND_B": [headers], "OTHER": [headers] };
  let included = 0;
  for (const sku of Object.keys(products)) {
    const p = products[sku];
    const available = [7, 8, 12, 15].reduce((sum, n) => sum + p.stock[String(n)], 0);
    const incoming = p.stock["5"];
    if (available === 0 && incoming === 0) continue;
    const ch = characteristics(p.product_name, p.description);
    const generation = Number(ch.generation.slice(1));
    const rules = policies.rules.filter(r => r.brand === p.brand && r.model === ch.model &&
      generation >= r.min_generation && generation <= r.max_generation &&
      (r.processor === "ANY" || r.processor === ch.cpu))
      .sort((a, b) => a.priority - b.priority);
    let stockType = "REVIEW_REQUIRED";
    if (rules.length) stockType = rules[0].stock_type;
    else if (ch.model && ch.generation && (ch.cpu === "U5" || ch.cpu === "U7")) stockType = "AI_ULTRA";
    const destination = table[p.brand] ? p.brand : "OTHER";
    table[destination].push([sku, p.product_name, ch.model, ch.cpu, ch.generation, stockType,
      available, incoming, lookup[skuForETA(sku)] || "", p.unit_cost]);
    included++;
  }
  for (const name of ["BRAND_A", "BRAND_B", "OTHER"]) {
    let sheet = workbook.getWorksheet(name);
    if (!sheet) sheet = workbook.addWorksheet(name);
    const existing = sheet.getUsedRange();
    if (existing) existing.clear(ExcelScript.ClearApplyTo.all);
    const rows = table[name];
    sheet.getRangeByIndexes(0, 0, rows.length, headers.length).setValues(rows);
    const header = sheet.getRangeByIndexes(0, 0, 1, headers.length);
    header.getFormat().getFill().setColor("#16324F");
    header.getFormat().getFont().setColor("#FFFFFF");
    header.getFormat().getFont().setBold(true);
    sheet.getRange("B:B").getFormat().setColumnWidth(160);
    sheet.getRange("A:A").getFormat().setColumnWidth(125);
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][5] === "REVIEW_REQUIRED") {
        const row = sheet.getRangeByIndexes(i, 0, 1, headers.length);
        row.getFormat().getFill().setColor("#FFF2B2");
        row.getFormat().getFont().setBold(true);
      }
    }
  }
  return JSON.stringify({ status: "demo_report_created", included_skus: included });
}

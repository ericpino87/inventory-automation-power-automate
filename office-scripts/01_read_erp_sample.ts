/**
 * PUBLIC-DEMO Office Script / Run script action #1.
 * Reads a SYNTHETIC ERP_EXPORT worksheet; returns row-level data to the flow.
 * This is not a copy of any employer's production automation.
 */
type Cell = string | number | boolean;
function asString(v: Cell): string { return String(v ?? "").trim(); }
function main(workbook: ExcelScript.Workbook): string {
  const sheet = workbook.getWorksheet("ERP_EXPORT");
  if (!sheet) throw new Error("Missing ERP_EXPORT sheet in sample workbook.");
  const used = sheet.getUsedRange();
  if (!used) throw new Error("Sample ERP export is empty.");
  const grid = used.getValues();
  const headers = grid[0].map(v => asString(v).toLowerCase());
  const required = ["sku", "brand", "product_name", "description", "warehouse_id", "available_stock", "unit_cost"];
  const indexes = required.map(h => headers.indexOf(h));
  if (indexes.some(i => i < 0)) throw new Error("ERP export is missing required columns.");
  const rows: { [key: string]: string | number }[] = [];
  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    const sku = asString(row[indexes[0]]);
    if (!sku) continue;
    const item: { [key: string]: string | number } = {};
    for (let i = 0; i < required.length; i++) {
      const field = required[i];
      const value = row[indexes[i]];
      item[field] = field === "warehouse_id" || field === "available_stock" || field === "unit_cost"
        ? Number(value) : asString(value);
    }
    rows.push(item);
  }
  return JSON.stringify({ rows: rows, source: "synthetic_demo" });
}

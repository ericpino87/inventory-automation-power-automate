/** PUBLIC-DEMO Office Script / Run script action #3. Reads synthetic ETA values. */
type Cell = string | number | boolean;
function main(workbook: ExcelScript.Workbook): string {
  const sheet = workbook.getWorksheet("ETA");
  if (!sheet) throw new Error("Missing ETA sheet in synthetic workbook.");
  const used = sheet.getUsedRange();
  if (!used) return JSON.stringify({ eta: [] });
  const rows = used.getValues();
  const header = rows[0].map(v => String(v ?? "").trim().toLowerCase());
  const skuAt = header.indexOf("sku");
  const etaAt = header.indexOf("eta_comment");
  if (skuAt < 0 || etaAt < 0) throw new Error("ETA sheet requires sku and eta_comment.");
  const eta: { sku: string; eta_comment: string }[] = [];
  for (let r = 1; r < rows.length; r++) {
    const sku = String(rows[r][skuAt] ?? "").trim();
    if (sku) eta.push({ sku, eta_comment: String(rows[r][etaAt] ?? "").trim() });
  }
  return JSON.stringify({ eta: eta });
}

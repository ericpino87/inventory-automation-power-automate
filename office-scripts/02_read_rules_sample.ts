/** PUBLIC-DEMO Office Script / Run script action #2. Reads synthetic rules. */
type Cell = string | number | boolean;
function main(workbook: ExcelScript.Workbook): string {
  const sheet = workbook.getWorksheet("RULES");
  if (!sheet) throw new Error("Missing RULES sheet in synthetic policy workbook.");
  const used = sheet.getUsedRange();
  if (!used) return JSON.stringify({ rules: [] });
  const rows = used.getValues();
  const headers = rows[0].map(v => String(v ?? "").trim().toLowerCase());
  const fields = ["brand", "model", "min_generation", "max_generation", "processor", "stock_type", "priority"];
  const indexes = fields.map(x => headers.indexOf(x));
  if (indexes.some(i => i < 0)) throw new Error("Policy workbook has missing headers.");
  const rules: { [key: string]: string | number }[] = [];
  for (let r = 1; r < rows.length; r++) {
    const record: { [key: string]: string | number } = {};
    for (let i = 0; i < fields.length; i++) {
      record[fields[i]] = ["min_generation", "max_generation", "priority"].includes(fields[i])
        ? Number(rows[r][indexes[i]]) : String(rows[r][indexes[i]] ?? "").trim();
    }
    if (record.brand) rules.push(record);
  }
  return JSON.stringify({ rules: rules });
}

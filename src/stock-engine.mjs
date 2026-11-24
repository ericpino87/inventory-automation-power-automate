/**
 * Synthetic inventory automation engine for a PUBLIC portfolio demo.
 * No production source code, credentials, vendor endpoints, or business data.
 */
export const STOCK_WAREHOUSES = Object.freeze([7, 8, 12, 15]);
export const INCOMING_WAREHOUSE = 5;
export const INCLUDED_WAREHOUSES = new Set([5, 7, 8, 12, 15]);
export const REVIEW_STATUS = "REVIEW_REQUIRED";

/** RFC 4180-style CSV reader supporting escaped quotes and newlines. */
export function parseCSV(input) {
  const text = input.replace(/^\uFEFF/, "");
  const lines = [];
  let field = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ""; }
    else if (ch === '\n') { row.push(field.replace(/\r$/, "")); lines.push(row); field = ""; row = []; }
    else field += ch;
  }
  if (quoted) throw new Error("Unterminated quoted CSV value");
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); lines.push(row); }
  const [header, ...values] = lines.filter(r => r.some(v => v.trim() !== ""));
  if (!header) return [];
  return values.map((cells, r) => Object.fromEntries(header.map((h, i) => [h.trim(), (cells[i] ?? "").trim()])));
}

export function toCSV(rows, columns) {
  const encode = (value) => {
    let t = String(value ?? "");
    // Prevent formula injection in CSV viewers: treat untrusted strings as text.
    if (/^[=+@]/.test(t) || (/^-/.test(t) && !/^-[\d.]+$/.test(t))) t = "'" + t;
    return /[",\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  };
  return [columns.map(encode).join(","), ...rows.map(row => columns.map(c => encode(row[c])).join(","))].join("\n") + "\n";
}

function quantity(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Invalid numeric value for ${name}`);
  return n;
}

export function aggregateERP(rawRows) {
  const aggregate = new Map();
  for (const [index, row] of rawRows.entries()) {
    const sku = String(row.sku ?? "").trim().toUpperCase();
    if (!sku) continue;
    const warehouse = Number(row.warehouse_id);
    if (!INCLUDED_WAREHOUSES.has(warehouse)) continue;
    const amount = quantity(row.available_stock, `available_stock row ${index + 2}`);
    if (!aggregate.has(sku)) {
      aggregate.set(sku, {
        sku, brand: String(row.brand ?? "OTHER").trim().toUpperCase(),
        product_name: String(row.product_name ?? "").trim(),
        description: String(row.description ?? "").trim(),
        unit_cost: quantity(row.unit_cost, `unit_cost row ${index + 2}`),
        stocks: Object.fromEntries([...INCLUDED_WAREHOUSES].map(n => [n, 0]))
      });
    }
    const item = aggregate.get(sku);
    item.stocks[warehouse] += amount;
  }
  return [...aggregate.values()];
}

export function detectCharacteristics(product) {
  const text = `${product.product_name} ${product.description}`.toUpperCase().replace(/\s+/g, " ");
  // Examples: 'F14 G7 U7', 'T14S G3 I5'. No product-code inference.
  const match = text.match(/(?:^|[^A-Z0-9])([A-Z]{1,4}\d{1,3}[A-Z]?)\s+G(?:EN)?\s*(\d{1,2})(?=$|[^0-9])/);
  const model = match?.[1] ?? "";
  const generation = match ? `G${Number(match[2])}` : "";
  const cpus = ["U7", "U5", "I7", "I5", "R7", "R5"];
  const processor = cpus.find(cpu => new RegExp(`(?:^|[^A-Z0-9])${cpu}(?=$|[^A-Z0-9])`).test(text)) ?? "";
  return { model, generation, processor, technical_family: [model, processor, generation].filter(Boolean).join(" ") };
}

export function classify(product, features, rules) {
  const generation = Number(features.generation.slice(1));
  const matching = rules
    .filter(rule => rule.brand === product.brand && rule.model === features.model &&
      generation >= rule.min_generation && generation <= rule.max_generation &&
      (rule.processor === "ANY" || rule.processor === features.processor))
    .sort((a, b) => a.priority - b.priority);
  if (matching.length > 1 && matching[0].priority === matching[1].priority && matching[0].stock_type !== matching[1].stock_type) {
    throw new Error(`Conflicting classification rules for ${product.sku}`);
  }
  if (matching.length) return { stock_type: matching[0].stock_type, classification_source: "explicit_rule" };
  if (features.model && features.generation && ["U5", "U7"].includes(features.processor)) {
    return { stock_type: "AI_ULTRA", classification_source: "generic_fallback" };
  }
  return { stock_type: REVIEW_STATUS, classification_source: "manual_review" };
}

// Portfolio-only vendor-prefix examples; no corporate SKU conventions disclosed.
export function normalizeForETA(sku) {
  return String(sku ?? "").trim().toUpperCase().replace(/^(A-|B-)/, "");
}

export function buildReport(erpRows, etaRows, policies, markup = 1.15) {
  if (!Number.isFinite(markup) || markup <= 0) throw new Error("Markup must be positive");
  const etaMap = new Map(etaRows.map(row => [normalizeForETA(row.sku), String(row.eta_comment ?? "").trim()]));
  const entries = aggregateERP(erpRows).flatMap(product => {
    const available = STOCK_WAREHOUSES.reduce((sum, w) => sum + product.stocks[w], 0);
    const incoming = product.stocks[INCOMING_WAREHOUSE];
    // Business rule: omit rows with neither on-hand nor incoming availability.
    if (available === 0 && incoming === 0) return [];
    const features = detectCharacteristics(product);
    const classification = classify(product, features, policies);
    return [{
      sku: product.sku,
      brand: product.brand,
      product_name: product.product_name,
      description: product.description,
      ...features,
      ...classification,
      stock_available: available,
      incoming_warehouse_5: incoming,
      eta_approx: etaMap.get(normalizeForETA(product.sku)) ?? "",
      unit_cost: product.unit_cost,
      quoted_price_demo: Number((product.unit_cost * markup).toFixed(2)),
    }];
  });
  const cpuRank = ["R5", "I5", "U5", "R7", "I7", "U7"];
  entries.sort((a, b) => a.brand.localeCompare(b.brand) ||
    a.model.localeCompare(b.model) ||
    cpuRank.indexOf(a.processor) - cpuRank.indexOf(b.processor) ||
    Number(a.generation.slice(1)) - Number(b.generation.slice(1)) ||
    a.unit_cost - b.unit_cost);
  return entries;
}

export const REPORT_COLUMNS = [
  "sku", "brand", "product_name", "description", "model", "generation", "processor",
  "technical_family", "stock_type", "classification_source", "stock_available",
  "incoming_warehouse_5", "eta_approx", "unit_cost", "quoted_price_demo"
];

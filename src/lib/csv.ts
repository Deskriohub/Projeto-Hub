export type CSVRow = string[];

// Minimal CSV parser supporting quoted fields, escaped quotes, commas and newlines.
export function parseCSV(text: string): CSVRow[] {
  const rows: CSVRow[] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        cur.push(field);
        field = "";
      } else if (c === "\n") {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else if (c === "\r") {
        /* skip */
      } else field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((v) => (v ?? "").trim() !== ""));
}

export function toNumber(v: string | undefined): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  // Accept BR (1.234,56) and US (1,234.56 / 1.23)
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) {
    const n2 = Number(s);
    return Number.isFinite(n2) ? n2 : null;
  }
  return n;
}

const monthMap: Record<string, number> = {
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

/** Parse a "Mês" label and return { year, month } (month 1-12), or null if not parseable. */
export function parseMesLabel(s: string): { year: number; month: number } | null {
  const lower = (s || "").toLowerCase().trim();
  if (!lower) return null;
  const slash = lower.match(/(\d{1,2})[\/\-](\d{4})/);
  if (slash) return { month: parseInt(slash[1]), year: parseInt(slash[2]) };
  const dash = lower.match(/(\d{4})[\/\-](\d{1,2})/);
  if (dash) return { year: parseInt(dash[1]), month: parseInt(dash[2]) };
  const yearMatch = lower.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 0;
  let month = 0;
  for (const [name, num] of Object.entries(monthMap)) {
    if (lower.includes(name)) {
      month = num;
      break;
    }
  }
  if (!year || !month) return null;
  return { year, month };
}

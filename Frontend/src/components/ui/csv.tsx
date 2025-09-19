// src/utils/csv.ts
export function toCSV(rows: Record<string, any>[], headers?: string[]) {
  if (!rows || rows.length === 0) return "";

  // If headers not provided, derive from keys of first row (in stable order)
  const keys = headers && headers.length ? headers : Object.keys(rows[0]);

  const escape = (val: any) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    // Escape double quotes by doubling them, wrap field in quotes if contains comma/newline/quote
    const needsQuotes = /[,"\n\r]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const headerLine = keys.join(",");
  const lines = rows.map((row) => keys.map((k) => escape(row[k])).join(","));
  return [headerLine, ...lines].join("\r\n");
}

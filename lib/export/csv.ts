export type CsvValue = string | number | boolean | null | undefined;

function escapeCsvValue(value: CsvValue) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value).replaceAll('"', '""');

  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
}

export function stringifyCsv(rows: Array<Record<string, CsvValue>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
  ];

  return lines.join("\n");
}

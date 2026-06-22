export type ImportedTransaction = {
  occurred_on: string;
  description: string;
  amount: number;
  kind: "income" | "expense";
  categoryName?: string;
  accountName?: string;
};

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);

  return rows;
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cell(row: Record<string, string>, names: string[]) {
  for (const name of names) {
    const value = row[name];
    if (value) return value;
  }
  return "";
}

function parseAmount(value: string) {
  const cleaned = value.replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : 0;
}

function parseDate(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const month = match[1].padStart(2, "0");
    const day = match[2].padStart(2, "0");
    const rawYear = match[3];
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year}-${month}-${day}`;
  }

  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export function parseTransactionCsv(csv: string): ImportedTransaction[] {
  const rows = parseCsvRows(csv);
  const [headers, ...body] = rows;
  if (!headers?.length) return [];

  const normalizedHeaders = headers.map(normalizeHeader);

  return body
    .map((values) => {
      const row = Object.fromEntries(
        normalizedHeaders.map((header, index) => [header, values[index] ?? ""])
      );
      const rawAmount =
        parseAmount(cell(row, ["amount", "transactionamount"])) ||
        parseAmount(cell(row, ["credit"])) ||
        -Math.abs(parseAmount(cell(row, ["debit", "withdrawal"])));
      const rawType = cell(row, ["type", "kind", "transactiontype"]).toLowerCase();
      const kind: "income" | "expense" = rawType.includes("income") || rawType.includes("credit") || rawAmount > 0
        ? "income"
        : "expense";
      const amount = Math.abs(rawAmount);

      return {
        occurred_on: parseDate(cell(row, ["date", "posteddate", "transactiondate"])),
        description: cell(row, ["description", "name", "merchant", "memo", "payee"]) || "Imported transaction",
        amount,
        kind,
        categoryName: cell(row, ["category"]),
        accountName: cell(row, ["account", "accountname"])
      };
    })
    .filter((transaction) => transaction.amount > 0);
}

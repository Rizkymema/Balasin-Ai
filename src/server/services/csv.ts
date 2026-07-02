function detectDelimiter(headerLine: string) {
  const candidates = [",", ";", "\t"];
  return candidates
    .map((delimiter) => ({
      delimiter,
      count: headerLine.split(delimiter).length,
    }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter ?? ",";
}

function parseDelimitedRows(text: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

export function parseCsvBuffer(buffer: Buffer) {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const rows = parseDelimitedRows(text, delimiter);
  const [headers, ...dataRows] = rows;

  if (!headers || headers.length === 0) {
    return [];
  }

  return dataRows.map((row) =>
    headers.reduce<Record<string, string>>((record, header, index) => {
      const key = header.trim() || `column_${index + 1}`;
      record[key] = row[index]?.trim() ?? "";
      return record;
    }, {}),
  );
}

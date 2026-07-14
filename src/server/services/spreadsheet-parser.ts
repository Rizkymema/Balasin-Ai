import ExcelJS from "exceljs";

import { parseCsvBuffer } from "@/server/services/csv";

export type SpreadsheetSheet = {
  name: string;
  rows: Array<Record<string, unknown>>;
};

function cellValueToText(value: ExcelJS.CellValue): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(cellValueToText).filter(Boolean).join(" ");
  }

  if ("richText" in value) {
    return value.richText.map((item) => item.text).join("").trim();
  }

  if ("result" in value) {
    return cellValueToText(value.result as ExcelJS.CellValue);
  }

  if ("text" in value) {
    return String(value.text ?? "").trim();
  }

  return String(value).trim();
}

function getWorksheetRows(worksheet: ExcelJS.Worksheet): Array<Record<string, unknown>> {
  const headerRow = worksheet.getRow(1);
  const headers = new Map<number, string>();

  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const header = cellValueToText(cell.value);
    if (header) {
      headers.set(columnNumber, header);
    }
  });

  if (headers.size === 0) {
    return [];
  }

  const rows: Array<Record<string, unknown>> = [];

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const worksheetRow = worksheet.getRow(rowNumber);
    const row: Record<string, unknown> = {};

    for (const [columnNumber, header] of headers) {
      const value = cellValueToText(worksheetRow.getCell(columnNumber).value);
      if (value) {
        row[header] = value;
      }
    }

    if (Object.keys(row).length > 0) {
      rows.push(row);
    }
  }

  return rows;
}

export async function parseSpreadsheetBuffer(
  buffer: Buffer,
  fileName: string,
): Promise<SpreadsheetSheet[]> {
  if (fileName.toLowerCase().endsWith(".csv")) {
    return [{ name: "Sheet 1", rows: parseCsvBuffer(buffer) }];
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  return workbook.worksheets
    .map((worksheet) => ({
      name: worksheet.name.trim() || "Sheet",
      rows: getWorksheetRows(worksheet),
    }))
    .filter((sheet) => sheet.rows.length > 0);
}

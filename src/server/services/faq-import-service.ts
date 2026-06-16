import { randomUUID } from "node:crypto";

import * as XLSX from "xlsx";

import type { FAQItem } from "@/types/dashboard-config";

type ParsedFaqDraft = {
  question: string;
  answer: string;
};

const QUESTION_KEYS = ["question", "pertanyaan", "q", "faq", "ask"];
const ANSWER_KEYS = ["answer", "jawaban", "a", "response", "balasan", "reply"];

function normalizeText(value: unknown) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value: string) {
  return normalizeText(value).toLowerCase();
}

function findMatchingKey(
  row: Record<string, unknown>,
  candidates: string[],
) {
  const entries = Object.keys(row).map((key) => ({
    original: key,
    normalized: normalizeKey(key),
  }));

  return (
    entries.find((entry) => candidates.includes(entry.normalized))?.original ??
    entries.find((entry) =>
      candidates.some((candidate) => entry.normalized.includes(candidate)),
    )?.original ??
    null
  );
}

function finalizeFaqs(items: ParsedFaqDraft[]) {
  const seenQuestions = new Set<string>();

  return items
    .map((item) => ({
      question: normalizeText(item.question),
      answer: normalizeText(item.answer),
    }))
    .filter((item) => item.question && item.answer)
    .filter((item) => {
      const key = normalizeKey(item.question);
      if (seenQuestions.has(key)) {
        return false;
      }

      seenQuestions.add(key);
      return true;
    })
    .map(
      (item) =>
        ({
          id: randomUUID(),
          question: item.question,
          answer: item.answer,
        }) satisfies FAQItem,
    );
}

function parseRowBasedFaqs(rows: Array<Record<string, unknown>>) {
  const drafts: ParsedFaqDraft[] = [];

  for (const row of rows) {
    const questionKey = findMatchingKey(row, QUESTION_KEYS);
    const answerKey = findMatchingKey(row, ANSWER_KEYS);

    if (!questionKey || !answerKey) {
      continue;
    }

    drafts.push({
      question: normalizeText(row[questionKey]),
      answer: normalizeText(row[answerKey]),
    });
  }

  return finalizeFaqs(drafts);
}

function parseSpreadsheetLikeFile(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const drafts: ParsedFaqDraft[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    for (const item of parseRowBasedFaqs(rows)) {
      drafts.push({
        question: item.question,
        answer: item.answer,
      });
    }
  }

  return finalizeFaqs(drafts);
}

function parseJsonFile(buffer: Buffer) {
  const parsed = JSON.parse(buffer.toString("utf8")) as unknown;

  if (Array.isArray(parsed)) {
    return parseRowBasedFaqs(parsed as Array<Record<string, unknown>>);
  }

  if (parsed && typeof parsed === "object") {
    const source = parsed as {
      faqs?: Array<Record<string, unknown>>;
      items?: Array<Record<string, unknown>>;
      data?: Array<Record<string, unknown>>;
    };

    if (Array.isArray(source.faqs)) {
      return parseRowBasedFaqs(source.faqs);
    }
    if (Array.isArray(source.items)) {
      return parseRowBasedFaqs(source.items);
    }
    if (Array.isArray(source.data)) {
      return parseRowBasedFaqs(source.data);
    }
  }

  return [];
}

function parseLabeledFaqBlocks(text: string) {
  const normalized = text.replace(/\r/g, "").trim();
  if (!normalized) {
    return [];
  }

  const drafts: ParsedFaqDraft[] = [];
  const blocks = normalized.split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let question = "";
    let answer = "";

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        lower.startsWith("q:") ||
        lower.startsWith("question:") ||
        lower.startsWith("pertanyaan:")
      ) {
        question = line.split(":").slice(1).join(":").trim();
      }

      if (
        lower.startsWith("a:") ||
        lower.startsWith("answer:") ||
        lower.startsWith("jawaban:")
      ) {
        answer = line.split(":").slice(1).join(":").trim();
      }
    }

    if (question && answer) {
      drafts.push({ question, answer });
    }
  }

  return finalizeFaqs(drafts);
}

function parseMarkdownTable(text: string) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const tableLines = lines.filter((line) => line.startsWith("|") && line.endsWith("|"));
  if (tableLines.length < 3) {
    return [];
  }

  const headerCells = tableLines[0]
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);
  const questionIndex = headerCells.findIndex((cell) =>
    QUESTION_KEYS.some((key) => normalizeKey(cell).includes(key)),
  );
  const answerIndex = headerCells.findIndex((cell) =>
    ANSWER_KEYS.some((key) => normalizeKey(cell).includes(key)),
  );

  if (questionIndex < 0 || answerIndex < 0) {
    return [];
  }

  const drafts = tableLines.slice(2).map((line) => {
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);

    return {
      question: cells[questionIndex] ?? "",
      answer: cells[answerIndex] ?? "",
    };
  });

  return finalizeFaqs(drafts);
}

function parsePlainTextFile(buffer: Buffer) {
  const text = buffer.toString("utf8");

  const markdownTableFaqs = parseMarkdownTable(text);
  if (markdownTableFaqs.length > 0) {
    return markdownTableFaqs;
  }

  const labeledFaqs = parseLabeledFaqBlocks(text);
  if (labeledFaqs.length > 0) {
    return labeledFaqs;
  }

  return [];
}

export async function parseFaqImportFile(params: {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const lowerName = params.fileName.toLowerCase();

  if (
    lowerName.endsWith(".xlsx") ||
    lowerName.endsWith(".xls") ||
    lowerName.endsWith(".csv")
  ) {
    return parseSpreadsheetLikeFile(params.buffer);
  }

  if (params.mimeType === "application/json" || lowerName.endsWith(".json")) {
    return parseJsonFile(params.buffer);
  }

  if (
    params.mimeType.startsWith("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md")
  ) {
    return parsePlainTextFile(params.buffer);
  }

  return [];
}

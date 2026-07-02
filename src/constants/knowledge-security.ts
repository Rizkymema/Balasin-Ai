export const KNOWLEDGE_DOCUMENT_MAX_BYTES = 8 * 1024 * 1024;
export const KNOWLEDGE_FAQ_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const KNOWLEDGE_TEXT_MAX_CHARS = 200_000;
export const KNOWLEDGE_SOURCE_MAX_URLS = 10;
export const KNOWLEDGE_WEBSITE_MAX_BYTES = 1 * 1024 * 1024;
export const KNOWLEDGE_SHEET_MAX_BYTES = 4 * 1024 * 1024;

export const KNOWLEDGE_DOCUMENT_ACCEPT =
  ".pdf,.docx,.csv,.txt,.md,.json,.html";

export const KNOWLEDGE_DOCUMENT_EXTENSIONS = new Set([
  ".pdf",
  ".docx",
  ".csv",
  ".txt",
  ".md",
  ".json",
  ".html",
]);

export const KNOWLEDGE_FAQ_IMPORT_EXTENSIONS = new Set([
  ".csv",
  ".txt",
  ".md",
  ".json",
]);

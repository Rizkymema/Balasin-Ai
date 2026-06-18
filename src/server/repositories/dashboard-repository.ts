import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

import { resolveAppUrl } from "@/lib/app-url";
import { defaultDashboardConfig, mergeDashboardConfig } from "@/lib/dashboard-config";
import {
  defaultDashboardOperations,
  normalizeDashboardOperations,
} from "@/lib/dashboard-operations";
import { resolveDashboardPublicAppUrl } from "@/lib/runtime-url";
import {
  isBlobStateEnabled,
  readPrivateJsonBlob,
  writePrivateJsonBlob,
} from "@/server/blob-state";
import { isSupabaseEnabled } from "@/server/supabase";
import {
  getUploadDirectory,
  deleteJsonRowAsync,
  listJsonRowsAsync,
  readAppConfigRecord,
  replaceJsonRowsAsync,
  replaceKnowledgeChunkRowsAsync,
  upsertJsonRowAsync,
  writeAppConfigRecord,
  listKnowledgeChunkRowsAsync,
} from "@/server/db";
import type {
  DashboardConfig,
  FAQItem,
  KnowledgeDocument,
  KnowledgeSourceType,
} from "@/types/dashboard-config";
import type {
  BroadcastRecord,
  BookingRecord,
  ConversationRecord,
  CrmDealEntry,
  CrmTaskEntry,
  CustomerRecord,
  DashboardOperationsData,
  ProductRecord,
  ServiceRecord,
  TicketRecord,
} from "@/types/operations";

export type KnowledgeChunk = {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata: {
    sourceName: string;
    sourceType?: KnowledgeSourceType;
    sourceUrl?: string;
    question?: string;
    answer?: string;
  };
  createdAt: string;
};

const DASHBOARD_CONFIG_BLOB_PATH = "state/dashboard-config.json";
const DASHBOARD_CONFIG_BACKUP_BLOB_PATH = "state/dashboard-config.backup.json";
const DASHBOARD_OPERATIONS_BLOB_PATH = "state/dashboard-operations.json";
const KNOWLEDGE_CHUNKS_BLOB_PATH = "state/knowledge-chunks.json";
const QUESTION_KEYS = ["question", "pertanyaan", "q", "ask", "faq"];
const ANSWER_KEYS = ["answer", "jawaban", "a", "response", "balasan"];

function shouldUseBlobState() {
  return isBlobStateEnabled() && !isSupabaseEnabled();
}

function finalizeDashboardConfig(
  base: DashboardConfig,
  faqs: FAQItem[],
  documents: KnowledgeDocument[],
) {
  const runtimePublicAppUrl = resolveDashboardPublicAppUrl(
    base.runtime.publicAppUrl,
    resolveAppUrl(),
  );
  const whatsappWebhookUrl = `${runtimePublicAppUrl}/api/webhooks/whatsapp`;

  return {
    ...base,
    runtime: {
      ...base.runtime,
      publicAppUrl: runtimePublicAppUrl,
    },
    knowledgeBase: {
      ...base.knowledgeBase,
      faqs,
      documents,
    },
    channels: {
      ...base.channels,
      whatsapp: {
        ...base.channels.whatsapp,
        webhookUrl: whatsappWebhookUrl,
      },
    },
  };
}

function keepExistingString(existing: string, incoming: string) {
  return incoming.trim() ? incoming : existing;
}

function mergePersistedDashboardConfig(
  existing: DashboardConfig,
  incoming: DashboardConfig,
) {
  return {
    ...incoming,
    runtime: {
      ...incoming.runtime,
      workerSecret: keepExistingString(
        existing.runtime.workerSecret,
        incoming.runtime.workerSecret,
      ),
    },
    aiProvider: {
      ...incoming.aiProvider,
      apiKey: keepExistingString(existing.aiProvider.apiKey, incoming.aiProvider.apiKey),
    },
    channels: {
      ...incoming.channels,
      whatsapp: {
        ...incoming.channels.whatsapp,
        businessLabel: keepExistingString(
          existing.channels.whatsapp.businessLabel,
          incoming.channels.whatsapp.businessLabel,
        ),
        phoneNumberId: keepExistingString(
          existing.channels.whatsapp.phoneNumberId,
          incoming.channels.whatsapp.phoneNumberId,
        ),
        accessToken: keepExistingString(
          existing.channels.whatsapp.accessToken,
          incoming.channels.whatsapp.accessToken,
        ),
        verifyToken: keepExistingString(
          existing.channels.whatsapp.verifyToken,
          incoming.channels.whatsapp.verifyToken,
        ),
      },
      instagram: {
        ...incoming.channels.instagram,
        username: keepExistingString(
          existing.channels.instagram.username,
          incoming.channels.instagram.username,
        ),
        accountId: keepExistingString(
          existing.channels.instagram.accountId,
          incoming.channels.instagram.accountId,
        ),
        accessToken: keepExistingString(
          existing.channels.instagram.accessToken,
          incoming.channels.instagram.accessToken,
        ),
        verifyToken: keepExistingString(
          existing.channels.instagram.verifyToken,
          incoming.channels.instagram.verifyToken,
        ),
      },
    },
  } satisfies DashboardConfig;
}

export async function getDashboardConfigRecord(): Promise<DashboardConfig> {
  if (shouldUseBlobState()) {
    const stored =
      (await readPrivateJsonBlob<Partial<DashboardConfig>>(
        DASHBOARD_CONFIG_BLOB_PATH,
      )) ??
      (await readPrivateJsonBlob<Partial<DashboardConfig>>(
        DASHBOARD_CONFIG_BACKUP_BLOB_PATH,
      )) ??
      {};
    const base = mergeDashboardConfig(defaultDashboardConfig, stored);

    return finalizeDashboardConfig(
      base,
      base.knowledgeBase.faqs,
      base.knowledgeBase.documents,
    );
  }

  const base = mergeDashboardConfig(
    defaultDashboardConfig,
    (await readAppConfigRecord<Partial<DashboardConfig>>()) ?? undefined,
  );
  return finalizeDashboardConfig(
    base,
    await listJsonRowsAsync<FAQItem>("knowledge_faqs"),
    await listJsonRowsAsync<KnowledgeDocument>("knowledge_documents"),
  );
}

export async function saveDashboardConfigRecord(config: DashboardConfig) {
  if (shouldUseBlobState()) {
    const current = await getDashboardConfigRecord();
    const nextConfig = mergePersistedDashboardConfig(current, config);
    await writePrivateJsonBlob(DASHBOARD_CONFIG_BLOB_PATH, nextConfig);
    await writePrivateJsonBlob(DASHBOARD_CONFIG_BACKUP_BLOB_PATH, nextConfig);
    return;
  }

  await writeAppConfigRecord(config);
  await replaceJsonRowsAsync("knowledge_faqs", config.knowledgeBase.faqs);
  await replaceJsonRowsAsync(
    "knowledge_documents",
    config.knowledgeBase.documents,
  );
}

export async function getDashboardOperationsRecord(): Promise<DashboardOperationsData> {
  if (shouldUseBlobState()) {
    const stored = await readPrivateJsonBlob<DashboardOperationsData>(
      DASHBOARD_OPERATIONS_BLOB_PATH,
    );
    return normalizeDashboardOperations(stored ?? defaultDashboardOperations);
  }

  return {
    conversations: await listJsonRowsAsync<ConversationRecord>("conversations"),
    customers: await listJsonRowsAsync<CustomerRecord>("customers"),
    bookings: await listJsonRowsAsync<BookingRecord>("bookings"),
    tickets: await listJsonRowsAsync<TicketRecord>("tickets"),
    products: await listJsonRowsAsync<ProductRecord>("products"),
    services: await listJsonRowsAsync<ServiceRecord>("services"),
    broadcasts: await listJsonRowsAsync<BroadcastRecord>("broadcasts"),
    crmDeals: await listJsonRowsAsync<CrmDealEntry>("crm_deals"),
    crmTasks: await listJsonRowsAsync<CrmTaskEntry>("crm_tasks"),
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function saveDashboardOperationsRecord(data: DashboardOperationsData) {
  if (shouldUseBlobState()) {
    await writePrivateJsonBlob(DASHBOARD_OPERATIONS_BLOB_PATH, {
      ...data,
      lastUpdatedAt: new Date().toISOString(),
    });
    return;
  }

  await replaceJsonRowsAsync("conversations", data.conversations);
  await replaceJsonRowsAsync("customers", data.customers);
  await replaceJsonRowsAsync("bookings", data.bookings);
  await replaceJsonRowsAsync("tickets", data.tickets);
  await replaceJsonRowsAsync("products", data.products);
  await replaceJsonRowsAsync("services", data.services);
  await replaceJsonRowsAsync("broadcasts", data.broadcasts);
  await replaceJsonRowsAsync("crm_deals", data.crmDeals);
  await replaceJsonRowsAsync("crm_tasks", data.crmTasks);
}

function normalizeSpreadsheetKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findRowValue(
  row: Record<string, unknown>,
  candidates: string[],
): string | null {
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeSpreadsheetKey(key);
    if (!candidates.some((candidate) => normalizedKey === candidate)) {
      continue;
    }

    const normalizedValue =
      typeof value === "string"
        ? value.trim()
        : value == null
          ? ""
          : String(value).trim();

    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return null;
}

function createTextChunk(params: {
  documentId: string;
  chunkIndex: number;
  content: string;
  sourceName: string;
  sourceType?: KnowledgeSourceType;
  sourceUrl?: string;
  question?: string;
  answer?: string;
}) {
  return {
    id: randomUUID(),
    documentId: params.documentId,
    chunkIndex: params.chunkIndex,
    content: params.content,
    metadata: {
      sourceName: params.sourceName,
      sourceType: params.sourceType,
      sourceUrl: params.sourceUrl,
      question: params.question,
      answer: params.answer,
    },
    createdAt: new Date().toISOString(),
  } satisfies KnowledgeChunk;
}

function buildSpreadsheetChunks(params: {
  rows: Array<Record<string, unknown>>;
  documentId: string;
  sourceName: string;
  sourceType?: KnowledgeSourceType;
  sourceUrl?: string;
}) {
  const chunks: KnowledgeChunk[] = [];

  for (const row of params.rows) {
    const statusVal = findRowValue(row, ["status"]);
    if (statusVal) {
      const lowerStatus = statusVal.toLowerCase().trim();
      if (
        lowerStatus === "nonaktif" ||
        lowerStatus === "non-active" ||
        lowerStatus === "inactive" ||
        lowerStatus === "non aktif"
      ) {
        continue;
      }
    }

    const question = findRowValue(row, QUESTION_KEYS);

    const answer = findRowValue(row, ANSWER_KEYS);

    if (question && answer) {
      chunks.push(
        createTextChunk({
          documentId: params.documentId,
          chunkIndex: chunks.length,
          content: `Pertanyaan: ${question}\nJawaban: ${answer}`,
          sourceName: params.sourceName,
          sourceType: params.sourceType,
          sourceUrl: params.sourceUrl,
          question,
          answer,
        }),
      );
      continue;
    }

    const parts = Object.entries(row)
      .map(([key, value]) => {
        const normalizedValue =
          typeof value === "string"
            ? value.trim()
            : value == null
              ? ""
              : String(value).trim();

        return normalizedValue ? `${key}: ${normalizedValue}` : "";
      })
      .filter(Boolean);

    if (parts.length === 0) {
      continue;
    }

    chunks.push(
      createTextChunk({
        documentId: params.documentId,
        chunkIndex: chunks.length,
        content: parts.join(" | "),
        sourceName: params.sourceName,
        sourceType: params.sourceType,
        sourceUrl: params.sourceUrl,
      }),
    );
  }

  return chunks;
}

function parseSpreadsheetBuffer(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const rows: Array<Record<string, unknown>> = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
    rows.push(...sheetRows);
  }

  return rows;
}

async function readAllKnowledgeChunks() {
  if (shouldUseBlobState()) {
    return (
      (await readPrivateJsonBlob<KnowledgeChunk[]>(KNOWLEDGE_CHUNKS_BLOB_PATH)) ?? []
    );
  }

  const rows = await listKnowledgeChunkRowsAsync();

  return rows.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    chunkIndex: row.chunk_index,
    content: row.content,
    metadata:
      typeof row.metadata_json === "string"
        ? (JSON.parse(row.metadata_json) as KnowledgeChunk["metadata"])
        : (row.metadata_json as KnowledgeChunk["metadata"]),
    createdAt: row.created_at,
  }));
}

async function writeAllKnowledgeChunks(chunks: KnowledgeChunk[]) {
  if (shouldUseBlobState()) {
    await writePrivateJsonBlob(KNOWLEDGE_CHUNKS_BLOB_PATH, chunks);
    return;
  }

  await replaceKnowledgeChunkRowsAsync(
    chunks.map((item) => ({
      id: item.id,
      document_id: item.documentId,
      chunk_index: item.chunkIndex,
      content: item.content,
      metadata_json: item.metadata,
      created_at: item.createdAt,
    })),
  );
}

async function replaceKnowledgeChunksForDocument(
  documentId: string,
  nextChunks: KnowledgeChunk[],
) {
  const chunks = await readAllKnowledgeChunks();
  const filtered = chunks.filter((chunk) => chunk.documentId !== documentId);
  await writeAllKnowledgeChunks([...nextChunks, ...filtered]);
}

async function deleteKnowledgeChunksForDocument(documentId: string) {
  const chunks = await readAllKnowledgeChunks();
  await writeAllKnowledgeChunks(
    chunks.filter((chunk) => chunk.documentId !== documentId),
  );
}

async function upsertKnowledgeDocumentRecord(document: KnowledgeDocument) {
  if (shouldUseBlobState()) {
    const currentConfig = await getDashboardConfigRecord();
    const nextDocuments = currentConfig.knowledgeBase.documents.some(
      (item) => item.id === document.id,
    )
      ? currentConfig.knowledgeBase.documents.map((item) =>
          item.id === document.id ? document : item,
        )
      : [document, ...currentConfig.knowledgeBase.documents];

    await saveDashboardConfigRecord({
      ...currentConfig,
      knowledgeBase: {
        ...currentConfig.knowledgeBase,
        documents: nextDocuments,
      },
    });
    return;
  }

  await upsertJsonRowAsync("knowledge_documents", document);
}

function chunkText(
  content: string,
  documentId: string,
  sourceName: string,
  options?: {
    sourceType?: KnowledgeSourceType;
    sourceUrl?: string;
  },
) {
  const normalized = content.replace(/\r/g, "").trim();
  if (!normalized) {
    return [] as KnowledgeChunk[];
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  return paragraphs.map((paragraph, index) =>
    createTextChunk({
      documentId,
      chunkIndex: index,
      content: paragraph,
      sourceName,
      sourceType: options?.sourceType,
      sourceUrl: options?.sourceUrl,
    }),
  );
}

export async function getKnowledgeChunks(searchQuery?: string) {
  const chunks = await readAllKnowledgeChunks();
  if (!searchQuery?.trim()) {
    return chunks;
  }

  const query = searchQuery.toLowerCase();
  return chunks.filter((chunk) => chunk.content.toLowerCase().includes(query));
}

async function extractDocumentText(params: {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const lowerName = params.fileName.toLowerCase();

  if (
    params.mimeType.startsWith("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".json") ||
    lowerName.endsWith(".html")
  ) {
    return params.buffer.toString("utf8");
  }

  if (
    lowerName.endsWith(".xlsx") ||
    lowerName.endsWith(".xls") ||
    lowerName.endsWith(".csv")
  ) {
    const rows = parseSpreadsheetBuffer(params.buffer);
    return rows
      .map((row) =>
        Object.entries(row)
          .map(([key, value]) => {
            const normalizedValue =
              typeof value === "string"
                ? value.trim()
                : value == null
                  ? ""
                  : String(value).trim();

            return normalizedValue ? `${key}: ${normalizedValue}` : "";
          })
          .filter(Boolean)
          .join(" | "),
      )
      .filter(Boolean)
      .join("\n");
  }

  if (
    params.mimeType === "application/pdf" ||
    lowerName.endsWith(".pdf")
  ) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: params.buffer });

    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (
    params.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    const { default: mammoth } = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: params.buffer });
    return result.value.trim();
  }

  return `Dokumen ${params.fileName} tersimpan. Ekstraksi text otomatis belum tersedia untuk tipe ini, tetapi file dan metadata sudah masuk pipeline ingestion.`;
}

async function buildKnowledgeChunksFromBuffer(params: {
  documentId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  sourceType?: KnowledgeSourceType;
  sourceUrl?: string;
}) {
  const lowerName = params.fileName.toLowerCase();

  if (
    lowerName.endsWith(".xlsx") ||
    lowerName.endsWith(".xls") ||
    lowerName.endsWith(".csv")
  ) {
    const rows = parseSpreadsheetBuffer(params.buffer);
    const chunks = buildSpreadsheetChunks({
      rows,
      documentId: params.documentId,
      sourceName: params.fileName,
      sourceType: params.sourceType,
      sourceUrl: params.sourceUrl,
    });

    return {
      chunks,
      extractedText:
        chunks.map((item) => item.content).join("\n") ||
        (await extractDocumentText(params)),
    };
  }

  const extractedText = await extractDocumentText(params);
  const chunks = chunkText(extractedText, params.documentId, params.fileName, {
    sourceType: params.sourceType,
    sourceUrl: params.sourceUrl,
  });

  return {
    chunks,
    extractedText,
  };
}

export async function ingestKnowledgeTextSource(params: {
  id?: string;
  name: string;
  content: string;
  sourceType: KnowledgeSourceType;
  sourceUrl?: string;
}) {
  const documentId =
    params.id ??
    `${params.sourceType}-${createHash("sha1")
      .update(params.sourceUrl ?? params.name)
      .digest("hex")
      .slice(0, 16)}`;

  const document: KnowledgeDocument = {
    id: documentId,
    name: params.name,
    size: `${Math.max(Buffer.byteLength(params.content, "utf8") / 1024, 1).toFixed(1)} KB`,
    status: "ready",
    progress: 100,
    sourceType: params.sourceType,
    sourceUrl: params.sourceUrl,
    syncedAt: new Date().toISOString(),
  };

  const chunks = chunkText(params.content, documentId, params.name, {
    sourceType: params.sourceType,
    sourceUrl: params.sourceUrl,
  });

  await upsertKnowledgeDocumentRecord(document);
  await replaceKnowledgeChunksForDocument(documentId, chunks);

  return {
    document,
    chunks,
    extractedText: params.content,
  };
}

export async function ingestKnowledgeDocument(params: {
  id?: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  sourceType?: KnowledgeSourceType;
  sourceUrl?: string;
}) {
  const documentId = params.id ?? randomUUID();
  const uploadDir = getUploadDirectory();
  const normalizedName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const savedPath = join(uploadDir, `${documentId}-${normalizedName}`);
  writeFileSync(savedPath, params.buffer);

  const { chunks, extractedText } = await buildKnowledgeChunksFromBuffer({
    documentId,
    fileName: params.fileName,
    mimeType: params.mimeType,
    buffer: params.buffer,
    sourceType: params.sourceType ?? "upload",
    sourceUrl: params.sourceUrl,
  });

  const document: KnowledgeDocument = {
    id: documentId,
    name: params.fileName,
    size: `${Math.max(params.buffer.byteLength / 1024, 1).toFixed(1)} KB`,
    status: "ready",
    progress: 100,
    sourceType: params.sourceType ?? "upload",
    sourceUrl: params.sourceUrl,
    syncedAt: new Date().toISOString(),
  };

  await upsertKnowledgeDocumentRecord(document);
  await replaceKnowledgeChunksForDocument(documentId, chunks);

  return {
    document,
    chunks,
    savedPath,
    extractedText,
  };
}

export async function deleteKnowledgeDocument(documentId: string) {
  const documents = shouldUseBlobState()
    ? (await getDashboardConfigRecord()).knowledgeBase.documents
    : await listJsonRowsAsync<KnowledgeDocument>("knowledge_documents");
  const target = documents.find((item) => item.id === documentId);
  if (target) {
    const filePath = join(getUploadDirectory(), `${documentId}-${target.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  if (shouldUseBlobState()) {
    const currentConfig = await getDashboardConfigRecord();
    await saveDashboardConfigRecord({
      ...currentConfig,
      knowledgeBase: {
        ...currentConfig.knowledgeBase,
        documents: currentConfig.knowledgeBase.documents.filter(
          (item) => item.id !== documentId,
        ),
      },
    });
  } else {
    await deleteJsonRowAsync("knowledge_documents", documentId);
  }

  await deleteKnowledgeChunksForDocument(documentId);
}

export async function readKnowledgeDocumentContent(documentId: string) {
  const documents = shouldUseBlobState()
    ? (await getDashboardConfigRecord()).knowledgeBase.documents
    : await listJsonRowsAsync<KnowledgeDocument>("knowledge_documents");
  const target = documents.find((item) => item.id === documentId);
  if (!target) {
    return null;
  }

  const allChunks = await getKnowledgeChunks();
  const chunks = allChunks
    .filter((item) => item.documentId === documentId)
    .sort((left, right) => left.chunkIndex - right.chunkIndex);

  if (chunks.length > 0) {
    return {
      document: target,
      content: chunks.map((item) => item.content).join("\n\n"),
    };
  }

  const uploadDir = getUploadDirectory();
  const filePath = join(
    uploadDir,
    `${documentId}-${target.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
  );

  try {
    return {
      document: target,
      content: readFileSync(filePath, "utf8"),
    };
  } catch {
    return {
      document: target,
      content: "",
    };
  }
}

export async function resetOperationsToDefault() {
  await saveDashboardOperationsRecord(defaultDashboardOperations);
}

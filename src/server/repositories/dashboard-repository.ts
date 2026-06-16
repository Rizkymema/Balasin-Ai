import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
import {
  deleteJsonRow,
  getDatabase,
  getUploadDirectory,
  listJsonRows,
  replaceJsonRows,
  upsertJsonRow,
} from "@/server/db";
import type { DashboardConfig, FAQItem, KnowledgeDocument } from "@/types/dashboard-config";
import type {
  BroadcastRecord,
  BookingRecord,
  ConversationRecord,
  CustomerRecord,
  DashboardOperationsData,
  ProductRecord,
  ServiceRecord,
  TicketRecord,
} from "@/types/operations";

type KnowledgeChunk = {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata: {
    sourceName: string;
  };
  createdAt: string;
};

const DASHBOARD_CONFIG_BLOB_PATH = "state/dashboard-config.json";
const DASHBOARD_OPERATIONS_BLOB_PATH = "state/dashboard-operations.json";

function readLocalBaseConfig() {
  const database = getDatabase();
  const row = database
    .prepare("SELECT data_json FROM app_config WHERE id = 1")
    .get() as { data_json: string } | undefined;

  if (!row) {
    return defaultDashboardConfig;
  }

  return mergeDashboardConfig(
    defaultDashboardConfig,
    JSON.parse(row.data_json) as Partial<DashboardConfig>,
  );
}

function saveLocalBaseConfig(config: DashboardConfig) {
  const database = getDatabase();
  database
    .prepare("UPDATE app_config SET data_json = ?, updated_at = ? WHERE id = 1")
    .run(JSON.stringify(config), new Date().toISOString());
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

export async function getDashboardConfigRecord(): Promise<DashboardConfig> {
  if (isBlobStateEnabled()) {
    const stored =
      (await readPrivateJsonBlob<Partial<DashboardConfig>>(
        DASHBOARD_CONFIG_BLOB_PATH,
      )) ?? {};
    const base = mergeDashboardConfig(defaultDashboardConfig, stored);

    return finalizeDashboardConfig(
      base,
      base.knowledgeBase.faqs,
      base.knowledgeBase.documents,
    );
  }

  const base = readLocalBaseConfig();
  return finalizeDashboardConfig(
    base,
    listJsonRows<FAQItem>("knowledge_faqs"),
    listJsonRows<KnowledgeDocument>("knowledge_documents"),
  );
}

export async function saveDashboardConfigRecord(config: DashboardConfig) {
  if (isBlobStateEnabled()) {
    await writePrivateJsonBlob(DASHBOARD_CONFIG_BLOB_PATH, config);
    return;
  }

  saveLocalBaseConfig(config);
  replaceJsonRows("knowledge_faqs", config.knowledgeBase.faqs);
  replaceJsonRows("knowledge_documents", config.knowledgeBase.documents);
}

export async function getDashboardOperationsRecord(): Promise<DashboardOperationsData> {
  if (isBlobStateEnabled()) {
    const stored = await readPrivateJsonBlob<DashboardOperationsData>(
      DASHBOARD_OPERATIONS_BLOB_PATH,
    );
    return normalizeDashboardOperations(stored ?? defaultDashboardOperations);
  }

  return {
    conversations: listJsonRows<ConversationRecord>("conversations"),
    customers: listJsonRows<CustomerRecord>("customers"),
    bookings: listJsonRows<BookingRecord>("bookings"),
    tickets: listJsonRows<TicketRecord>("tickets"),
    products: listJsonRows<ProductRecord>("products"),
    services: listJsonRows<ServiceRecord>("services"),
    broadcasts: listJsonRows<BroadcastRecord>("broadcasts"),
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function saveDashboardOperationsRecord(data: DashboardOperationsData) {
  if (isBlobStateEnabled()) {
    await writePrivateJsonBlob(DASHBOARD_OPERATIONS_BLOB_PATH, {
      ...data,
      lastUpdatedAt: new Date().toISOString(),
    });
    return;
  }

  replaceJsonRows("conversations", data.conversations);
  replaceJsonRows("customers", data.customers);
  replaceJsonRows("bookings", data.bookings);
  replaceJsonRows("tickets", data.tickets);
  replaceJsonRows("products", data.products);
  replaceJsonRows("services", data.services);
  replaceJsonRows("broadcasts", data.broadcasts);
}

export function getKnowledgeChunks(searchQuery?: string) {
  const database = getDatabase();
  const rows = searchQuery
    ? (database
        .prepare(
          "SELECT id, document_id, chunk_index, content, metadata_json, created_at FROM knowledge_chunks WHERE content LIKE ? ORDER BY created_at DESC",
        )
        .all(`%${searchQuery}%`) as Array<{
        id: string;
        document_id: string;
        chunk_index: number;
        content: string;
        metadata_json: string;
        created_at: string;
      }>)
    : (database
        .prepare(
          "SELECT id, document_id, chunk_index, content, metadata_json, created_at FROM knowledge_chunks ORDER BY created_at DESC",
        )
        .all() as Array<{
        id: string;
        document_id: string;
        chunk_index: number;
        content: string;
        metadata_json: string;
        created_at: string;
      }>);

  return rows.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    chunkIndex: row.chunk_index,
    content: row.content,
    metadata: JSON.parse(row.metadata_json) as KnowledgeChunk["metadata"],
    createdAt: row.created_at,
  }));
}

function chunkText(content: string, documentId: string, sourceName: string) {
  const normalized = content.replace(/\r/g, "").trim();
  if (!normalized) {
    return [] as KnowledgeChunk[];
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  return paragraphs.map((paragraph, index) => ({
    id: randomUUID(),
    documentId,
    chunkIndex: index,
    content: paragraph,
    metadata: { sourceName },
    createdAt: new Date().toISOString(),
  }));
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
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".json") ||
    lowerName.endsWith(".html")
  ) {
    return params.buffer.toString("utf8");
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

export async function ingestKnowledgeDocument(params: {
  id?: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const documentId = params.id ?? randomUUID();
  const uploadDir = getUploadDirectory();
  const normalizedName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const savedPath = join(uploadDir, `${documentId}-${normalizedName}`);
  writeFileSync(savedPath, params.buffer);

  const extractedText = await extractDocumentText(params);

  const document: KnowledgeDocument = {
    id: documentId,
    name: params.fileName,
    size: `${Math.max(params.buffer.byteLength / 1024, 1).toFixed(1)} KB`,
    status: "ready",
    progress: 100,
  };

  upsertJsonRow("knowledge_documents", document);

  if (isBlobStateEnabled()) {
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
  }

  const database = getDatabase();
  database.prepare("DELETE FROM knowledge_chunks WHERE document_id = ?").run(documentId);

  const chunks = chunkText(extractedText, documentId, params.fileName);
  const insertChunk = database.prepare(
    "INSERT INTO knowledge_chunks (id, document_id, chunk_index, content, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );

  database.exec("BEGIN");

  try {
    for (const item of chunks) {
      insertChunk.run(
        item.id,
        item.documentId,
        item.chunkIndex,
        item.content,
        JSON.stringify(item.metadata),
        item.createdAt,
      );
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return {
    document,
    chunks,
    savedPath,
    extractedText,
  };
}

export async function deleteKnowledgeDocument(documentId: string) {
  const documents = isBlobStateEnabled()
    ? (await getDashboardConfigRecord()).knowledgeBase.documents
    : listJsonRows<KnowledgeDocument>("knowledge_documents");
  const target = documents.find((item) => item.id === documentId);
  if (target) {
    const filePath = join(getUploadDirectory(), `${documentId}-${target.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  deleteJsonRow("knowledge_documents", documentId);
  const database = getDatabase();
  database.prepare("DELETE FROM knowledge_chunks WHERE document_id = ?").run(documentId);

  if (isBlobStateEnabled()) {
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
  }
}

export async function readKnowledgeDocumentContent(documentId: string) {
  const documents = isBlobStateEnabled()
    ? (await getDashboardConfigRecord()).knowledgeBase.documents
    : listJsonRows<KnowledgeDocument>("knowledge_documents");
  const target = documents.find((item) => item.id === documentId);
  if (!target) {
    return null;
  }

  const database = getDatabase();
  const chunks = database
    .prepare(
      "SELECT content FROM knowledge_chunks WHERE document_id = ? ORDER BY chunk_index ASC",
    )
    .all(documentId) as Array<{ content: string }>;

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

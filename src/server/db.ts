import { mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import BetterSqlite3 from "better-sqlite3";

import { defaultDashboardConfig } from "@/lib/dashboard-config";
import { defaultDashboardOperations } from "@/lib/dashboard-operations";
import { getSupabaseServerClient, isSupabaseEnabled } from "@/server/supabase";

const IS_EPHEMERAL_RUNTIME = process.env.VERCEL === "1";
const DATA_DIR =
  process.env.BALESIN_STORAGE_DIR ??
  (IS_EPHEMERAL_RUNTIME ? join(tmpdir(), "balesin-data") : join(process.cwd(), "data"));
const UPLOAD_DIR = join(DATA_DIR, "knowledge");
const DB_PATH = join(DATA_DIR, "balesin.sqlite");

type JsonRow = {
  id: string;
  data_json: string;
  updated_at: string;
};

type SupabaseJsonRow = {
  id: string;
  data_json: unknown;
  updated_at: string;
};

type SupabaseKnowledgeChunkRow = {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  metadata_json: unknown;
  created_at: string;
};

const SUPABASE_JSON_TABLES = new Set([
  "knowledge_faqs",
  "knowledge_documents",
  "conversations",
  "customers",
  "bookings",
  "tickets",
  "products",
  "services",
  "broadcasts",
  "crm_deals",
  "crm_tasks",
]);

const LEGACY_DEMO_IDS = {
  faqs: ["faq-1", "faq-2"],
  documents: ["doc-1", "doc-2"],
  conversations: ["conv-1", "conv-2", "conv-3", "conv-4", "conv-5", "conv-6"],
  customers: ["cust-1", "cust-2", "cust-3", "cust-4", "cust-5", "cust-6"],
  bookings: ["booking-1", "booking-2", "booking-3", "booking-4"],
  tickets: ["ticket-1", "ticket-2", "ticket-3"],
  products: ["prod-1", "prod-2", "prod-3"],
  services: ["svc-1", "svc-2", "svc-3"],
  broadcasts: ["broadcast-1", "broadcast-2", "broadcast-3"],
  crmDeals: [],
  crmTasks: [],
} as const;

function createDatabase(filePath: string) {
  return new BetterSqlite3(filePath);
}

type SqliteDatabase = ReturnType<typeof createDatabase>;

declare global {
  var __balesinDb: SqliteDatabase | undefined;
}

function ensureDataDir() {
  // Skip directory creation during build time
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function initializeSchema(database: SqliteDatabase) {
  database.exec(`
    PRAGMA journal_mode = ${IS_EPHEMERAL_RUNTIME ? "MEMORY" : "WAL"};
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_faqs (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_documents (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS broadcasts (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crm_deals (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crm_tasks (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL,
      run_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      normalized_json TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const hasConfig = database
    .prepare("SELECT 1 FROM app_config WHERE id = 1")
    .get() as { 1?: number } | undefined;

  if (!hasConfig) {
    const now = new Date().toISOString();
    database
      .prepare(
        "INSERT INTO app_config (id, data_json, updated_at) VALUES (1, ?, ?)",
      )
      .run(JSON.stringify(defaultDashboardConfig), now);

    seedJsonTable(database, "knowledge_faqs", defaultDashboardConfig.knowledgeBase.faqs);
    seedJsonTable(
      database,
      "knowledge_documents",
      defaultDashboardConfig.knowledgeBase.documents,
    );

    seedJsonTable(database, "conversations", defaultDashboardOperations.conversations);
    seedJsonTable(database, "customers", defaultDashboardOperations.customers);
    seedJsonTable(database, "bookings", defaultDashboardOperations.bookings);
    seedJsonTable(database, "tickets", defaultDashboardOperations.tickets);
    seedJsonTable(database, "products", defaultDashboardOperations.products);
    seedJsonTable(database, "services", defaultDashboardOperations.services);
    seedJsonTable(database, "broadcasts", defaultDashboardOperations.broadcasts);
    return;
  }

  sanitizeLegacyDemoSeed(database);
}

function hasAnyLegacyDemoRows(
  database: SqliteDatabase,
  tableName: string,
  ids: readonly string[],
) {
  if (ids.length === 0) {
    return false;
  }

  const placeholders = ids.map(() => "?").join(", ");
  const row = database
    .prepare(`SELECT COUNT(1) as count FROM ${tableName} WHERE id IN (${placeholders})`)
    .get(...ids) as { count?: number } | undefined;

  return (row?.count ?? 0) > 0;
}

function clearJsonTable(database: SqliteDatabase, tableName: string) {
  database.prepare(`DELETE FROM ${tableName}`).run();
}

function sanitizeLegacyDemoSeed(database: SqliteDatabase) {
  const row = database
    .prepare("SELECT data_json FROM app_config WHERE id = 1")
    .get() as { data_json: string } | undefined;

  if (!row) {
    return;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(row.data_json);
  } catch {
    return;
  }

  const config = parsed as {
    workspace?: { name?: string; supportEmail?: string };
    aiProvider?: { provider?: string };
  };

  const looksLikeLegacyDemoConfig =
    config.workspace?.name === "Balesin Workspace" ||
    config.workspace?.supportEmail === "admin@balesin.ai" ||
    config.aiProvider?.provider === "demo";

  if (!looksLikeLegacyDemoConfig) {
    return;
  }

  const hasLegacySeed =
    hasAnyLegacyDemoRows(database, "knowledge_faqs", LEGACY_DEMO_IDS.faqs) ||
    hasAnyLegacyDemoRows(
      database,
      "knowledge_documents",
      LEGACY_DEMO_IDS.documents,
    ) ||
    hasAnyLegacyDemoRows(
      database,
      "conversations",
      LEGACY_DEMO_IDS.conversations,
    ) ||
    hasAnyLegacyDemoRows(database, "customers", LEGACY_DEMO_IDS.customers) ||
    hasAnyLegacyDemoRows(database, "bookings", LEGACY_DEMO_IDS.bookings) ||
    hasAnyLegacyDemoRows(database, "tickets", LEGACY_DEMO_IDS.tickets) ||
    hasAnyLegacyDemoRows(database, "products", LEGACY_DEMO_IDS.products) ||
    hasAnyLegacyDemoRows(database, "services", LEGACY_DEMO_IDS.services) ||
    hasAnyLegacyDemoRows(database, "broadcasts", LEGACY_DEMO_IDS.broadcasts);

  if (!hasLegacySeed) {
    return;
  }

  runInTransaction(database, () => {
    database
      .prepare("UPDATE app_config SET data_json = ?, updated_at = ? WHERE id = 1")
      .run(JSON.stringify(defaultDashboardConfig), new Date().toISOString());

    clearJsonTable(database, "knowledge_faqs");
    clearJsonTable(database, "knowledge_documents");
    clearJsonTable(database, "knowledge_chunks");
    clearJsonTable(database, "conversations");
    clearJsonTable(database, "customers");
    clearJsonTable(database, "bookings");
    clearJsonTable(database, "tickets");
    clearJsonTable(database, "products");
    clearJsonTable(database, "services");
    clearJsonTable(database, "broadcasts");
  });
}

function runInTransaction(database: SqliteDatabase, callback: () => void) {
  database.exec("BEGIN");

  try {
    callback();
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function seedJsonTable<T extends { id: string }>(
  database: SqliteDatabase,
  tableName: string,
  items: T[],
) {
  const now = new Date().toISOString();
  const insert = database.prepare(
    `INSERT OR REPLACE INTO ${tableName} (id, data_json, updated_at) VALUES (?, ?, ?)`,
  );

  runInTransaction(database, () => {
    for (const row of items) {
      insert.run(row.id, JSON.stringify(row), now);
    }
  });
}

export function getDatabase() {
  // Skip database initialization during Next.js build time
  if (process.env.NEXT_PHASE === "phase-production-build") {
    // Return a stub during build time
    const stubStmt = {
      run: () => ({ changes: 0, lastInsertRowid: 0 }),
      get: () => undefined,
      all: () => [],
    };
    return {
      prepare: () => stubStmt,
      exec: () => {},
      transaction: (cb: any) => cb,
    } as unknown as SqliteDatabase;
  }

  if (globalThis.__balesinDb) {
    return globalThis.__balesinDb;
  }

  ensureDataDir();
  const database = createDatabase(DB_PATH);
  initializeSchema(database);
  globalThis.__balesinDb = database;
  return database;
}

export function listJsonRows<T>(tableName: string) {
  const database = getDatabase();
  const rows = database
    .prepare(`SELECT id, data_json, updated_at FROM ${tableName} ORDER BY updated_at DESC`)
    .all() as JsonRow[];

  return rows.map((row) => JSON.parse(row.data_json) as T);
}

export function replaceJsonRows<T extends { id: string }>(tableName: string, items: T[]) {
  const database = getDatabase();
  const deleteStatement = database.prepare(`DELETE FROM ${tableName}`);
  const insertStatement = database.prepare(
    `INSERT OR REPLACE INTO ${tableName} (id, data_json, updated_at) VALUES (?, ?, ?)`,
  );

  runInTransaction(database, () => {
    deleteStatement.run();
    const now = new Date().toISOString();
    for (const row of items) {
      insertStatement.run(row.id, JSON.stringify(row), now);
    }
  });
}

export function upsertJsonRow<T extends { id: string }>(tableName: string, item: T) {
  const database = getDatabase();
  database
    .prepare(
      `INSERT OR REPLACE INTO ${tableName} (id, data_json, updated_at) VALUES (?, ?, ?)`,
    )
    .run(item.id, JSON.stringify(item), new Date().toISOString());
}

export function getJsonRow<T>(tableName: string, id: string) {
  const database = getDatabase();
  const row = database
    .prepare(`SELECT data_json FROM ${tableName} WHERE id = ?`)
    .get(id) as { data_json: string } | undefined;

  if (!row) {
    return null;
  }

  return JSON.parse(row.data_json) as T;
}

export function deleteJsonRow(tableName: string, id: string) {
  const database = getDatabase();
  database.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
}

export function getUploadDirectory() {
  ensureDataDir();
  return UPLOAD_DIR;
}

function parseStoredJson<T>(value: unknown) {
  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }

  return value as T;
}

function ensureSupabaseJsonTable(tableName: string) {
  if (!SUPABASE_JSON_TABLES.has(tableName)) {
    throw new Error(`Supabase table ${tableName} belum didukung.`);
  }
}

export async function readAppConfigRecord<T>() {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("app_config")
      .select("data_json")
      .eq("id", 1)
      .maybeSingle<{ data_json: unknown }>();

    if (error) {
      throw new Error(`Supabase app_config read failed: ${error.message}`);
    }

    return data ? parseStoredJson<T>(data.data_json) : null;
  }

  const row = getDatabase()
    .prepare("SELECT data_json FROM app_config WHERE id = 1")
    .get() as { data_json: string } | undefined;

  return row ? (JSON.parse(row.data_json) as T) : null;
}

export async function writeAppConfigRecord(value: unknown) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("app_config").upsert(
      {
        id: 1,
        data_json: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      throw new Error(`Supabase app_config write failed: ${error.message}`);
    }

    return;
  }

  getDatabase()
    .prepare("UPDATE app_config SET data_json = ?, updated_at = ? WHERE id = 1")
    .run(JSON.stringify(value), new Date().toISOString());
}

export async function listJsonRowsAsync<T>(tableName: string) {
  if (isSupabaseEnabled()) {
    ensureSupabaseJsonTable(tableName);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from(tableName)
      .select("id, data_json, updated_at")
      .order("updated_at", { ascending: false })
      .returns<SupabaseJsonRow[]>();

    if (error) {
      throw new Error(`Supabase list ${tableName} failed: ${error.message}`);
    }

    return (data ?? []).map((row) => parseStoredJson<T>(row.data_json));
  }

  return listJsonRows<T>(tableName);
}

export async function replaceJsonRowsAsync<T extends { id: string }>(
  tableName: string,
  items: T[],
) {
  if (isSupabaseEnabled()) {
    ensureSupabaseJsonTable(tableName);
    const supabase = getSupabaseServerClient();
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq("id", "__never__");

    if (deleteError) {
      throw new Error(`Supabase clear ${tableName} failed: ${deleteError.message}`);
    }

    if (items.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from(tableName).upsert(
      items.map((item) => ({
        id: item.id,
        data_json: item,
        updated_at: now,
      })),
      { onConflict: "id" },
    );

    if (insertError) {
      throw new Error(`Supabase replace ${tableName} failed: ${insertError.message}`);
    }

    return;
  }

  replaceJsonRows(tableName, items);
}

export async function upsertJsonRowAsync<T extends { id: string }>(
  tableName: string,
  item: T,
) {
  if (isSupabaseEnabled()) {
    ensureSupabaseJsonTable(tableName);
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from(tableName).upsert(
      {
        id: item.id,
        data_json: item,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      throw new Error(`Supabase upsert ${tableName} failed: ${error.message}`);
    }

    return;
  }

  upsertJsonRow(tableName, item);
}

export async function getJsonRowAsync<T>(tableName: string, id: string) {
  if (isSupabaseEnabled()) {
    ensureSupabaseJsonTable(tableName);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from(tableName)
      .select("data_json")
      .eq("id", id)
      .maybeSingle<{ data_json: unknown }>();

    if (error) {
      throw new Error(`Supabase get ${tableName} failed: ${error.message}`);
    }

    return data ? parseStoredJson<T>(data.data_json) : null;
  }

  return getJsonRow<T>(tableName, id);
}

export async function deleteJsonRowAsync(tableName: string, id: string) {
  if (isSupabaseEnabled()) {
    ensureSupabaseJsonTable(tableName);
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from(tableName).delete().eq("id", id);

    if (error) {
      throw new Error(`Supabase delete ${tableName} failed: ${error.message}`);
    }

    return;
  }

  deleteJsonRow(tableName, id);
}

export async function listKnowledgeChunkRowsAsync() {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("knowledge_chunks")
      .select("id, document_id, chunk_index, content, metadata_json, created_at")
      .order("created_at", { ascending: false })
      .returns<SupabaseKnowledgeChunkRow[]>();

    if (error) {
      throw new Error(`Supabase knowledge_chunks list failed: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      document_id: row.document_id,
      chunk_index: row.chunk_index,
      content: row.content,
      metadata_json: parseStoredJson<unknown>(row.metadata_json),
      created_at: row.created_at,
    }));
  }

  const database = getDatabase();
  return database
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
  }>;
}

export async function replaceKnowledgeChunkRowsAsync(
  chunks: Array<{
    id: string;
    document_id: string;
    chunk_index: number;
    content: string;
    metadata_json: unknown;
    created_at: string;
  }>,
) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const { error: deleteError } = await supabase
      .from("knowledge_chunks")
      .delete()
      .neq("id", "__never__");

    if (deleteError) {
      throw new Error(`Supabase knowledge_chunks clear failed: ${deleteError.message}`);
    }

    if (chunks.length === 0) {
      return;
    }

    const { error: insertError } = await supabase
      .from("knowledge_chunks")
      .upsert(chunks, { onConflict: "id" });

    if (insertError) {
      throw new Error(
        `Supabase knowledge_chunks replace failed: ${insertError.message}`,
      );
    }

    return;
  }

  const database = getDatabase();
  database.prepare("DELETE FROM knowledge_chunks").run();
  const insertChunk = database.prepare(
    "INSERT INTO knowledge_chunks (id, document_id, chunk_index, content, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );

  database.exec("BEGIN");

  try {
    for (const item of chunks) {
      insertChunk.run(
        item.id,
        item.document_id,
        item.chunk_index,
        item.content,
        JSON.stringify(item.metadata_json),
        item.created_at,
      );
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export async function replaceKnowledgeChunksForDocumentAsync(
  documentId: string,
  chunks: Array<{
    id: string;
    document_id: string;
    chunk_index: number;
    content: string;
    metadata_json: unknown;
    created_at: string;
  }>,
) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const { error: deleteError } = await supabase
      .from("knowledge_chunks")
      .delete()
      .eq("document_id", documentId);

    if (deleteError) {
      throw new Error(
        `Supabase knowledge_chunks delete for ${documentId} failed: ${deleteError.message}`,
      );
    }

    if (chunks.length === 0) {
      return;
    }

    const { error: insertError } = await supabase
      .from("knowledge_chunks")
      .upsert(chunks, { onConflict: "id" });

    if (insertError) {
      throw new Error(
        `Supabase knowledge_chunks insert for ${documentId} failed: ${insertError.message}`,
      );
    }

    return;
  }

  const database = getDatabase();
  database.prepare("DELETE FROM knowledge_chunks WHERE document_id = ?").run(documentId);

  if (chunks.length === 0) {
    return;
  }

  const insertChunk = database.prepare(
    "INSERT INTO knowledge_chunks (id, document_id, chunk_index, content, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );

  database.exec("BEGIN");

  try {
    for (const item of chunks) {
      insertChunk.run(
        item.id,
        item.document_id,
        item.chunk_index,
        item.content,
        JSON.stringify(item.metadata_json),
        item.created_at,
      );
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export async function deleteKnowledgeChunksForDocumentAsync(documentId: string) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("knowledge_chunks")
      .delete()
      .eq("document_id", documentId);

    if (error) {
      throw new Error(
        `Supabase knowledge_chunks delete for ${documentId} failed: ${error.message}`,
      );
    }

    return;
  }

  const database = getDatabase();
  database.prepare("DELETE FROM knowledge_chunks WHERE document_id = ?").run(documentId);
}

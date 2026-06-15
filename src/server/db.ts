import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { defaultDashboardConfig } from "@/lib/dashboard-config";
import { defaultDashboardOperations } from "@/lib/dashboard-operations";

const DATA_DIR = join(process.cwd(), "data");
const UPLOAD_DIR = join(DATA_DIR, "knowledge");
const DB_PATH = join(DATA_DIR, "balesin.sqlite");

type JsonRow = {
  id: string;
  data_json: string;
  updated_at: string;
};

declare global {
  var __balesinDb: DatabaseSync | undefined;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function initializeSchema(database: DatabaseSync) {
  database.exec(`
    PRAGMA journal_mode = WAL;
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
  }
}

function runInTransaction(database: DatabaseSync, callback: () => void) {
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
  database: DatabaseSync,
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
  if (globalThis.__balesinDb) {
    return globalThis.__balesinDb;
  }

  ensureDataDir();
  const database = new DatabaseSync(DB_PATH);
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

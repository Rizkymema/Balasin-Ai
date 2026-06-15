import { randomUUID } from "node:crypto";

import { getDatabase } from "@/server/db";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type JobRecord = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  runAt: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export function enqueueJob(input: {
  type: string;
  payload: Record<string, unknown>;
  runAt?: string;
}) {
  const database = getDatabase();
  const payloadJson = JSON.stringify(input.payload);
  const existing = database
    .prepare(
      "SELECT id FROM jobs WHERE type = ? AND payload_json = ? AND status IN ('pending', 'processing')",
    )
    .get(input.type, payloadJson) as { id: string } | undefined;

  if (existing) {
    return {
      id: existing.id,
      type: input.type,
      payload: input.payload,
      status: "pending" as const,
      runAt: input.runAt ?? new Date().toISOString(),
      attempts: 0,
      lastError: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deduplicated: true,
    };
  }

  const now = new Date().toISOString();
  const job: JobRecord = {
    id: randomUUID(),
    type: input.type,
    payload: input.payload,
    status: "pending",
    runAt: input.runAt ?? now,
    attempts: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };

  database
    .prepare(
      "INSERT INTO jobs (id, type, payload_json, status, run_at, attempts, last_error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      job.id,
      job.type,
      payloadJson,
      job.status,
      job.runAt,
      job.attempts,
      job.lastError ?? null,
      job.createdAt,
      job.updatedAt,
    );

  return job;
}

export function listDueJobs(limit = 20) {
  const database = getDatabase();
  const rows = database
    .prepare(
      "SELECT id, type, payload_json, status, run_at, attempts, last_error, created_at, updated_at FROM jobs WHERE status IN ('pending', 'failed') AND run_at <= ? ORDER BY run_at ASC LIMIT ?",
    )
    .all(new Date().toISOString(), limit) as Array<{
    id: string;
    type: string;
    payload_json: string;
    status: JobStatus;
    run_at: string;
    attempts: number;
    last_error: string | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    payload: JSON.parse(row.payload_json) as Record<string, unknown>,
    status: row.status,
    runAt: row.run_at,
    attempts: row.attempts,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function markJobProcessing(id: string) {
  const database = getDatabase();
  database
    .prepare("UPDATE jobs SET status = 'processing', updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
}

export function markJobCompleted(id: string) {
  const database = getDatabase();
  database
    .prepare("UPDATE jobs SET status = 'completed', updated_at = ?, last_error = NULL WHERE id = ?")
    .run(new Date().toISOString(), id);
}

export function markJobFailed(id: string, errorMessage: string) {
  const database = getDatabase();
  database
    .prepare(
      "UPDATE jobs SET status = 'failed', attempts = attempts + 1, last_error = ?, updated_at = ? WHERE id = ?",
    )
    .run(errorMessage, new Date().toISOString(), id);
}

export function listJobs(limit = 50) {
  const database = getDatabase();
  const rows = database
    .prepare(
      "SELECT id, type, payload_json, status, run_at, attempts, last_error, created_at, updated_at FROM jobs ORDER BY created_at DESC LIMIT ?",
    )
    .all(limit) as Array<{
    id: string;
    type: string;
    payload_json: string;
    status: JobStatus;
    run_at: string;
    attempts: number;
    last_error: string | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    payload: JSON.parse(row.payload_json) as Record<string, unknown>,
    status: row.status,
    runAt: row.run_at,
    attempts: row.attempts,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

import { createHash, randomUUID } from "node:crypto";

import { getDatabase } from "@/server/db";
import { getSupabaseServerClient, isSupabaseEnabled } from "@/server/supabase";

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

function isIgnorableJobStorageError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    (message.includes("jobs") || message.includes("payload_hash")) &&
    (
      message.includes("does not exist") ||
      message.includes("relation") ||
      message.includes("schema cache") ||
      message.includes("could not find") ||
      message.includes("column")
    )
  );
}

function getPayloadHash(payload: Record<string, unknown>) {
  return createHash("sha1").update(JSON.stringify(payload)).digest("hex");
}

export async function enqueueJob(input: {
  type: string;
  payload: Record<string, unknown>;
  runAt?: string;
}) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const payloadHash = getPayloadHash(input.payload);
    const { data: existing, error: existingError } = await supabase
      .from("jobs")
      .select("id")
      .eq("type", input.type)
      .eq("payload_hash", payloadHash)
      .in("status", ["pending", "processing"])
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (existingError) {
      const wrapped = new Error(`Supabase jobs lookup failed: ${existingError.message}`);
      if (isIgnorableJobStorageError(wrapped)) {
        console.warn("[job-repository] jobs table unavailable during lookup; skipping queue dedupe");
        return {
          id: randomUUID(),
          type: input.type,
          payload: input.payload,
          status: "pending" as const,
          runAt: input.runAt ?? new Date().toISOString(),
          attempts: 0,
          lastError: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deduplicated: true,
          skippedPersistence: true,
        };
      }

      throw wrapped;
    }

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

    const { error } = await supabase.from("jobs").insert({
      id: job.id,
      type: job.type,
      payload_json: job.payload,
      payload_hash: payloadHash,
      status: job.status,
      run_at: job.runAt,
      attempts: job.attempts,
      last_error: job.lastError,
      created_at: job.createdAt,
      updated_at: job.updatedAt,
    });

    if (error) {
      const wrapped = new Error(`Supabase jobs insert failed: ${error.message}`);
      if (isIgnorableJobStorageError(wrapped)) {
        console.warn("[job-repository] jobs table unavailable during insert; skipping queue persistence");
        return {
          ...job,
          skippedPersistence: true,
        };
      }

      throw wrapped;
    }

    return job;
  }

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

export async function listDueJobs(limit = 20) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, type, payload_json, status, run_at, attempts, last_error, created_at, updated_at",
      )
      .in("status", ["pending", "failed"])
      .lte("run_at", new Date().toISOString())
      .order("run_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Supabase jobs due list failed: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      type: String(row.type),
      payload: row.payload_json as Record<string, unknown>,
      status: row.status as JobStatus,
      runAt: String(row.run_at),
      attempts: Number(row.attempts ?? 0),
      lastError: (row.last_error as string | null) ?? null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
  }

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

export async function markJobProcessing(id: string) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("jobs")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Supabase job processing update failed: ${error.message}`);
    }

    return;
  }

  const database = getDatabase();
  database
    .prepare("UPDATE jobs SET status = 'processing', updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
}

export async function markJobCompleted(id: string) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("jobs")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Supabase job completion update failed: ${error.message}`);
    }

    return;
  }

  const database = getDatabase();
  database
    .prepare("UPDATE jobs SET status = 'completed', updated_at = ?, last_error = NULL WHERE id = ?")
    .run(new Date().toISOString(), id);
}

export async function markJobFailed(id: string, errorMessage: string) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const { data: current, error: currentError } = await supabase
      .from("jobs")
      .select("attempts")
      .eq("id", id)
      .limit(1)
      .maybeSingle<{ attempts: number }>();

    if (currentError) {
      throw new Error(`Supabase job attempts read failed: ${currentError.message}`);
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "failed",
        attempts: (current?.attempts ?? 0) + 1,
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Supabase job failure update failed: ${error.message}`);
    }

    return;
  }

  const database = getDatabase();
  database
    .prepare(
      "UPDATE jobs SET status = 'failed', attempts = attempts + 1, last_error = ?, updated_at = ? WHERE id = ?",
    )
    .run(errorMessage, new Date().toISOString(), id);
}

export async function listJobs(limit = 50) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, type, payload_json, status, run_at, attempts, last_error, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Supabase jobs list failed: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      type: String(row.type),
      payload: row.payload_json as Record<string, unknown>,
      status: row.status as JobStatus,
      runAt: String(row.run_at),
      attempts: Number(row.attempts ?? 0),
      lastError: (row.last_error as string | null) ?? null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
  }

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

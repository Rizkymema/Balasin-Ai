import { randomUUID } from "node:crypto";

import { getDatabase } from "@/server/db";
import { getSupabaseServerClient, isSupabaseEnabled } from "@/server/supabase";

function isIgnorableWebhookStorageError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("webhook_events") &&
    (
      message.includes("does not exist") ||
      message.includes("relation") ||
      message.includes("schema cache") ||
      message.includes("could not find")
    )
  );
}

export async function recordWebhookEvent(input: {
  source: string;
  payload: Record<string, unknown>;
  normalized?: Record<string, unknown>;
  status: string;
}) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("webhook_events").insert({
      id: randomUUID(),
      source: input.source,
      payload_json: input.payload,
      normalized_json: input.normalized ?? null,
      status: input.status,
      created_at: new Date().toISOString(),
    });

    if (error) {
      const wrapped = new Error(`Supabase webhook_events insert failed: ${error.message}`);
      if (isIgnorableWebhookStorageError(wrapped)) {
        console.warn("[webhook-repository] webhook_events table unavailable; skipping event persistence");
        return;
      }

      throw wrapped;
    }

    return;
  }

  const database = getDatabase();
  database
    .prepare(
      "INSERT INTO webhook_events (id, source, payload_json, normalized_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      randomUUID(),
      input.source,
      JSON.stringify(input.payload),
      input.normalized ? JSON.stringify(input.normalized) : null,
      input.status,
      new Date().toISOString(),
    );
}

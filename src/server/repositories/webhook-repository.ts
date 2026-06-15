import { randomUUID } from "node:crypto";

import { getDatabase } from "@/server/db";

export function recordWebhookEvent(input: {
  source: string;
  payload: Record<string, unknown>;
  normalized?: Record<string, unknown>;
  status: string;
}) {
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

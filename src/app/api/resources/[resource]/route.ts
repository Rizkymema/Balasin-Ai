import { randomUUID } from "node:crypto";

import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { listJsonRowsAsync, upsertJsonRowAsync } from "@/server/db";

const RESOURCE_TABLES = {
  conversations: "conversations",
  customers: "customers",
  bookings: "bookings",
  tickets: "tickets",
  products: "products",
  services: "services",
  broadcasts: "broadcasts",
} as const;

type ResourceName = keyof typeof RESOURCE_TABLES;

function resolveResource(resource: string) {
  if (resource in RESOURCE_TABLES) {
    return RESOURCE_TABLES[resource as ResourceName];
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ resource: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  const { resource } = await context.params;
  const tableName = resolveResource(resource);

  if (!tableName) {
    return jsonError("Unknown resource.", 404);
  }

  return jsonOk(await listJsonRowsAsync(tableName));
}

export async function POST(
  request: Request,
  context: { params: Promise<{ resource: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  const { resource } = await context.params;
  const tableName = resolveResource(resource);
  if (!tableName) {
    return jsonError("Unknown resource.", 404);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const next = {
      ...body,
      id: String(body.id ?? randomUUID()),
    };

    await upsertJsonRowAsync(tableName, next as { id: string });
    return jsonOk(next, { status: 201 });
  } catch {
    return jsonError("Gagal membuat resource.", 500);
  }
}

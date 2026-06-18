import {
  deleteJsonRowAsync,
  getJsonRowAsync,
  upsertJsonRowAsync,
} from "@/server/db";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";

const RESOURCE_TABLES = {
  conversations: "conversations",
  customers: "customers",
  bookings: "bookings",
  tickets: "tickets",
  products: "products",
  services: "services",
  broadcasts: "broadcasts",
  crm_deals: "crm_deals",
  crm_tasks: "crm_tasks",
} as const;

function resolveResource(resource: string) {
  if (resource in RESOURCE_TABLES) {
    return RESOURCE_TABLES[resource as keyof typeof RESOURCE_TABLES];
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ resource: string; id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  const { resource, id } = await context.params;
  const tableName = resolveResource(resource);
  if (!tableName) {
    return jsonError("Unknown resource.", 404);
  }

  const item = await getJsonRowAsync(tableName, id);
  if (!item) {
    return jsonError("Resource not found.", 404);
  }

  return jsonOk(item);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ resource: string; id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  const { resource, id } = await context.params;
  const tableName = resolveResource(resource);
  if (!tableName) {
    return jsonError("Unknown resource.", 404);
  }

  const existing = await getJsonRowAsync<Record<string, unknown>>(tableName, id);
  if (!existing) {
    return jsonError("Resource not found.", 404);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const next = {
      ...existing,
      ...body,
      id,
    };

    await upsertJsonRowAsync(tableName, next as { id: string });
    return jsonOk(next);
  } catch {
    return jsonError("Gagal memperbarui resource.", 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ resource: string; id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  const { resource, id } = await context.params;
  const tableName = resolveResource(resource);
  if (!tableName) {
    return jsonError("Unknown resource.", 404);
  }

  await deleteJsonRowAsync(tableName, id);
  return jsonOk({ deleted: true, id });
}

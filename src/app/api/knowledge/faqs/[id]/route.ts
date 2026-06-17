import {
  deleteJsonRowAsync,
  getJsonRowAsync,
  upsertJsonRowAsync,
} from "@/server/db";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import type { FAQItem } from "@/types/dashboard-config";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  const { id } = await context.params;
  const existing = await getJsonRowAsync<FAQItem>("knowledge_faqs", id);
  if (!existing) {
    return jsonError("FAQ not found.", 404);
  }

  try {
    const body = (await request.json()) as Partial<FAQItem>;
    const next: FAQItem = {
      id,
      question: body.question ?? existing.question,
      answer: body.answer ?? existing.answer,
    };
    await upsertJsonRowAsync("knowledge_faqs", next);
    return jsonOk(next);
  } catch {
    return jsonError("Gagal memperbarui FAQ.", 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  const { id } = await context.params;
  await deleteJsonRowAsync("knowledge_faqs", id);
  return jsonOk({ deleted: true, id });
}

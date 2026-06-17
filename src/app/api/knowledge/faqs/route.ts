import { randomUUID } from "node:crypto";

import { listJsonRowsAsync, upsertJsonRowAsync } from "@/server/db";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import type { FAQItem } from "@/types/dashboard-config";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  return jsonOk(await listJsonRowsAsync<FAQItem>("knowledge_faqs"));
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json()) as Partial<FAQItem>;
    if (!body.question || !body.answer) {
      return jsonError("Question dan answer wajib diisi.", 400);
    }

    const item: FAQItem = {
      id: body.id ?? randomUUID(),
      question: body.question,
      answer: body.answer,
    };

    await upsertJsonRowAsync("knowledge_faqs", item);
    return jsonOk(item, { status: 201 });
  } catch {
    return jsonError("Gagal menyimpan FAQ.", 500);
  }
}

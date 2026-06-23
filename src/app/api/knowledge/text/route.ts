import { ingestKnowledgeTextSource } from "@/server/repositories/dashboard-repository";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json()) as {
      name: string;
      content: string;
    };

    if (!body.name?.trim() || !body.content?.trim()) {
      return jsonError("Nama pemicu dan konten wajib diisi.", 400);
    }

    const result = await ingestKnowledgeTextSource({
      name: body.name.trim(),
      content: body.content.trim(),
      sourceType: "upload", // Use upload as default since it's user provided text
    });

    return jsonOk({
      document: result.document,
      chunkCount: result.chunks.length,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal mengunggah konten teks.",
      500,
    );
  }
}

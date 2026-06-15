import { ingestKnowledgeDocument } from "@/server/repositories/dashboard-repository";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("File upload wajib disertakan.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await ingestKnowledgeDocument({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer,
    });

    return jsonOk({
      document: result.document,
      chunkCount: result.chunks.length,
    });
  } catch {
    return jsonError("Gagal mengunggah dokumen knowledge.", 500);
  }
}

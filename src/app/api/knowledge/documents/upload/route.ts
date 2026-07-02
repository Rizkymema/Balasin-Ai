import {
  KNOWLEDGE_DOCUMENT_EXTENSIONS,
  KNOWLEDGE_DOCUMENT_MAX_BYTES,
} from "@/constants/knowledge-security";
import { ingestKnowledgeDocument } from "@/server/repositories/dashboard-repository";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { assertFileUpload, assertRequestSize } from "@/server/security/request";

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    assertRequestSize(request, KNOWLEDGE_DOCUMENT_MAX_BYTES);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("File upload wajib disertakan.", 400);
    }

    assertFileUpload({
      file,
      allowedExtensions: KNOWLEDGE_DOCUMENT_EXTENSIONS,
      maxBytes: KNOWLEDGE_DOCUMENT_MAX_BYTES,
    });

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
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengunggah dokumen knowledge.";
    const status = message.includes("terlalu besar")
      ? 413
      : message.includes("tidak didukung")
        ? 415
        : 500;
    return jsonError(message, status);
  }
}

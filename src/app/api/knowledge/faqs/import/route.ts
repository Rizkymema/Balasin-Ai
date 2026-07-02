import {
  KNOWLEDGE_FAQ_IMPORT_EXTENSIONS,
  KNOWLEDGE_FAQ_IMPORT_MAX_BYTES,
} from "@/constants/knowledge-security";
import { parseFaqImportFile } from "@/server/services/faq-import-service";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { assertFileUpload, assertRequestSize } from "@/server/security/request";

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    assertRequestSize(request, KNOWLEDGE_FAQ_IMPORT_MAX_BYTES);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("File FAQ wajib disertakan.", 400);
    }

    assertFileUpload({
      file,
      allowedExtensions: KNOWLEDGE_FAQ_IMPORT_EXTENSIONS,
      maxBytes: KNOWLEDGE_FAQ_IMPORT_MAX_BYTES,
    });

    const items = await parseFaqImportFile({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer: Buffer.from(await file.arrayBuffer()),
    });

    if (items.length === 0) {
      return jsonError(
        "Isi file belum terbaca sebagai FAQ. Gunakan kolom Pertanyaan/Jawaban atau format Q:/A:.",
        422,
      );
    }

    return jsonOk(
      {
        items,
        fileName: file.name,
        count: items.length,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal membaca file FAQ.";
    const status = message.includes("terlalu besar")
      ? 413
      : message.includes("tidak didukung")
        ? 415
        : 500;
    return jsonError(message, status);
  }
}

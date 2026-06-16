import { parseFaqImportFile } from "@/server/services/faq-import-service";
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
      return jsonError("File FAQ wajib disertakan.", 400);
    }

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
  } catch {
    return jsonError("Gagal membaca file FAQ.", 500);
  }
}

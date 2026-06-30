import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { sendInboxReply } from "@/server/services/operations-service";
import { normalizeOutboundMediaUpload } from "@/server/services/outbound-media";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;
    const contentType = request.headers.get("content-type") ?? "";
    let message = "";
    let mediaAttachment: ReturnType<typeof normalizeOutboundMediaUpload> | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const rawMessage = formData.get("message");
      const rawFile = formData.get("file");

      message = typeof rawMessage === "string" ? rawMessage.trim() : "";

      if (rawFile instanceof File && rawFile.size > 0) {
        mediaAttachment = normalizeOutboundMediaUpload({
          buffer: Buffer.from(await rawFile.arrayBuffer()),
          fileName: rawFile.name,
          mimeType: rawFile.type,
        });
      }
    } else {
      const body = (await request.json()) as { message?: string };
      message = body.message?.trim() ?? "";
    }

    if (!message && !mediaAttachment) {
      return jsonError("Pesan atau file media wajib diisi.", 400);
    }

    const result = await sendInboxReply({
      conversationId: id,
      message,
      mediaAttachment,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal mengirim balasan inbox.",
      500,
    );
  }
}

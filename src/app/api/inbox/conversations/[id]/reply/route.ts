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
    let stickerUrl = "";
    let mediaAttachment: ReturnType<typeof normalizeOutboundMediaUpload> | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const rawMessage = formData.get("message");
      const rawFile = formData.get("file");
      const rawSticker = formData.get("stickerUrl");

      message = typeof rawMessage === "string" ? rawMessage.trim() : "";
      stickerUrl = typeof rawSticker === "string" ? rawSticker.trim() : "";

      if (rawFile instanceof File && rawFile.size > 0) {
        mediaAttachment = normalizeOutboundMediaUpload({
          buffer: Buffer.from(await rawFile.arrayBuffer()),
          fileName: rawFile.name,
          mimeType: rawFile.type,
        });
      }
    } else {
      const body = (await request.json()) as { message?: string; stickerUrl?: string };
      message = body.message?.trim() ?? "";
      stickerUrl = body.stickerUrl?.trim() ?? "";
    }

    if (!message && !mediaAttachment && !stickerUrl) {
      return jsonError("Pesan, file media, atau sticker wajib diisi.", 400);
    }

    const result = await sendInboxReply({
      conversationId: id,
      message,
      mediaAttachment,
      stickerUrl,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal mengirim balasan inbox.",
      500,
    );
  }
}

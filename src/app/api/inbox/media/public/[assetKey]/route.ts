import { jsonError } from "@/server/http";
import {
  isValidOutboundMediaPublicToken,
  readStoredOutboundMediaAsset,
} from "@/server/services/outbound-media";

function resolveContentType(assetKey: string) {
  const normalized = assetKey.trim().toLowerCase();

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }

  if (normalized.endsWith(".gif")) {
    return "image/gif";
  }

  if (normalized.endsWith(".mp4")) {
    return "video/mp4";
  }

  if (normalized.endsWith(".mov")) {
    return "video/quicktime";
  }

  return "image/jpeg";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ assetKey: string }> },
) {
  const { assetKey } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";

  if (!isValidOutboundMediaPublicToken(assetKey, token)) {
    return jsonError("Akses media tidak valid.", 403);
  }

  const media = await readStoredOutboundMediaAsset(assetKey);

  if (!media) {
    return jsonError("Media tidak ditemukan.", 404);
  }

  return new Response(media.buffer, {
    status: 200,
    headers: {
      "Content-Type": resolveContentType(assetKey),
      "Cache-Control": "public, max-age=3600, immutable",
    },
  });
}

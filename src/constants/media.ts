export const OUTBOUND_MEDIA_MAX_BYTES = 16 * 1024 * 1024;
export const OUTBOUND_MEDIA_ACCEPT = "image/*,video/*";

export type OutboundMediaKind = "image" | "video";

export function inferOutboundMediaKind(
  mimeType?: string | null,
): OutboundMediaKind | null {
  const normalized = mimeType?.trim().toLowerCase() ?? "";

  if (normalized.startsWith("image/")) {
    return "image";
  }

  if (normalized.startsWith("video/")) {
    return "video";
  }

  return null;
}

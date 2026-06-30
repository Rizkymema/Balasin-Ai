import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

import { put } from "@vercel/blob";

import {
  inferOutboundMediaKind,
  type OutboundMediaKind,
  OUTBOUND_MEDIA_MAX_BYTES,
} from "@/constants/media";
import { getOutboundMediaDirectory } from "@/server/db";

export type PreparedOutboundMediaUpload = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  kind: OutboundMediaKind;
  sizeBytes: number;
};

export type StoredOutboundMediaAsset = {
  assetKey: string;
  fileName: string;
  mimeType: string;
  kind: OutboundMediaKind;
  sizeBytes: number;
  previewUrl: string;
  publicUrl?: string;
};

function getBlobStoreId() {
  return process.env.BLOB_STORE_ID?.trim() ?? "";
}

function getBlobCommandOptions() {
  const storeId = getBlobStoreId();
  return storeId ? { storeId } : {};
}

function canStoreMediaInBlob() {
  return (
    process.env.VERCEL === "1" &&
    (getBlobStoreId().length > 0 ||
      (process.env.BLOB_READ_WRITE_TOKEN?.trim().length ?? 0) > 0)
  );
}

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim() || "media";
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function resolveExtension(fileName: string, mimeType: string, kind: OutboundMediaKind) {
  const existingExtension = extname(fileName).trim().toLowerCase();
  if (existingExtension) {
    return existingExtension;
  }

  const normalizedMime = mimeType.trim().toLowerCase();
  if (normalizedMime === "image/jpeg") {
    return ".jpg";
  }

  if (normalizedMime === "image/png") {
    return ".png";
  }

  if (normalizedMime === "image/webp") {
    return ".webp";
  }

  if (normalizedMime === "video/mp4") {
    return ".mp4";
  }

  if (normalizedMime === "video/quicktime") {
    return ".mov";
  }

  return kind === "image" ? ".jpg" : ".mp4";
}

export function buildOutboundMediaPreviewUrl(assetKey: string) {
  return `/api/inbox/media/${encodeURIComponent(assetKey)}`;
}

export function normalizeOutboundMediaUpload(input: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string | null;
}) {
  const mimeType = input.mimeType?.trim().toLowerCase() || "application/octet-stream";
  const kind = inferOutboundMediaKind(mimeType);

  if (!kind) {
    throw new Error("File media harus berupa gambar atau video.");
  }

  if (input.buffer.byteLength === 0) {
    throw new Error("File media kosong dan tidak bisa dikirim.");
  }

  if (input.buffer.byteLength > OUTBOUND_MEDIA_MAX_BYTES) {
    throw new Error("Ukuran file media terlalu besar untuk dikirim.");
  }

  return {
    buffer: input.buffer,
    fileName: sanitizeFileName(input.fileName),
    mimeType,
    kind,
    sizeBytes: input.buffer.byteLength,
  } satisfies PreparedOutboundMediaUpload;
}

export async function storeOutboundMediaAsset(
  upload: PreparedOutboundMediaUpload,
): Promise<StoredOutboundMediaAsset> {
  const extension = resolveExtension(upload.fileName, upload.mimeType, upload.kind);
  const assetKey = `${Date.now()}-${randomUUID()}${extension}`;
  const previewUrl = buildOutboundMediaPreviewUrl(assetKey);

  if (canStoreMediaInBlob()) {
    const result = await put(`outbound-media/${assetKey}`, upload.buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: upload.mimeType,
      ...getBlobCommandOptions(),
    });

    return {
      assetKey,
      fileName: upload.fileName,
      mimeType: upload.mimeType,
      kind: upload.kind,
      sizeBytes: upload.sizeBytes,
      previewUrl: result.url,
      publicUrl: result.url,
    };
  }

  await writeFile(join(getOutboundMediaDirectory(), assetKey), upload.buffer);

  return {
    assetKey,
    fileName: upload.fileName,
    mimeType: upload.mimeType,
    kind: upload.kind,
    sizeBytes: upload.sizeBytes,
    previewUrl,
  };
}

export async function readStoredOutboundMediaAsset(assetKey: string) {
  const normalized = assetKey.trim();

  if (!normalized || normalized.includes("/") || normalized.includes("\\")) {
    return null;
  }

  const filePath = join(getOutboundMediaDirectory(), normalized);

  try {
    const buffer = await readFile(filePath);
    return {
      buffer,
      filePath,
    };
  } catch {
    return null;
  }
}

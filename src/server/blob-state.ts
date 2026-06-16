import { get, put } from "@vercel/blob";

const PRIVATE_BLOB_ACCESS = "private" as const;

function getBlobStoreId() {
  return process.env.BLOB_STORE_ID?.trim() ?? "";
}

export function isBlobStateEnabled() {
  return process.env.VERCEL === "1" && getBlobStoreId().length > 0;
}

export async function readPrivateJsonBlob<T>(pathname: string) {
  if (!isBlobStateEnabled()) {
    return null;
  }

  const result = await get(pathname, {
    access: PRIVATE_BLOB_ACCESS,
    storeId: getBlobStoreId(),
    useCache: false,
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  const payload = await new Response(result.stream).text();
  if (!payload.trim()) {
    return null;
  }

  return JSON.parse(payload) as T;
}

export async function writePrivateJsonBlob(pathname: string, value: unknown) {
  if (!isBlobStateEnabled()) {
    return;
  }

  await put(pathname, JSON.stringify(value, null, 2), {
    access: PRIVATE_BLOB_ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    storeId: getBlobStoreId(),
  });
}

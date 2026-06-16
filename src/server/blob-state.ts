import { get, put } from "@vercel/blob";

const PRIVATE_BLOB_ACCESS = "private" as const;

function getBlobStoreId() {
  return process.env.BLOB_STORE_ID?.trim() ?? "";
}

function getBlobReadWriteToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() ?? "";
}

function getBlobCommandOptions() {
  const storeId = getBlobStoreId();

  return storeId
    ? { storeId }
    : {};
}

export function isBlobStateEnabled() {
  return (
    process.env.VERCEL === "1" &&
    (getBlobStoreId().length > 0 || getBlobReadWriteToken().length > 0)
  );
}

export async function readPrivateJsonBlob<T>(pathname: string) {
  if (!isBlobStateEnabled()) {
    return null;
  }

  try {
    const result = await get(pathname, {
      access: PRIVATE_BLOB_ACCESS,
      useCache: false,
      ...getBlobCommandOptions(),
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    const payload = await new Response(result.stream).text();
    if (!payload.trim()) {
      return null;
    }

    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
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
    ...getBlobCommandOptions(),
  });
}

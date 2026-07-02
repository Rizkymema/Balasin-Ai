const PRIVATE_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

function parseCsvEnv(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isIpv4Private(hostname: string) {
  const match = hostname.match(/^(\d{1,3})(?:\.(\d{1,3})){3}$/);
  if (!match) {
    return false;
  }

  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [first, second] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isIpv6Private(hostname: string) {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function isAllowedHost(hostname: string) {
  const allowedHosts = parseCsvEnv(process.env.EXTERNAL_FETCH_ALLOWED_HOSTS);
  if (allowedHosts.length === 0) {
    return true;
  }

  const normalized = hostname.toLowerCase();
  return allowedHosts.some(
    (allowed) => normalized === allowed || normalized.endsWith(`.${allowed}`),
  );
}

export function assertSafeExternalUrl(value: string) {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("URL tidak valid.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("URL eksternal wajib menggunakan HTTPS.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    PRIVATE_HOSTS.has(hostname) ||
    isIpv4Private(hostname) ||
    isIpv6Private(hostname)
  ) {
    throw new Error("URL private/internal tidak diizinkan.");
  }

  if (!isAllowedHost(hostname)) {
    throw new Error("Host URL belum masuk allowlist.");
  }

  return parsed;
}

async function readResponseBytes(response: Response, maxBytes: number) {
  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("Response eksternal terlalu besar.");
  }

  if (!response.body) {
    return Buffer.alloc(0);
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const chunk = Buffer.from(value);
    totalBytes += chunk.byteLength;
    if (totalBytes > maxBytes) {
      throw new Error("Response eksternal terlalu besar.");
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

export async function fetchExternalWithLimit(
  url: string,
  init: RequestInit,
  options: { timeoutMs: number; maxBytes: number },
) {
  assertSafeExternalUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return {
      response,
      buffer: await readResponseBytes(response, options.maxBytes),
    };
  } finally {
    clearTimeout(timeout);
  }
}

import { createHmac, timingSafeEqual } from "node:crypto";

type ParsedMetaWebhookResult<T> =
  | {
      ok: true;
      body: T;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

export async function parseMetaSignedJson<T>(
  request: Request,
  appSecret: string,
): Promise<ParsedMetaWebhookResult<T>> {
  const normalizedSecret = appSecret.trim();
  if (!normalizedSecret) {
    return {
      ok: false,
      error: "META_APP_SECRET belum dikonfigurasi untuk verifikasi webhook.",
      status: 503,
    };
  }

  const signature = request.headers.get("x-hub-signature-256")?.trim() ?? "";
  const rawBody = await request.text();
  const expectedSignature = `sha256=${createHmac("sha256", normalizedSecret)
    .update(rawBody)
    .digest("hex")}`;

  if (!signature || signature.length !== expectedSignature.length) {
    return {
      ok: false,
      error: "Signature webhook Meta tidak ada atau tidak valid.",
      status: 401,
    };
  }

  try {
    if (
      !timingSafeEqual(
        Buffer.from(signature, "utf8"),
        Buffer.from(expectedSignature, "utf8"),
      )
    ) {
      return {
        ok: false,
        error: "Signature webhook Meta tidak cocok.",
        status: 401,
      };
    }
  } catch {
    return {
      ok: false,
      error: "Signature webhook Meta tidak valid.",
      status: 401,
    };
  }

  try {
    return {
      ok: true,
      body: JSON.parse(rawBody) as T,
    };
  } catch {
    return {
      ok: false,
      error: "Payload webhook Meta tidak valid.",
      status: 400,
    };
  }
}

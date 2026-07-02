import { timingSafeEqual } from "node:crypto";

import { processIncomingMessage } from "@/server/services/inbox-service";
import { recordWebhookEvent } from "@/server/repositories/webhook-repository";
import { jsonError, jsonOk } from "@/server/http";
import { serverEnv } from "@/server/env";
import { checkRateLimit } from "@/server/security/rate-limit";
import { assertRequestSize } from "@/server/security/request";

type WebchatPayload = {
  customerId?: string;
  id?: string;
  sessionId?: string;
  name?: string;
  customerName?: string;
  displayName?: string;
  phone?: string;
  username?: string;
  message?: string;
  text?: string;
  body?: string;
  content?: string;
  messageType?: "text" | "comment";
};

const WEBCHAT_MAX_BODY_BYTES = 32 * 1024;
const WEBCHAT_MAX_MESSAGE_CHARS = 4000;
const WEBCHAT_RATE_LIMIT = 30;
const WEBCHAT_RATE_WINDOW_MS = 60 * 1000;

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function getSuppliedWebchatSecret(request: Request) {
  const auth = request.headers.get("authorization")?.trim() ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const queryToken = new URL(request.url).searchParams.get("token")?.trim() ?? "";

  return (
    request.headers.get("x-webchat-secret")?.trim() ||
    bearer ||
    queryToken
  );
}

function authorizeWebchatRequest(request: Request) {
  const expected = serverEnv.webchatWebhookSecret;

  if (!expected && process.env.NODE_ENV === "production") {
    return {
      ok: false,
      response: jsonError("Webhook webchat belum dikonfigurasi.", 503),
    };
  }

  if (!expected) {
    return { ok: true, response: null };
  }

  const supplied = getSuppliedWebchatSecret(request);
  if (!supplied || !safeCompare(supplied, expected)) {
    return {
      ok: false,
      response: jsonError("Akses webchat tidak valid.", 401),
    };
  }

  return { ok: true, response: null };
}

async function parseWebchatPayload(request: Request): Promise<WebchatPayload> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as WebchatPayload;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries()) as WebchatPayload;
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > WEBCHAT_MAX_BODY_BYTES) {
    throw new Error("Payload webchat terlalu besar.");
  }

  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw) as WebchatPayload;
  } catch {
    return {
      message: raw,
    };
  }
}

function normalizePayload(body: WebchatPayload) {
  const displayName =
    body.name?.trim() ||
    body.customerName?.trim() ||
    body.displayName?.trim() ||
    "Website Visitor";
  const message =
    body.message?.trim() ||
    body.text?.trim() ||
    body.body?.trim() ||
    body.content?.trim() ||
    "";

  return {
    customerId: body.customerId?.trim() || body.id?.trim() || body.sessionId?.trim(),
    displayName,
    phone: body.phone?.trim() || undefined,
    username: body.username?.trim() || undefined,
    message,
    messageType: body.messageType ?? "text",
  };
}

export async function POST(request: Request) {
  const auth = authorizeWebchatRequest(request);
  if (auth.response) {
    return auth.response;
  }

  const rateLimit = checkRateLimit({
    key: `webchat:${getClientIp(request)}`,
    limit: WEBCHAT_RATE_LIMIT,
    windowMs: WEBCHAT_RATE_WINDOW_MS,
  });
  if (!rateLimit.allowed) {
    return jsonError("Terlalu banyak request webchat.", 429);
  }

  try {
    assertRequestSize(request, WEBCHAT_MAX_BODY_BYTES);
    const body = await parseWebchatPayload(request);
    const normalizedBody = normalizePayload(body);

    if (!normalizedBody.displayName || !normalizedBody.message) {
      return jsonError("Payload webchat tidak lengkap.", 400);
    }

    if (normalizedBody.message.length > WEBCHAT_MAX_MESSAGE_CHARS) {
      return jsonError("Pesan webchat terlalu panjang.", 413);
    }

    const normalized = {
      channel: "Website Chat" as const,
      externalUserId:
        normalizedBody.customerId ??
        normalizedBody.phone ??
        normalizedBody.username ??
        normalizedBody.displayName,
      displayName: normalizedBody.displayName,
      messageText: normalizedBody.message,
      messageType: normalizedBody.messageType,
      timestamp: new Date().toISOString(),
      username: normalizedBody.username,
      phone: normalizedBody.phone,
      rawPayload: body as Record<string, unknown>,
    };

    await recordWebhookEvent({
      source: "webchat",
      payload: body as Record<string, unknown>,
      normalized,
      status: "received",
    });

    const result = await processIncomingMessage(normalized);
    return jsonOk(result, { status: 201 });
  } catch (error) {
    console.error("webchat webhook error", error);
    return jsonError("Gagal memproses webhook webchat.", 500);
  }
}

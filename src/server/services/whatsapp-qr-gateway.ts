import { serverEnv } from "@/server/env";

type EvolutionResponse = Record<string, unknown> | Array<Record<string, unknown>>;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getGatewayUrl() {
  return trimTrailingSlash(serverEnv.whatsappQrApiUrl);
}

export function isWhatsAppQrGatewayConfigured() {
  return Boolean(
    serverEnv.whatsappQrApiUrl &&
      serverEnv.whatsappQrApiKey &&
      serverEnv.whatsappQrWebhookSecret,
  );
}

export function getWhatsAppQrWebhookUrl() {
  const url = new URL(
    "/api/webhooks/whatsapp/evolution",
    serverEnv.publicAppUrl,
  );
  url.searchParams.set("secret", serverEnv.whatsappQrWebhookSecret);
  return url.toString();
}

function assertGatewayConfigured() {
  if (!isWhatsAppQrGatewayConfigured()) {
    throw new Error(
      "Konfigurasi WhatsApp QR belum lengkap. Isi WHATSAPP_QR_API_URL, WHATSAPP_QR_API_KEY, dan WHATSAPP_QR_WEBHOOK_SECRET di environment server.",
    );
  }
}

async function evolutionRequest<T extends EvolutionResponse>(
  path: string,
  init?: RequestInit,
) {
  assertGatewayConfigured();

  const response = await fetch(`${getGatewayUrl()}/${path.replace(/^\/+/, "")}`, {
    ...init,
    headers: {
      apikey: serverEnv.whatsappQrApiKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const rawBody = await response.text();
  let body: EvolutionResponse | null = null;

  if (rawBody.trim()) {
    try {
      body = JSON.parse(rawBody) as EvolutionResponse;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const message =
      body && !Array.isArray(body) && typeof body.message === "string"
        ? body.message
        : `Evolution API mengembalikan HTTP ${response.status}.`;
    throw new Error(message);
  }

  return body as T;
}

function encodeInstanceName(instanceName: string) {
  return encodeURIComponent(instanceName);
}

export async function createWhatsAppQrInstance(instanceName: string) {
  return evolutionRequest<Record<string, unknown>>("instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      token: crypto.randomUUID(),
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });
}

export async function connectWhatsAppQrInstance(instanceName: string) {
  return evolutionRequest<Record<string, unknown>>(
    `instance/connect/${encodeInstanceName(instanceName)}`,
  );
}

export async function listWhatsAppQrInstances() {
  return evolutionRequest<Array<Record<string, unknown>>>(
    "instance/fetchInstances",
  );
}

export async function configureWhatsAppQrWebhook(instanceName: string) {
  return evolutionRequest<Record<string, unknown>>(
    `webhook/set/${encodeInstanceName(instanceName)}`,
    {
      method: "POST",
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: getWhatsAppQrWebhookUrl(),
          // Evolution appends the event name after the full URL when this is true.
          // That corrupts query-string webhook secrets, so route events by payload.
          byEvents: false,
          events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
        },
      }),
    },
  );
}

export async function logoutWhatsAppQrInstance(instanceName: string) {
  return evolutionRequest<Record<string, unknown>>(
    `instance/logout/${encodeInstanceName(instanceName)}`,
    { method: "POST" },
  );
}

export async function sendWhatsAppQrText(input: {
  instanceName: string;
  recipientId: string;
  message: string;
}) {
  return evolutionRequest<Record<string, unknown>>(
    `message/sendText/${encodeInstanceName(input.instanceName)}`,
    {
      method: "POST",
      body: JSON.stringify({
        number: input.recipientId.replace(/@s\.whatsapp\.net$/i, "").split(":")[0],
        text: input.message,
      }),
    },
  );
}

export function extractWhatsAppQrCode(payload: EvolutionResponse | null) {
  if (!payload || Array.isArray(payload)) {
    return "";
  }

  const candidates = [
    payload.base64,
    payload.qrcode,
    payload.qr,
    typeof payload.qrcode === "object" && payload.qrcode
      ? (payload.qrcode as { base64?: unknown }).base64
      : null,
    typeof payload.qr === "object" && payload.qr
      ? (payload.qr as { base64?: unknown }).base64
      : null,
  ];

  return candidates.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? "";
}

export function normalizeWhatsAppQrInstance(item: Record<string, unknown>) {
  const nested = item.instance && typeof item.instance === "object"
    ? (item.instance as Record<string, unknown>)
    : {};
  const state = String(
    item.connectionStatus ??
      item.state ??
      nested.connectionStatus ??
      nested.state ??
      nested.status ??
      "disconnected",
  ).toLowerCase();
  const status = state === "open" || state === "connected"
    ? "connected"
    : state === "connecting" || state === "qr"
      ? "connecting"
      : "disconnected";
  const ownerJid = String(item.ownerJid ?? nested.ownerJid ?? "").trim();

  return {
    status: status as "connecting" | "connected" | "disconnected",
    phoneNumber: ownerJid.split("@")[0] || undefined,
    ownerJid: ownerJid || undefined,
  };
}

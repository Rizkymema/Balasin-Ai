import { randomUUID } from "node:crypto";

import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import {
  configureWhatsAppQrWebhook,
  connectWhatsAppQrInstance,
  createWhatsAppQrInstance,
  extractWhatsAppQrCode,
  getWhatsAppQrWebhookUrl,
  isWhatsAppQrGatewayConfigured,
  listWhatsAppQrInstances,
  logoutWhatsAppQrInstance,
  normalizeWhatsAppQrInstance,
} from "@/server/services/whatsapp-qr-gateway";
import {
  getDashboardConfigRecord,
  saveDashboardConfigRecord,
} from "@/server/repositories/dashboard-repository";
import type { DashboardConfig, WhatsAppQrSession } from "@/types/dashboard-config";

export const dynamic = "force-dynamic";

type QrAction = "connect" | "refresh" | "status" | "webhook" | "logout";

function getSessions(config: DashboardConfig) {
  return config.channels.whatsapp.qrSessions ?? [];
}

async function saveSessions(
  config: DashboardConfig,
  qrSessions: WhatsAppQrSession[],
) {
  await saveDashboardConfigRecord({
    ...config,
    channels: {
      ...config.channels,
      whatsapp: {
        ...config.channels.whatsapp,
        qrSessions,
      },
    },
  });
}

function findSession(
  sessions: WhatsAppQrSession[],
  sessionId: string,
) {
  return sessions.find((session) => session.id === sessionId) ?? null;
}

function getInstanceName(item: Record<string, unknown>) {
  const nested = item.instance && typeof item.instance === "object"
    ? (item.instance as Record<string, unknown>)
    : {};
  return String(
    item.name ??
      item.instanceName ??
      nested.instanceName ??
      nested.name ??
      "",
  ).trim();
}

function buildInstanceName() {
  const prefix = process.env.WHATSAPP_QR_INSTANCE_PREFIX?.trim() || "balesin-wa";
  return `${prefix.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
}

async function getSessionStatus(instanceName: string) {
  const instances = await listWhatsAppQrInstances();
  const target = instances.find((item) => getInstanceName(item) === instanceName);
  return target ? normalizeWhatsAppQrInstance(target) : {
    status: "disconnected" as const,
    phoneNumber: undefined,
    ownerJid: undefined,
  };
}

export async function GET() {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  const config = await getDashboardConfigRecord();
  return jsonOk({
    configured: isWhatsAppQrGatewayConfigured(),
    webhookUrl: isWhatsAppQrGatewayConfigured() ? getWhatsAppQrWebhookUrl() : "",
    sessions: getSessions(config),
  });
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  if (!isWhatsAppQrGatewayConfigured()) {
    return jsonError(
      "WhatsApp QR belum dikonfigurasi di server. Isi WHATSAPP_QR_API_URL, WHATSAPP_QR_API_KEY, dan WHATSAPP_QR_WEBHOOK_SECRET.",
      503,
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: QrAction;
      sessionId?: string;
      label?: string;
    };
    const action = body.action ?? "connect";
    const config = await getDashboardConfigRecord();
    const sessions = getSessions(config);

    if (action === "connect") {
      const instanceName = buildInstanceName();
      const label = body.label?.trim() || `WhatsApp QR ${sessions.length + 1}`;
      const created = await createWhatsAppQrInstance(instanceName);
      await configureWhatsAppQrWebhook(instanceName);
      const now = new Date().toISOString();
      const session: WhatsAppQrSession = {
        id: randomUUID(),
        instanceName,
        label: label.slice(0, 80),
        status: "connecting",
        createdAt: now,
        lastCheckedAt: now,
      };
      await saveSessions(config, [session, ...sessions]);
      return jsonOk({
        session,
        qrCode: extractWhatsAppQrCode(created),
        webhookUrl: getWhatsAppQrWebhookUrl(),
      }, { status: 201 });
    }

    const session = findSession(sessions, body.sessionId?.trim() ?? "");
    if (!session) {
      return jsonError("Sesi WhatsApp QR tidak ditemukan.", 404);
    }

    if (action === "refresh") {
      const refreshed = await connectWhatsAppQrInstance(session.instanceName);
      return jsonOk({
        session,
        qrCode: extractWhatsAppQrCode(refreshed),
      });
    }

    if (action === "webhook") {
      await configureWhatsAppQrWebhook(session.instanceName);
      return jsonOk({ session, webhookUrl: getWhatsAppQrWebhookUrl() });
    }

    if (action === "logout") {
      await logoutWhatsAppQrInstance(session.instanceName);
      const nextSession: WhatsAppQrSession = {
        ...session,
        status: "disconnected",
        lastCheckedAt: new Date().toISOString(),
      };
      await saveSessions(
        config,
        sessions.map((item) => item.id === session.id ? nextSession : item),
      );
      return jsonOk({ session: nextSession });
    }

    const gatewayStatus = await getSessionStatus(session.instanceName);
    const nextSession: WhatsAppQrSession = {
      ...session,
      ...gatewayStatus,
      lastCheckedAt: new Date().toISOString(),
      ...(gatewayStatus.status === "connected"
        ? { lastConnectedAt: session.lastConnectedAt ?? new Date().toISOString() }
        : {}),
    };
    await saveSessions(
      config,
      sessions.map((item) => item.id === session.id ? nextSession : item),
    );
    return jsonOk({ session: nextSession });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal memproses koneksi WhatsApp QR.",
      502,
    );
  }
}

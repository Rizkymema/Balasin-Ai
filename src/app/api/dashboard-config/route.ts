import {
  getDashboardConfigPublicRecord,
} from "@/server/repositories/dashboard-repository";
import type { DashboardConfig } from "@/types/dashboard-config";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { saveDashboardConfigAndIntegrate } from "@/server/services/chatbot-runtime-integration";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  return jsonOk(await getDashboardConfigPublicRecord());
}

export async function PUT(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json()) as DashboardConfig;
    const result = await saveDashboardConfigAndIntegrate(body);
    if (
      result.integration.sourceSync &&
      result.integration.sourceSync.syncedCount === 0 &&
      result.integration.sourceSync.failures.length > 0
    ) {
      return jsonError(
        "Konfigurasi tersimpan, tetapi Knowledge Base baru belum berhasil disinkronkan.",
        422,
        result.integration.sourceSync.failures,
      );
    }
    return jsonOk(result.config);
  } catch (err) {
    console.error("[DASHBOARD_CONFIG_SAVE_ERROR]", err);
    return jsonError("Gagal menyimpan dashboard config.", 500);
  }
}

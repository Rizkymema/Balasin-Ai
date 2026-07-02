import {
  getDashboardConfigPublicRecord,
  saveDashboardConfigRecord,
} from "@/server/repositories/dashboard-repository";
import type { DashboardConfig } from "@/types/dashboard-config";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";

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
    await saveDashboardConfigRecord(body);
    return jsonOk(await getDashboardConfigPublicRecord());
  } catch (err) {
    console.error("[DASHBOARD_CONFIG_SAVE_ERROR]", err);
    return jsonError("Gagal menyimpan dashboard config.", 500);
  }
}

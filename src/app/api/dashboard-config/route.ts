import { getDashboardConfigRecord, saveDashboardConfigRecord } from "@/server/repositories/dashboard-repository";
import type { DashboardConfig } from "@/types/dashboard-config";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  return jsonOk(getDashboardConfigRecord());
}

export async function PUT(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json()) as DashboardConfig;
    saveDashboardConfigRecord(body);
    return jsonOk(body);
  } catch {
    return jsonError("Gagal menyimpan dashboard config.", 500);
  }
}

import { getDashboardOperationsRecord, saveDashboardOperationsRecord } from "@/server/repositories/dashboard-repository";
import type { DashboardOperationsData } from "@/types/operations";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { scheduleOperationalJobs } from "@/server/services/automation-service";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  return jsonOk(getDashboardOperationsRecord());
}

export async function PUT(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json()) as DashboardOperationsData;
    saveDashboardOperationsRecord(body);
    scheduleOperationalJobs();
    return jsonOk(body);
  } catch {
    return jsonError("Gagal menyimpan data operasional.", 500);
  }
}

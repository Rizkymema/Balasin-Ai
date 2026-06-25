import { getDashboardOperationsRecord, saveDashboardOperationsRecord } from "@/server/repositories/dashboard-repository";
import type { DashboardOperationsData } from "@/types/operations";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { scheduleOperationalJobs } from "@/server/services/automation-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  return jsonOk(await getDashboardOperationsRecord());
}

export async function PUT(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json()) as DashboardOperationsData;
    await saveDashboardOperationsRecord(body);
    await scheduleOperationalJobs();
    return jsonOk(await getDashboardOperationsRecord());
  } catch {
    return jsonError("Gagal menyimpan data operasional.", 500);
  }
}

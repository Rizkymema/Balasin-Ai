import { getDashboardConfigRecord } from "@/server/repositories/dashboard-repository";
import { serverEnv } from "@/server/env";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { runDueJobs, scheduleOperationalJobs } from "@/server/services/automation-service";

export async function POST(request: Request) {
  const secret = request.headers.get("x-worker-secret")?.trim() ?? "";
  const config = await getDashboardConfigRecord();
  const authorizedBySecret =
    secret.length > 0 &&
    [config.runtime.workerSecret, serverEnv.workerSecret].some(
      (expected) => expected.trim().length > 0 && secret === expected.trim(),
    );

  if (!authorizedBySecret) {
    const { response } = await requireApiSession();
    if (response) {
      return response;
    }
  }

  await scheduleOperationalJobs();
  const results = await runDueJobs();
  return jsonOk({ processed: results.length, results });
}

export async function GET() {
  return jsonError("Method not allowed.", 405);
}

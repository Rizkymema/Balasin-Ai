import { jsonOk, requireApiSession } from "@/server/http";
import { getWorkerJobs } from "@/server/services/automation-service";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  return jsonOk(getWorkerJobs());
}

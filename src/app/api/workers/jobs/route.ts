import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { getWorkerJobs, pruneObsoleteJobs } from "@/server/services/automation-service";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  return jsonOk(await getWorkerJobs());
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
    };

    if (body.action !== "prune_obsolete_jobs") {
      return jsonError("Unsupported worker job action.", 400);
    }

    return jsonOk(await pruneObsoleteJobs());
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal membersihkan worker jobs.",
      500,
    );
  }
}

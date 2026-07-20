import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { testApiIntegrationConnection } from "@/server/services/automation-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json()) as { integrationId?: string };
    const integrationId = body.integrationId?.trim();
    if (!integrationId || integrationId.length > 128) {
      return jsonError("ID integrasi API tidak valid.", 400);
    }

    return jsonOk(await testApiIntegrationConnection(integrationId));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal menguji integrasi API.",
      400,
    );
  }
}

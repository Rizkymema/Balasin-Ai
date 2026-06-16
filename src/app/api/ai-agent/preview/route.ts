import { defaultDashboardConfig, mergeDashboardConfig } from "@/lib/dashboard-config";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { generateReplyDecision } from "@/server/services/reply-engine";
import type { DashboardConfig } from "@/types/dashboard-config";

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json()) as {
      message?: string;
      config?: DashboardConfig;
    };

    if (!body.message?.trim()) {
      return jsonError("Pesan uji wajib diisi.", 400);
    }

    const config = mergeDashboardConfig(defaultDashboardConfig, body.config);
    const decision = await generateReplyDecision(body.message.trim(), config);

    return jsonOk(decision);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal membuat preview balasan AI.",
      500,
    );
  }
}

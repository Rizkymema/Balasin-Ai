import { saveDashboardConfigRecord } from "@/server/repositories/dashboard-repository";
import { getDashboardConfigRecord } from "@/server/repositories/dashboard-repository";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { syncKnowledgeSources } from "@/server/services/knowledge-source-sync";

function normalizeUrls(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const currentConfig = await getDashboardConfigRecord();
    const body = (await request.json()) as {
      websiteUrls?: string[];
      googleSheetUrls?: string[];
    };

    const nextConfig = {
      ...currentConfig,
      knowledgeBase: {
        ...currentConfig.knowledgeBase,
        websiteUrls: normalizeUrls(body.websiteUrls),
        googleSheetUrls: normalizeUrls(body.googleSheetUrls),
      },
    };

    await saveDashboardConfigRecord(nextConfig);
    const result = await syncKnowledgeSources(nextConfig);
    const refreshedConfig = await getDashboardConfigRecord();

    return jsonOk({
      ...result,
      documents: refreshedConfig.knowledgeBase.documents,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Sinkronisasi knowledge source gagal.",
      500,
    );
  }
}

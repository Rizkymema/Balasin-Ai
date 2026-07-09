import { KNOWLEDGE_SOURCE_MAX_URLS } from "@/constants/knowledge-security";
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
    .filter(Boolean)
    .slice(0, KNOWLEDGE_SOURCE_MAX_URLS);
}

function isGoogleSheetUrl(url: string) {
  return /docs\.google\.com\/spreadsheets/i.test(url);
}

function splitKnowledgeSourceUrls(input: {
  websiteUrls?: string[];
  googleSheetUrls?: string[];
}) {
  const websiteUrls = normalizeUrls(input.websiteUrls);
  const explicitSheetUrls = normalizeUrls(input.googleSheetUrls);
  const sheetUrlsFromWebsiteInput = websiteUrls.filter(isGoogleSheetUrl);
  const regularWebsiteUrls = websiteUrls.filter((url) => !isGoogleSheetUrl(url));

  return {
    websiteUrls: regularWebsiteUrls.slice(0, KNOWLEDGE_SOURCE_MAX_URLS),
    googleSheetUrls: Array.from(
      new Set([...explicitSheetUrls, ...sheetUrlsFromWebsiteInput]),
    ).slice(0, KNOWLEDGE_SOURCE_MAX_URLS),
  };
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
    const sourceUrls = splitKnowledgeSourceUrls(body);

    const nextConfig = {
      ...currentConfig,
      knowledgeBase: {
        ...currentConfig.knowledgeBase,
        websiteUrls: sourceUrls.websiteUrls,
        googleSheetUrls: sourceUrls.googleSheetUrls,
      },
    };

    await saveDashboardConfigRecord(nextConfig);
    const result = await syncKnowledgeSources(nextConfig);
    const refreshedConfig = await getDashboardConfigRecord();

    if (result.syncedCount === 0 && result.failures.length > 0) {
      return jsonError(
        "Tidak ada knowledge source yang berhasil disinkronkan.",
        422,
        result.failures,
      );
    }

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

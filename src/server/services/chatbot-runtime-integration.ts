import {
  getDashboardConfigRecord,
  getDashboardConfigPublicRecord,
  saveDashboardConfigRecord,
} from "@/server/repositories/dashboard-repository";
import { syncKnowledgeSources } from "@/server/services/knowledge-source-sync";
import { KNOWLEDGE_SOURCE_MAX_URLS } from "@/constants/knowledge-security";
import { parseCustomInstructions } from "@/lib/custom-instructions";
import type { DashboardConfig } from "@/types/dashboard-config";

function normalizeUrls(urls: unknown) {
  if (!Array.isArray(urls)) {
    return [];
  }

  return Array.from(
    new Set(
      urls
        .map((url) => (typeof url === "string" ? url.trim() : ""))
        .filter(Boolean),
    ),
  ).slice(0, KNOWLEDGE_SOURCE_MAX_URLS);
}

function isGoogleSheetUrl(url: string) {
  return /docs\.google\.com\/spreadsheets/i.test(url);
}

function normalizeKnowledgeSourceLists(config: DashboardConfig): DashboardConfig {
  const incomingWebsiteUrls = normalizeUrls(config.knowledgeBase.websiteUrls);
  const googleSheetUrls = normalizeUrls([
    ...config.knowledgeBase.googleSheetUrls,
    ...incomingWebsiteUrls.filter(isGoogleSheetUrl),
  ]);
  const websiteUrls = incomingWebsiteUrls.filter((url) => !isGoogleSheetUrl(url));

  return {
    ...config,
    knowledgeBase: {
      ...config.knowledgeBase,
      websiteUrls,
      googleSheetUrls,
    },
  };
}

function haveKnowledgeSourcesChanged(
  current: DashboardConfig,
  next: DashboardConfig,
) {
  const serialize = (config: DashboardConfig) =>
    JSON.stringify({
      websiteUrls: [...config.knowledgeBase.websiteUrls].sort(),
      googleSheetUrls: [...config.knowledgeBase.googleSheetUrls].sort(),
    });

  return serialize(current) !== serialize(next);
}

export async function saveDashboardConfigAndIntegrate(
  incomingConfig: DashboardConfig,
) {
  const currentConfig = normalizeKnowledgeSourceLists(
    await getDashboardConfigRecord(),
  );
  const nextConfig = normalizeKnowledgeSourceLists(incomingConfig);
  const knowledgeSourcesChanged = haveKnowledgeSourcesChanged(
    currentConfig,
    nextConfig,
  );

  await saveDashboardConfigRecord(nextConfig);

  let sourceSync: Awaited<ReturnType<typeof syncKnowledgeSources>> | null = null;
  if (knowledgeSourcesChanged) {
    sourceSync = await syncKnowledgeSources(await getDashboardConfigRecord());
  }
  const customInstructions = parseCustomInstructions(
    nextConfig.aiAgent.replyInstructions,
  );

  return {
    config: await getDashboardConfigPublicRecord(),
    integration: {
      knowledgeSourcesChanged,
      sourceSync,
      aiAgentsApplied: nextConfig.automation.aiAgents.length,
      customInstructionsApplied: Boolean(
        nextConfig.aiAgent.replyInstructions.trim(),
      ),
      personaConfigured: Boolean(customInstructions.persona),
      toneConfigured: Boolean(customInstructions.tone),
      guardrailsConfigured: Boolean(customInstructions.guardrails),
    },
  };
}

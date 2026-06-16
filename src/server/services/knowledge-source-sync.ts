import { URL } from "node:url";

import {
  deleteKnowledgeDocument,
  ingestKnowledgeDocument,
  ingestKnowledgeTextSource,
} from "@/server/repositories/dashboard-repository";
import type { DashboardConfig, KnowledgeDocument } from "@/types/dashboard-config";

type SyncFailure = {
  url: string;
  reason: string;
};

function uniqueUrls(urls: string[]) {
  return Array.from(
    new Set(urls.map((item) => item.trim()).filter(Boolean)),
  );
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6|tr)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s{2,}/g, " ")
      .trim(),
  );
}

function extractHtmlTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.trim() || "";
}

function buildWebsiteName(url: string, title: string) {
  if (title) {
    return title;
  }

  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.hostname}${path}`;
  } catch {
    return url;
  }
}

function extractGoogleSheetId(url: string) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  return match?.[1] ?? "";
}

function extractGoogleSheetGid(url: string) {
  const hashMatch = url.match(/[?#&]gid=([0-9]+)/i);
  return hashMatch?.[1] ?? "0";
}

function buildGoogleSheetExportCandidates(url: string) {
  if (/\/export\?/i.test(url)) {
    return [url];
  }

  const sheetId = extractGoogleSheetId(url);
  if (!sheetId) {
    return [url];
  }

  const gid = extractGoogleSheetGid(url);

  return [
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
  ];
}

async function fetchTextOrThrow(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "BalesinAI/1.0 Knowledge Sync",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return {
    contentType: response.headers.get("content-type") ?? "",
    text: await response.text(),
  };
}

async function fetchArrayBufferOrThrow(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "BalesinAI/1.0 Knowledge Sync",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return {
    contentType: response.headers.get("content-type") ?? "",
    buffer: Buffer.from(await response.arrayBuffer()),
  };
}

async function syncWebsiteSource(url: string) {
  const payload = await fetchTextOrThrow(url);
  const title = extractHtmlTitle(payload.text);
  const text = htmlToText(payload.text);

  if (text.length < 40) {
    throw new Error("Konten website terlalu sedikit untuk dijadikan knowledge.");
  }

  return ingestKnowledgeTextSource({
    name: buildWebsiteName(url, title),
    content: text,
    sourceType: "website",
    sourceUrl: url,
  });
}

async function syncGoogleSheetSource(url: string) {
  const candidates = buildGoogleSheetExportCandidates(url);
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      const payload = await fetchArrayBufferOrThrow(candidate);
      const extension = payload.contentType.includes("spreadsheet")
        ? ".xlsx"
        : candidate.includes("format=csv")
          ? ".csv"
          : ".xlsx";

      return ingestKnowledgeDocument({
        id: `google_sheet-${extractGoogleSheetId(url) || "knowledge"}`,
        fileName: `google-sheet${extension}`,
        mimeType:
          extension === ".csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: payload.buffer,
        sourceType: "google_sheet",
        sourceUrl: url,
      });
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Gagal membaca Google Sheet.");
    }
  }

  throw lastError ?? new Error("Google Sheet belum bisa dibaca.");
}

async function pruneDetachedSources(
  documents: KnowledgeDocument[],
  websiteUrls: string[],
  googleSheetUrls: string[],
) {
  const activeWebsiteUrls = new Set(websiteUrls);
  const activeSheetUrls = new Set(googleSheetUrls);

  const staleDocuments = documents.filter((document) => {
    if (document.sourceType === "website") {
      return document.sourceUrl && !activeWebsiteUrls.has(document.sourceUrl);
    }

    if (document.sourceType === "google_sheet") {
      return document.sourceUrl && !activeSheetUrls.has(document.sourceUrl);
    }

    return false;
  });

  for (const document of staleDocuments) {
    await deleteKnowledgeDocument(document.id);
  }
}

export async function syncKnowledgeSources(config: DashboardConfig) {
  const websiteUrls = uniqueUrls(config.knowledgeBase.websiteUrls);
  const googleSheetUrls = uniqueUrls(config.knowledgeBase.googleSheetUrls);
  const failures: SyncFailure[] = [];
  const syncedDocuments: Array<{ id: string; name: string; sourceType: string }> = [];

  await pruneDetachedSources(
    config.knowledgeBase.documents,
    websiteUrls,
    googleSheetUrls,
  );

  for (const url of websiteUrls) {
    try {
      const result = await syncWebsiteSource(url);
      syncedDocuments.push({
        id: result.document.id,
        name: result.document.name,
        sourceType: "website",
      });
    } catch (error) {
      failures.push({
        url,
        reason:
          error instanceof Error ? error.message : "Website source gagal disinkronkan.",
      });
    }
  }

  for (const url of googleSheetUrls) {
    try {
      const result = await syncGoogleSheetSource(url);
      syncedDocuments.push({
        id: result.document.id,
        name: result.document.name,
        sourceType: "google_sheet",
      });
    } catch (error) {
      failures.push({
        url,
        reason:
          error instanceof Error
            ? error.message
            : "Google Sheet source gagal disinkronkan.",
      });
    }
  }

  return {
    syncedCount: syncedDocuments.length,
    syncedDocuments,
    failures,
  };
}

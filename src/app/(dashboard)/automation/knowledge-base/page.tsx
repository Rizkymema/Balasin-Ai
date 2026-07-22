"use client";

import { useCallback, useEffect, useMemo, useState, useRef, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Database,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";

function isGoogleSheetUrl(url: string) {
  return /docs\.google\.com\/spreadsheets/i.test(url);
}

function getSourceDisplayName(url: string, fallback: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    return fallback;
  }
}

type RuntimeIntegrationStatus = {
  connected: boolean;
  conversations: number;
  activeAiAgents: number;
  customInstructionsApplied: boolean;
  faqs: number;
  documents: number;
  chunks: number;
  lastKnowledgeSyncAt: string | null;
};

export default function KnowledgeBasePage() {
  const { config, patchConfig, refreshConfig, isLoading } = useDashboardConfig();
  const [isSaved, setIsSaved] = useState(false);
  const [kbSubsection, setKbSubsection] = useState("resources");

  const [inputMethodActive, setInputMethodActive] = useState<"none" | "url" | "sheet" | "text">("none");
  const [kbUrlInput, setKbUrlInput] = useState("");
  const [kbSheetInput, setKbSheetInput] = useState("");
  const [kbTextTitle, setKbTextTitle] = useState("");
  const [kbTextContent, setKbTextContent] = useState("");
  const [syncError, setSyncError] = useState("");
  const [ingestSuccess, setIngestSuccess] = useState("");
  const [isSyncingKbSources, setIsSyncingKbSources] = useState(false);
  const [isIngestingText, setIsIngestingText] = useState(false);
  const [isUploadingKbFile, setIsUploadingKbFile] = useState(false);
  const [kbSearchQuery, setKbSearchQuery] = useState("");
  const [isSavingInstructions, setIsSavingInstructions] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeIntegrationStatus | null>(null);

  const [personaConfig, setPersonaConfig] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [guardrails, setGuardrails] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitializedRef = useRef(false);

  const refreshRuntimeStatus = useCallback(async () => {
    const response = await fetch("/api/assistant/runtime-status", {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      ok: boolean;
      data: RuntimeIntegrationStatus;
    };
    setRuntimeStatus(payload.data);
  }, []);

  useEffect(() => {
    if (isLoading || !config || isInitializedRef.current) return;
    isInitializedRef.current = true;
    const rawPrompt = config.aiAgent.replyInstructions || "";
    const personaMatch = rawPrompt.match(/\[PERSONA\]\r?\n([\s\S]*?)(?=\r?\n+\[TONE\]|$)/i);
    const toneMatch = rawPrompt.match(/\[TONE\]\r?\n([\s\S]*?)(?=\r?\n+\[GUARDRAILS\]|$)/i);
    const guardMatch = rawPrompt.match(/\[GUARDRAILS\]\r?\n([\s\S]*?)$/i);

    if (personaMatch || toneMatch || guardMatch) {
      setPersonaConfig(personaMatch ? personaMatch[1].trim() : "");
      setToneOfVoice(toneMatch ? toneMatch[1].trim() : "");
      setGuardrails(guardMatch ? guardMatch[1].trim() : "");
    } else {
      setPersonaConfig(rawPrompt);
      setToneOfVoice("");
      setGuardrails("");
    }
  }, [config, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      void refreshRuntimeStatus();
    }
  }, [isLoading, config, refreshRuntimeStatus]);

  const websiteUrls = useMemo(
    () => config?.knowledgeBase.websiteUrls.filter((url) => !isGoogleSheetUrl(url)) || [],
    [config],
  );
  const googleSheetUrls = useMemo(
    () =>
      Array.from(
        new Set([
          ...(config?.knowledgeBase.googleSheetUrls || []),
          ...(config?.knowledgeBase.websiteUrls.filter(isGoogleSheetUrl) || []),
        ]),
      ),
    [config],
  );
  const urlCount = websiteUrls.length;
  const sheetCount = googleSheetUrls.length;
  const docCount = useMemo(
    () => config?.knowledgeBase.documents.filter((d) => d.sourceType === "upload" && !d.name.endsWith(".txt")).length || 0,
    [config]
  );
  const textCount = useMemo(
    () => config?.knowledgeBase.documents.filter((d) => d.name.endsWith(".txt")).length || 0,
    [config]
  );
  const unansweredQuestions = config?.knowledgeBase.pendingQuestions ?? [];

  const sourceItems = useMemo(() => {
    const documents = config?.knowledgeBase.documents || [];
    const indexedSourceUrls = new Set(
      documents.map((document) => document.sourceUrl).filter(Boolean),
    );
    const pendingSources = [
      ...websiteUrls.map((sourceUrl) => ({ sourceUrl, sourceType: "website" as const })),
      ...googleSheetUrls.map((sourceUrl) => ({ sourceUrl, sourceType: "google_sheet" as const })),
    ]
      .filter(({ sourceUrl }) => !indexedSourceUrls.has(sourceUrl))
      .map(({ sourceUrl, sourceType }) => ({
        id: `pending-${sourceType}-${sourceUrl}`,
        name: getSourceDisplayName(
          sourceUrl,
          sourceType === "google_sheet" ? "Google Sheet" : "External URL",
        ),
        size: "Belum diindeks",
        status: "processing" as const,
        progress: 0,
        sourceType,
        sourceUrl,
        isIndexed: false,
      }));

    return [
      ...documents.map((document) => ({ ...document, isIndexed: true })),
      ...pendingSources,
    ];
  }, [config, googleSheetUrls, websiteUrls]);

  const filteredSourceItems = useMemo(() => {
    const query = kbSearchQuery.trim().toLowerCase();
    if (!query) return sourceItems;

    return sourceItems.filter((source) =>
      `${source.name} ${source.sourceUrl ?? ""}`.toLowerCase().includes(query),
    );
  }, [kbSearchQuery, sourceItems]);

  type SyncResponse = {
    ok: boolean;
    data?: {
      failures?: Array<{ url: string; reason: string }>;
      syncedCount?: number;
      syncedDocuments?: Array<{
        id: string;
        name: string;
        sourceType: string;
        chunkCount: number;
      }>;
    };
    error?: string;
    details?: Array<{ url: string; reason: string }>;
  };

  const formatSyncFailureMessage = (payload: SyncResponse) => {
    const failures = payload.data?.failures ?? payload.details ?? [];
    if (failures.length === 0) {
      return payload.error || "Sinkronisasi knowledge source gagal.";
    }

    return failures
      .map((failure) => `${failure.url}: ${failure.reason}`)
      .join("\n");
  };

  const parseSourceUrls = (value: string) =>
    value
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

  const syncKnowledgeSourceUrls = async (params: {
    incomingWebsiteUrls?: string[];
    incomingGoogleSheetUrls?: string[];
  }) => {
    setSyncError("");
    setIngestSuccess("");
    const combinedWebsiteUrls = Array.from(
      new Set([...(websiteUrls || []), ...(params.incomingWebsiteUrls || [])]),
    );
    const combinedGoogleSheetUrls = Array.from(
      new Set([...(googleSheetUrls || []), ...(params.incomingGoogleSheetUrls || [])]),
    );

    const response = await fetch("/api/knowledge/sources/sync", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        websiteUrls: combinedWebsiteUrls,
        googleSheetUrls: combinedGoogleSheetUrls,
      }),
    });
    const payload = (await response.json().catch(() => null)) as SyncResponse | null;

    if (!response.ok || !payload?.ok) {
      throw new Error(
        payload ? formatSyncFailureMessage(payload) : "Sinkronisasi knowledge source gagal.",
      );
    }

    if (payload.data?.failures?.length) {
      setSyncError(formatSyncFailureMessage(payload));
    }

    const indexedChunks = (payload.data?.syncedDocuments ?? []).reduce(
      (total, document) => total + document.chunkCount,
      0,
    );
    setIngestSuccess(
      `Sumber berhasil diindeks: ${indexedChunks} potongan data siap digunakan chatbot.`,
    );
  };

  const handleSyncKbUrl = async (event: FormEvent) => {
    event.preventDefault();
    if (!kbUrlInput.trim()) return;
    setIsSyncingKbSources(true);
    const incomingUrls = parseSourceUrls(kbUrlInput);
    const incomingSheetUrls = incomingUrls.filter(isGoogleSheetUrl);
    const incomingWebsiteUrls = incomingUrls.filter((url) => !isGoogleSheetUrl(url));
    try {
      await syncKnowledgeSourceUrls({
        incomingWebsiteUrls,
        incomingGoogleSheetUrls: incomingSheetUrls,
      });
      await refreshConfig();
      await refreshRuntimeStatus();
      setKbUrlInput("");
      setInputMethodActive("none");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sinkronisasi URL gagal.";
      setSyncError(message);
      alert(message);
    } finally {
      setIsSyncingKbSources(false);
    }
  };

  const handleSyncKbSheet = async (event: FormEvent) => {
    event.preventDefault();
    if (!kbSheetInput.trim()) return;
    setIsSyncingKbSources(true);
    try {
      await syncKnowledgeSourceUrls({
        incomingGoogleSheetUrls: parseSourceUrls(kbSheetInput),
      });
      await refreshConfig();
      await refreshRuntimeStatus();
      setKbSheetInput("");
      setInputMethodActive("none");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sinkronisasi Google Sheet gagal.";
      setSyncError(message);
      alert(message);
    } finally {
      setIsSyncingKbSources(false);
    }
  };

  const handleResyncKnowledgeSources = async () => {
    setIsSyncingKbSources(true);
    try {
      await syncKnowledgeSourceUrls({});
      await refreshConfig();
      await refreshRuntimeStatus();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sinkronisasi source gagal.";
      setSyncError(message);
      alert(message);
    } finally {
      setIsSyncingKbSources(false);
    }
  };

  const handleIngestKbText = async (event: FormEvent) => {
    event.preventDefault();
    if (!kbTextTitle.trim() || !kbTextContent.trim()) return;
    setIsIngestingText(true);
    setSyncError("");
    setIngestSuccess("");
    try {
      const response = await fetch("/api/knowledge/text", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: kbTextTitle.trim() + ".txt", content: kbTextContent.trim() }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        data?: { chunkCount?: number };
        error?: string;
      } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Gagal menyimpan teks fakta.");
      }
      await patchConfig((current) => ({
        ...current,
        knowledgeBase: {
          ...current.knowledgeBase,
          pendingQuestions: (current.knowledgeBase.pendingQuestions ?? []).filter(
            (item) => item.question !== kbTextTitle.trim(),
          ),
        },
      }));
      await refreshConfig();
      await refreshRuntimeStatus();
      setKbTextTitle("");
      setKbTextContent("");
      setInputMethodActive("none");
      setIngestSuccess(
        `Konten teks berhasil diindeks: ${payload.data?.chunkCount ?? 0} potongan data siap digunakan chatbot.`,
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Simpan teks gagal.");
    } finally {
      setIsIngestingText(false);
    }
  };

  const handleUploadKbFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingKbFile(true);
    setSyncError("");
    setIngestSuccess("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/knowledge/documents/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        data?: { chunkCount?: number };
        error?: string;
      } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Gagal mengunggah file.");
      }
      await refreshConfig();
      await refreshRuntimeStatus();
      setIngestSuccess(
        `File berhasil diindeks: ${payload.data?.chunkCount ?? 0} potongan data siap digunakan chatbot.`,
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal mengunggah berkas.");
    } finally {
      setIsUploadingKbFile(false);
      event.target.value = "";
    }
  };

  const handleDeleteKbDocument = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus referensi ini?")) return;
    try {
      await fetch(`/api/knowledge/documents/${id}`, { method: "DELETE", credentials: "include" });
      await refreshConfig();
      await refreshRuntimeStatus();
    } catch {
      alert("Gagal menghapus dokumen.");
    }
  };

  const handleAnswerQuestion = (question: string) => {
    setKbTextTitle(question);
    setKbTextContent("");
    setInputMethodActive("text");
    setKbSubsection("resources");
  };

  const handleDismissQuestion = async (id: string) => {
    try {
      await patchConfig((current) => ({
        ...current,
        knowledgeBase: {
          ...current.knowledgeBase,
          pendingQuestions: (current.knowledgeBase.pendingQuestions ?? []).filter(
            (item) => item.id !== id,
          ),
        },
      }));
    } catch {
      alert("Gagal mengabaikan kandidat pertanyaan.");
    }
  };

  const handleSaveInstructions = async (event: FormEvent) => {
    event.preventDefault();
    setIsSavingInstructions(true);
    try {
      const assembledPrompt = `[PERSONA]\n${personaConfig.trim()}\n\n[TONE]\n${toneOfVoice.trim()}\n\n[GUARDRAILS]\n${guardrails.trim()}`;
      await patchConfig((current) => ({
        ...current,
        aiAgent: { ...current.aiAgent, replyInstructions: assembledPrompt },
      }));
      await refreshConfig();
      await refreshRuntimeStatus();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menyimpan instruksi custom.");
    } finally {
      setIsSavingInstructions(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/automation" className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition">
              <ArrowLeft className="h-3.5 w-3.5" />
              Automation
            </Link>
          </div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white">
            <Database className="h-6 w-6 text-cyan-400" />
            Knowledge Base
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Kelola sumber pengetahuan AI — FAQ, dokumen, URL, dan custom instructions.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/20 px-4 py-2.5 text-xs">
          <MessageSquare className="h-4 w-4 text-cyan-400" />
          <span className="text-slate-300">
            {runtimeStatus?.connected ? "Terintegrasi" : "Belum aktif"} dengan{" "}
            <Link href="/inbox" className="font-bold text-cyan-400 hover:underline">
              {runtimeStatus?.conversations ?? 0} Conversations
            </Link>{" "}
            — {runtimeStatus?.activeAiAgents ?? 0} Agent aktif, {runtimeStatus?.chunks ?? 0} chunks siap
          </span>
          <span className={`flex h-2 w-2 rounded-full ${runtimeStatus?.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
        </div>
      </div>

      {/* KB Stats Banner */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "URL Tersinkron", count: urlCount, icon: Link2, color: "cyan" },
          { label: "Google Sheet", count: sheetCount, icon: Database, color: "emerald" },
          { label: "File Upload", count: docCount, icon: Upload, color: "purple" },
          { label: "Teks Fakta", count: textCount, icon: FileText, color: "cyan" },
        ].map(({ label, count, icon: Icon, color }) => (
          <div
            key={label}
            className={`rounded-xl border border-${color}-500/15 bg-${color}-950/10 p-4 text-center`}
          >
            <Icon className={`mx-auto mb-1.5 h-5 w-5 text-${color}-400`} />
            <div className={`text-2xl font-extrabold text-${color}-300`}>{count}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {syncError && (
        <div className="rounded-xl border border-red-500/25 bg-red-950/20 p-4 text-xs text-red-200">
          <div className="mb-1 flex items-center gap-2 font-bold text-red-300">
            <AlertTriangle className="h-4 w-4" />
            Sinkronisasi knowledge gagal sebagian
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-red-100/90">
            {syncError}
          </pre>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-white/8 space-x-6">
        {[
          { id: "resources", label: "AI Resources" },
          { id: "instructions", label: "Custom Instructions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setKbSubsection(tab.id)}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              kbSubsection === tab.id
                ? "border-cyan-400 text-cyan-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SubSection: AI Resources */}
      {kbSubsection === "resources" && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Existing Sources */}
            <Card className="glass-panel p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Existing Sources</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Seluruh referensi yang sudah dipelajari AI.</p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Cari referensi..."
                    className="h-9 pl-9 text-xs"
                    value={kbSearchQuery}
                    onChange={(e) => setKbSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredSourceItems.length === 0 ? (
                  <EmptyState
                    icon={<Database className="h-10 w-10 text-slate-500" />}
                    title="Belum ada referensi"
                    description="Gunakan Metode Input di samping kanan untuk memasukkan data."
                    className="min-h-[200px]"
                  />
                ) : (
                  filteredSourceItems.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-xl border border-white/6 bg-white/2 p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/10 bg-cyan-950/20 text-cyan-400">
                          {doc.name.endsWith(".txt") ? (
                            <FileText className="h-4.5 w-4.5" />
                          ) : doc.sourceType === "google_sheet" ? (
                            <Database className="h-4.5 w-4.5" />
                          ) : doc.sourceType === "website" ? (
                            <Link2 className="h-4.5 w-4.5" />
                          ) : (
                            <Upload className="h-4.5 w-4.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-bold text-white">{doc.name}</span>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-500">
                            <span>{doc.size}</span>
                            <span className="rounded-full border border-white/8 px-2 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">
                              {doc.name.endsWith(".txt")
                                ? "Text Content"
                                : doc.sourceType === "google_sheet"
                                  ? "Google Sheet"
                                  : doc.sourceType === "website"
                                    ? "External URL"
                                    : "File Upload"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {doc.sourceUrl && (
                          <a
                            href={doc.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-400/20 px-2.5 text-[10px] font-bold text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-950/30"
                          >
                            Buka
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {doc.isIndexed ? (
                          <span className="hidden items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 sm:flex">
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            Terserap AI
                          </span>
                        ) : (
                          <button
                            onClick={() => void handleResyncKnowledgeSources()}
                            disabled={isSyncingKbSources}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-400/20 px-2.5 text-[10px] font-bold text-amber-300 transition hover:border-amber-400/50 hover:bg-amber-950/30 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${isSyncingKbSources ? "animate-spin" : ""}`} />
                            Sinkronkan
                          </button>
                        )}
                        {doc.isIndexed && (
                          <button
                            onClick={() => handleDeleteKbDocument(doc.id)}
                            className="rounded p-1.5 text-slate-500 transition hover:text-red-400"
                            aria-label={`Hapus ${doc.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Unanswered Questions */}
            <Card className="glass-panel p-6 border-amber-500/25">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Unanswered Questions</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-normal">
                Pertanyaan pelanggan yang gagal dijawab AI. Tambahkan ke Knowledge Base untuk meningkatkan akurasi.
              </p>
              <div className="space-y-3">
                {unansweredQuestions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center text-xs font-semibold text-slate-500">
                    Tidak ada pertanyaan tak terjawab saat ini. Sistem bekerja sempurna!
                  </div>
                ) : (
                  unansweredQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{question.question}</p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          Kategori: {question.category} - muncul {question.occurrences}x dari {question.sourceChannel}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button onClick={() => handleAnswerQuestion(question.question)} className="text-[10px] h-8 px-3 rounded-lg">
                          Jawab via Text Content
                        </Button>
                        <button
                          onClick={() => void handleDismissQuestion(question.id)}
                          className="text-[10px] h-8 px-3 rounded-lg border border-white/10 text-slate-400 hover:text-white"
                        >
                          Abaikan
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Methods Input Side Panel */}
          <div className="space-y-6">
            <Card className="glass-panel p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4">Metode Input</h3>
              <div className="space-y-3">
                {/* External URL Card */}
                <div
                  onClick={() => setInputMethodActive("url")}
                  className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer ${
                    inputMethodActive === "url"
                      ? "border-cyan-400 bg-cyan-950/20"
                      : "border-white/8 bg-white/[0.02] hover:border-cyan-400/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-400/20">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">External URL</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Tautkan link / katalog online</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-950 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                    {urlCount}
                  </span>
                </div>

                {/* Google Sheet Card */}
                <div
                  onClick={() => setInputMethodActive("sheet")}
                  className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer ${
                    inputMethodActive === "sheet"
                      ? "border-cyan-400 bg-cyan-950/20"
                      : "border-white/8 bg-white/[0.02] hover:border-cyan-400/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-400/20">
                      <Database className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">Google Sheet</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Tautkan katalog / FAQ sheet</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-950 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                    {sheetCount}
                  </span>
                </div>

                {/* File Upload Card */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-white/[0.02] hover:border-cyan-400/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-400/20">
                      <Upload className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">File upload</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Unggah PDF / DOCX / CSV</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-950 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                    {isUploadingKbFile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : docCount}
                  </span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadKbFile}
                  accept=".pdf,.docx,.csv,.txt,.md,.json,.html"
                  className="hidden"
                />

                {/* Text Content Card */}
                <div
                  onClick={() => setInputMethodActive("text")}
                  className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer ${
                    inputMethodActive === "text"
                      ? "border-cyan-400 bg-cyan-950/20"
                      : "border-white/8 bg-white/[0.02] hover:border-cyan-400/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-400/20">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">Text content</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Ketik fakta manual</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-950 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                    {textCount}
                  </span>
                </div>
              </div>
            </Card>

            {/* Form URL */}
            {inputMethodActive === "url" && (
              <Card className="glass-panel p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Input External URL</span>
                  <button onClick={() => setInputMethodActive("none")} className="text-[10px] text-slate-500 hover:text-white">
                    Batal
                  </button>
                </div>
                <form onSubmit={handleSyncKbUrl} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-300">Tautan (Satu per baris)</label>
                    <Textarea
                      placeholder="https://johangarage.com/profile"
                      value={kbUrlInput}
                      onChange={(e) => setKbUrlInput(e.target.value)}
                      rows={3}
                      className="text-xs"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSyncingKbSources} className="w-full text-xs h-9">
                    {isSyncingKbSources ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Sinkronisasi...
                      </>
                    ) : (
                      "Tambahkan Tautan"
                    )}
                  </Button>
                </form>
              </Card>
            )}

            {/* Form Google Sheet */}
            {inputMethodActive === "sheet" && (
              <Card className="glass-panel p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Input Google Sheet</span>
                  <button onClick={() => setInputMethodActive("none")} className="text-[10px] text-slate-500 hover:text-white">
                    Batal
                  </button>
                </div>
                <form onSubmit={handleSyncKbSheet} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-300">Link Google Sheet (Satu per baris)</label>
                    <Textarea
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={kbSheetInput}
                      onChange={(e) => setKbSheetInput(e.target.value)}
                      rows={3}
                      className="text-xs"
                      required
                    />
                    <p className="text-[10px] leading-relaxed text-slate-500">
                      Sheet harus bisa dibuka dengan akses anyone with the link can view agar server dapat membaca CSV.
                    </p>
                  </div>
                  <Button type="submit" disabled={isSyncingKbSources} className="w-full text-xs h-9">
                    {isSyncingKbSources ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Sinkronisasi...
                      </>
                    ) : (
                      "Tambahkan Google Sheet"
                    )}
                  </Button>
                </form>
              </Card>
            )}

            {/* Form Text Fact Ingest */}
            {inputMethodActive === "text" && (
              <Card className="glass-panel p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Ketik Fakta Manual</span>
                  <button onClick={() => setInputMethodActive("none")} className="text-[10px] text-slate-500 hover:text-white">
                    Batal
                  </button>
                </div>
                <form onSubmit={handleIngestKbText} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-300">Nama Fakta / Pemicu</label>
                    <Input
                      placeholder="Contoh: Jadwal Buka Kantor"
                      value={kbTextTitle}
                      onChange={(e) => setKbTextTitle(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-300">Isi Konten Teks</label>
                    <Textarea
                      placeholder="Contoh: Kami buka setiap hari Senin-Sabtu pukul 08:00-17:00."
                      value={kbTextContent}
                      onChange={(e) => setKbTextContent(e.target.value)}
                      rows={4}
                      className="text-xs"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isIngestingText} className="w-full text-xs h-9">
                    {isIngestingText ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Konten Fakta"
                    )}
                  </Button>
                </form>
              </Card>
            )}

            {isSaved && (
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs font-bold text-emerald-400">
                <Check className="h-4 w-4" />
                Knowledge Base diperbarui! AI Inbox langsung menggunakan data baru ini.
              </div>
            )}
            {ingestSuccess && (
              <div className="flex items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-950/20 p-3 text-xs font-bold text-cyan-200">
                <Check className="h-4 w-4" />
                {ingestSuccess}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SubSection: Custom Instructions */}
      {kbSubsection === "instructions" && (
        <Card className="glass-panel p-6 max-w-3xl">
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Custom Instructions</h3>
            <p className="text-xs text-slate-400 mt-1">
              Atur instruksi tingkat tinggi sistem prompt AI untuk mengontrol identitas, nada, dan batasan respons.
            </p>
          </div>

          <form onSubmit={handleSaveInstructions} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">1. Persona Configuration (Identitas Bot)</label>
              <Textarea
                placeholder="Contoh: Kamu adalah asisten customer service yang ramah dan ahli seputar layanan bisnis kami..."
                value={personaConfig}
                onChange={(e) => setPersonaConfig(e.target.value)}
                rows={3}
                className="text-xs"
              />
              <p className="text-[10px] text-slate-500 leading-normal">Menjelaskan identitas bot dan konteks operasional bisnis.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">2. Tone of Voice (Gaya Bahasa)</label>
              <Textarea
                placeholder="Contoh: Gunakan bahasa santai yang ramah, panggil pelanggan dengan sapaan 'Kak'..."
                value={toneOfVoice}
                onChange={(e) => setToneOfVoice(e.target.value)}
                rows={3}
                className="text-xs"
              />
              <p className="text-[10px] text-slate-500 leading-normal">Menentukan gaya penulisan, sapaan, dan nada emosi.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">3. Guardrails / Aturan Keamanan</label>
              <Textarea
                placeholder="Contoh: Dilarang memberikan estimasi harga sebelum mengetahui detail kebutuhan customer..."
                value={guardrails}
                onChange={(e) => setGuardrails(e.target.value)}
                rows={3}
                className="text-xs"
              />
              <p className="text-[10px] text-slate-500 leading-normal">Instruksi mutlak untuk mencegah bot mengarang info palsu.</p>
            </div>

            <div className="flex items-center justify-between border-t border-white/8 pt-4">
              {isSaved ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Check className="h-4 w-4" />
                  Instruksi kustom berhasil disimpan!
                </span>
              ) : (
                <div />
              )}
               <Button type="submit" disabled={isSavingInstructions} className="px-6 h-9.5 text-xs">
                {isSavingInstructions ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Instruksi Custom"
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

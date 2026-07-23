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
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  parseCustomInstructions,
  serializeCustomInstructions,
} from "@/lib/custom-instructions";

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
  personaConfigured: boolean;
  toneConfigured: boolean;
  guardrailsConfigured: boolean;
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
    const sections = parseCustomInstructions(config.aiAgent.replyInstructions || "");
    setPersonaConfig(sections.persona);
    setToneOfVoice(sections.tone);
    setGuardrails(sections.guardrails);
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
      const assembledPrompt = serializeCustomInstructions({
        persona: personaConfig,
        tone: toneOfVoice,
        guardrails,
      });
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/automation" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition">
              <ArrowLeft className="h-3.5 w-3.5" />
              Automation
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Knowledge Base
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Kelola sumber pengetahuan AI — FAQ, dokumen, URL, dan custom instructions.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-slate-800 shadow-2xs">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <span>
            {runtimeStatus?.connected ? "Terintegrasi" : "Belum aktif"} dengan{" "}
            <Link href="/inbox" className="font-bold text-blue-600 hover:underline">
              {runtimeStatus?.conversations ?? 0} Conversations
            </Link>{" "}
            — {runtimeStatus?.activeAiAgents ?? 0} Agent aktif, {runtimeStatus?.chunks ?? 0} chunks siap
          </span>
          <span className={`flex h-2 w-2 rounded-full ${runtimeStatus?.connected ? "bg-emerald-600 animate-pulse" : "bg-amber-500"}`} />
        </div>
      </div>

      {/* KB Stats Banner */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "URL Tersinkron", count: urlCount, icon: Link2 },
          { label: "Google Sheet", count: sheetCount, icon: Database },
          { label: "File Upload", count: docCount, icon: Upload },
          { label: "Teks Fakta", count: textCount, icon: FileText },
        ].map(({ label, count, icon: Icon }) => (
          <Card
            key={label}
            className="p-4 border-slate-200 bg-white text-center shadow-2xs"
          >
            <Icon className="mx-auto mb-1 h-5 w-5 text-blue-600" />
            <div className="text-2xl font-extrabold text-slate-900">{count}</div>
            <div className="text-xs text-slate-500 font-medium">{label}</div>
          </Card>
        ))}
      </div>

      {syncError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 font-semibold">
          <div className="mb-1 flex items-center gap-2 font-bold text-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Sinkronisasi knowledge gagal sebagian
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-red-700">
            {syncError}
          </pre>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        {[
          { id: "resources", label: "AI Resources" },
          { id: "instructions", label: "Custom Instructions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setKbSubsection(tab.id)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              kbSubsection === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
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
            <Card className="p-5 border-slate-200 bg-white shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Existing Sources</h3>
                  <p className="text-xs text-slate-500">Seluruh referensi yang sudah dipelajari AI.</p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari referensi..."
                    className="h-9 pl-9 text-xs border-slate-200 bg-slate-50"
                    value={kbSearchQuery}
                    onChange={(e) => setKbSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredSourceItems.length === 0 ? (
                  <EmptyState
                    icon={<Database className="h-8 w-8 text-slate-400" />}
                    title="Belum ada referensi"
                    description="Gunakan Metode Input di samping kanan untuk memasukkan data."
                    className="min-h-[180px]"
                  />
                ) : (
                  filteredSourceItems.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 font-bold">
                          {doc.name.endsWith(".txt") ? (
                            <FileText className="h-4 w-4" />
                          ) : doc.sourceType === "google_sheet" ? (
                            <Database className="h-4 w-4" />
                          ) : doc.sourceType === "website" ? (
                            <Link2 className="h-4 w-4" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-bold text-slate-900">{doc.name}</span>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-500">
                            <span>{doc.size}</span>
                            <Badge variant="secondary" className="text-[9px] uppercase">
                              {doc.name.endsWith(".txt")
                                ? "Text Content"
                                : doc.sourceType === "google_sheet"
                                  ? "Google Sheet"
                                  : doc.sourceType === "website"
                                    ? "External URL"
                                    : "File Upload"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {doc.sourceUrl && (
                          <a
                            href={doc.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition"
                          >
                            Buka
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {doc.isIndexed ? (
                          <Badge variant="success" className="text-[9px]">
                            <Check className="h-3 w-3 mr-1" />
                            Terserap AI
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => void handleResyncKnowledgeSources()}
                            disabled={isSyncingKbSources}
                            className="h-7 text-[10px] px-2"
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${isSyncingKbSources ? "animate-spin" : ""}`} />
                            Sinkronkan
                          </Button>
                        )}
                        {doc.isIndexed && (
                          <button
                            onClick={() => handleDeleteKbDocument(doc.id)}
                            className="rounded-lg p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
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
            <Card className="p-5 border-amber-200 bg-amber-50/40 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">Unanswered Questions</h3>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Pertanyaan pelanggan yang gagal dijawab AI. Tambahkan ke Knowledge Base untuk meningkatkan akurasi.
              </p>
              <div className="space-y-2.5">
                {unansweredQuestions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs font-semibold text-slate-500">
                    Tidak ada pertanyaan tak terjawab saat ini. Sistem bekerja sempurna!
                  </div>
                ) : (
                  unansweredQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{question.question}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500 font-medium">
                          Kategori: {question.category} - muncul {question.occurrences}x dari {question.sourceChannel}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button onClick={() => handleAnswerQuestion(question.question)} size="sm" variant="primary" className="text-[10px] h-7">
                          Jawab via Text Content
                        </Button>
                        <Button
                          onClick={() => void handleDismissQuestion(question.id)}
                          size="sm"
                          variant="secondary"
                          className="text-[10px] h-7"
                        >
                          Abaikan
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Methods Input Side Panel */}
          <div className="space-y-6">
            <Card className="p-5 border-slate-200 bg-white shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">Metode Input</h3>
              <div className="space-y-2.5">
                {/* External URL Card */}
                <div
                  onClick={() => setInputMethodActive("url")}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                    inputMethodActive === "url"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-blue-600 font-bold">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">External URL</p>
                      <p className="text-[10px] text-slate-500">Tautkan link / katalog online</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-[10px]">
                    {urlCount}
                  </Badge>
                </div>

                {/* Google Sheet Card */}
                <div
                  onClick={() => setInputMethodActive("sheet")}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                    inputMethodActive === "sheet"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-blue-600 font-bold">
                      <Database className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">Google Sheet</p>
                      <p className="text-[10px] text-slate-500">Tautkan katalog / FAQ sheet</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-[10px]">
                    {sheetCount}
                  </Badge>
                </div>

                {/* File Upload Card */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-blue-600 font-bold">
                      <Upload className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">File upload</p>
                      <p className="text-[10px] text-slate-500">Unggah PDF / DOCX / CSV</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-[10px]">
                    {isUploadingKbFile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : docCount}
                  </Badge>
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
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                    inputMethodActive === "text"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-blue-600 font-bold">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">Text content</p>
                      <p className="text-[10px] text-slate-500">Ketik fakta manual</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-[10px]">
                    {textCount}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Form URL */}
            {inputMethodActive === "url" && (
              <Card className="p-5 border-slate-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Input External URL</span>
                  <button onClick={() => setInputMethodActive("none")} className="text-xs font-semibold text-slate-400 hover:text-slate-900 cursor-pointer">
                    Batal
                  </button>
                </div>
                <form onSubmit={handleSyncKbUrl} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900">Tautan (Satu per baris)</label>
                    <Textarea
                      placeholder="https://johangarage.com/profile"
                      value={kbUrlInput}
                      onChange={(e) => setKbUrlInput(e.target.value)}
                      rows={3}
                      className="text-xs bg-slate-50"
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" disabled={isSyncingKbSources} className="w-full text-xs h-9">
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
              <Card className="p-5 border-slate-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Input Google Sheet</span>
                  <button onClick={() => setInputMethodActive("none")} className="text-xs font-semibold text-slate-400 hover:text-slate-900 cursor-pointer">
                    Batal
                  </button>
                </div>
                <form onSubmit={handleSyncKbSheet} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900">Link Google Sheet (Satu per baris)</label>
                    <Textarea
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={kbSheetInput}
                      onChange={(e) => setKbSheetInput(e.target.value)}
                      rows={3}
                      className="text-xs bg-slate-50"
                      required
                    />
                    <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                      Sheet harus bisa dibuka dengan akses anyone with the link can view agar server dapat membaca CSV.
                    </p>
                  </div>
                  <Button type="submit" variant="primary" disabled={isSyncingKbSources} className="w-full text-xs h-9">
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
              <Card className="p-5 border-slate-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ketik Fakta Manual</span>
                  <button onClick={() => setInputMethodActive("none")} className="text-xs font-semibold text-slate-400 hover:text-slate-900 cursor-pointer">
                    Batal
                  </button>
                </div>
                <form onSubmit={handleIngestKbText} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900">Nama Fakta / Pemicu</label>
                    <Input
                      placeholder="Contoh: Jadwal Buka Kantor"
                      value={kbTextTitle}
                      onChange={(e) => setKbTextTitle(e.target.value)}
                      className="h-9 text-xs bg-slate-50"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900">Isi Konten Teks</label>
                    <Textarea
                      placeholder="Contoh: Kami buka setiap hari Senin-Sabtu pukul 08:00-17:00."
                      value={kbTextContent}
                      onChange={(e) => setKbTextContent(e.target.value)}
                      rows={4}
                      className="text-xs bg-slate-50"
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" disabled={isIngestingText} className="w-full text-xs h-9">
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
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
                <Check className="h-4 w-4 text-emerald-600" />
                Knowledge Base diperbarui! AI Inbox langsung menggunakan data baru ini.
              </div>
            )}
            {ingestSuccess && (
              <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-bold text-blue-800">
                <Check className="h-4 w-4 text-blue-600" />
                {ingestSuccess}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SubSection: Custom Instructions */}
      {kbSubsection === "instructions" && (
        <Card className="p-6 border-slate-200 bg-white max-w-3xl shadow-2xs">
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Custom Instructions</h3>
            <p className="text-xs text-slate-500 mt-1">
              Atur instruksi tingkat tinggi sistem prompt AI untuk mengontrol identitas, nada, dan batasan respons.
            </p>
            {runtimeStatus && (
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["Persona", runtimeStatus.personaConfigured],
                  ["Tone", runtimeStatus.toneConfigured],
                  ["Guardrails", runtimeStatus.guardrailsConfigured],
                ].map(([label, active]) => (
                  <Badge
                    key={String(label)}
                    variant={active ? "success" : "warning"}
                    className="text-[10px]"
                  >
                    {active ? <Check className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                    {label}: {active ? "Aktif" : "Belum diisi"}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSaveInstructions} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">1. Persona Configuration (Identitas Bot)</label>
              <Textarea
                placeholder="Contoh: Kamu adalah asisten customer service yang ramah dan ahli seputar layanan bisnis kami..."
                value={personaConfig}
                onChange={(e) => setPersonaConfig(e.target.value)}
                rows={3}
                className="text-xs bg-slate-50"
              />
              <p className="text-[10px] text-slate-500 font-medium">Menjelaskan identitas bot dan konteks operasional bisnis.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">2. Tone of Voice (Gaya Bahasa)</label>
              <Textarea
                placeholder="Contoh: Gunakan bahasa santai yang ramah, panggil pelanggan dengan sapaan 'Kak'..."
                value={toneOfVoice}
                onChange={(e) => setToneOfVoice(e.target.value)}
                rows={3}
                className="text-xs bg-slate-50"
              />
              <p className="text-[10px] text-slate-500 font-medium">Menentukan gaya penulisan, sapaan, dan nada emosi.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">3. Guardrails / Aturan Keamanan</label>
              <Textarea
                placeholder="Contoh: Dilarang memberikan estimasi harga sebelum mengetahui detail kebutuhan customer..."
                value={guardrails}
                onChange={(e) => setGuardrails(e.target.value)}
                rows={3}
                className="text-xs bg-slate-50"
              />
              <p className="text-[10px] text-slate-500 font-medium">Instruksi mutlak untuk mencegah bot mengarang info palsu.</p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              {isSaved ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <Check className="h-4 w-4" />
                  Instruksi kustom berhasil disimpan!
                </span>
              ) : (
                <div />
              )}
              <Button type="submit" variant="primary" disabled={isSavingInstructions} className="px-6 h-9 text-xs font-bold">
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

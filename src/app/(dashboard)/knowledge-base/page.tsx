"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  FileText,
  Upload,
  Check,
  Building,
  Save,
  Loader2,
  Link2,
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import type { FAQItem, KnowledgeDocument } from "@/types/dashboard-config";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";

function normalizeFaqQuestion(value: string) {
  return value.trim().toLowerCase();
}

function mergeFaqCollections(existing: FAQItem[], imported: FAQItem[]) {
  const existingByQuestion = new Map(
    existing.map((item) => [normalizeFaqQuestion(item.question), item]),
  );

  for (const item of imported) {
    const key = normalizeFaqQuestion(item.question);
    const current = existingByQuestion.get(key);

    if (current) {
      existingByQuestion.set(key, {
        ...current,
        answer: item.answer,
      });
      continue;
    }

    existingByQuestion.set(key, item);
  }

  const importedQuestionSet = new Set(
    imported.map((item) => normalizeFaqQuestion(item.question)),
  );

  const importedFirst = imported.map((item) => {
    const merged = existingByQuestion.get(normalizeFaqQuestion(item.question));
    return merged ?? item;
  });
  const remainingExisting = existing.filter(
    (item) => !importedQuestionSet.has(normalizeFaqQuestion(item.question)),
  );

  return [...importedFirst, ...remainingExisting];
}

export default function KnowledgeBasePage() {
  const { config, patchConfig, refreshConfig } = useDashboardConfig();

  const [activeTab, setActiveTab] = useState("faq");
  const [searchQuery, setSearchQuery] = useState("");
  const [faqs, setFaqs] = useState<FAQItem[]>(config.knowledgeBase.faqs);
  const [files, setFiles] = useState<KnowledgeDocument[]>(
    config.knowledgeBase.documents,
  );
  const [websiteUrls, setWebsiteUrls] = useState(
    config.knowledgeBase.websiteUrls.join("\n"),
  );
  const [googleSheetUrls, setGoogleSheetUrls] = useState(
    config.knowledgeBase.googleSheetUrls.join("\n"),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [bizName, setBizName] = useState(config.workspace.name);
  const [bizIndustry, setBizIndustry] = useState(config.workspace.industry);
  const [bizDesc, setBizDesc] = useState(config.workspace.description);
  const [bizAddress, setBizAddress] = useState(config.workspace.address);
  const [bizHours, setBizHours] = useState(config.workspace.businessHours);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [isFaqSaved, setIsFaqSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadName, setUploadName] = useState("");
  const [isImportingFaqFile, setIsImportingFaqFile] = useState(false);
  const [faqImportMessage, setFaqImportMessage] = useState("");
  const [faqImportError, setFaqImportError] = useState("");
  const [isSyncingSources, setIsSyncingSources] = useState(false);
  const [sourceSyncMessage, setSourceSyncMessage] = useState("");
  const [sourceSyncError, setSourceSyncError] = useState("");

  useEffect(() => {
    setFaqs(config.knowledgeBase.faqs);
    setFiles(config.knowledgeBase.documents);
    setWebsiteUrls(config.knowledgeBase.websiteUrls.join("\n"));
    setGoogleSheetUrls(config.knowledgeBase.googleSheetUrls.join("\n"));
    setBizName(config.workspace.name);
    setBizIndustry(config.workspace.industry);
    setBizDesc(config.workspace.description);
    setBizAddress(config.workspace.address);
    setBizHours(config.workspace.businessHours);
  }, [config]);

  const filteredFaqs = useMemo(
    () =>
      faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [faqs, searchQuery],
  );

  const persistKnowledgeBase = (
    nextFaqs: FAQItem[],
    nextFiles: KnowledgeDocument[],
    nextUrls: string[],
    nextSheetUrls: string[],
  ) => {
    patchConfig((current) => ({
      ...current,
      knowledgeBase: {
        ...current.knowledgeBase,
        faqs: nextFaqs,
        documents: nextFiles,
        websiteUrls: nextUrls,
        googleSheetUrls: nextSheetUrls,
      },
    }));
  };

  const handleAddFaq = (event: FormEvent) => {
    event.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      return;
    }

    const nextFaqs = [
      {
        id: Date.now().toString(),
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
      },
      ...faqs,
    ];

    setFaqs(nextFaqs);
    persistKnowledgeBase(
      nextFaqs,
      files,
      websiteUrls
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      googleSheetUrls
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    );

    setNewQuestion("");
    setNewAnswer("");
    setIsModalOpen(false);
    setIsFaqSaved(true);
    setTimeout(() => setIsFaqSaved(false), 2500);
  };

  const handleDeleteFaq = (id: string) => {
    const nextFaqs = faqs.filter((faq) => faq.id !== id);
    setFaqs(nextFaqs);
    persistKnowledgeBase(
      nextFaqs,
      files,
      websiteUrls
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      googleSheetUrls
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    );
  };

  const handleFaqFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setFaqImportMessage("");
    setFaqImportError("");
    setIsImportingFaqFile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/knowledge/faqs/import", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const payload = (await response.json()) as {
        ok: boolean;
        data?: { items: FAQItem[]; count: number };
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error ?? "File FAQ gagal dibaca.");
      }

      const importedItems = payload.data.items;
      if (importedItems.length === 1 && !newQuestion.trim() && !newAnswer.trim()) {
        setNewQuestion(importedItems[0].question);
        setNewAnswer(importedItems[0].answer);
        setFaqImportMessage(
          `1 FAQ dari ${file.name} sudah diisi otomatis ke form.`,
        );
        return;
      }

      const nextFaqs = mergeFaqCollections(faqs, importedItems);
      setFaqs(nextFaqs);
      persistKnowledgeBase(
        nextFaqs,
        files,
        websiteUrls
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        googleSheetUrls
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      );

      setFaqImportMessage(
        `${importedItems.length} FAQ dari ${file.name} berhasil diimpor.`,
      );
      setIsFaqSaved(true);
      setTimeout(() => setIsFaqSaved(false), 2500);
    } catch (error) {
      setFaqImportError(
        error instanceof Error
          ? error.message
          : "File FAQ belum bisa diproses.",
      );
    } finally {
      setIsImportingFaqFile(false);
    }
  };

  const handleSaveProfile = (event: FormEvent) => {
    event.preventDefault();

    patchConfig((current) => ({
      ...current,
      workspace: {
        ...current.workspace,
        name: bizName,
        industry: bizIndustry,
        description: bizDesc,
        address: bizAddress,
        businessHours: bizHours,
      },
    }));

    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 2500);
  };

  const handleSyncSources = async () => {
    const urls = websiteUrls
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const sheetUrls = googleSheetUrls
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    setSourceSyncMessage("");
    setSourceSyncError("");
    setIsSyncingSources(true);

    try {
      const response = await fetch("/api/knowledge/sources/sync", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteUrls: urls,
          googleSheetUrls: sheetUrls,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        data?: {
          syncedCount: number;
          failures: Array<{ url: string; reason: string }>;
        };
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error ?? "Sinkronisasi source gagal.");
      }

      patchConfig((current) => ({
        ...current,
        knowledgeBase: {
          ...current.knowledgeBase,
          websiteUrls: urls,
          googleSheetUrls: sheetUrls,
        },
      }));

      await refreshConfig();

      if (payload.data.failures.length > 0) {
        setSourceSyncError(
          `Sebagian source gagal: ${payload.data.failures
            .map((item) => `${item.url} (${item.reason})`)
            .join(" | ")}`,
        );
      }

      setSourceSyncMessage(
        `${payload.data.syncedCount} source berhasil disinkronkan ke knowledge AI.`,
      );
    } catch (error) {
      setSourceSyncError(
        error instanceof Error ? error.message : "Sinkronisasi source gagal.",
      );
    } finally {
      setIsSyncingSources(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadName(file.name);
    setIsUploading(true);
    setUploadProgress(0);

    const interval = window.setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 20, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/knowledge/documents/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload gagal");
      }

      window.clearInterval(interval);
      setUploadProgress(100);
      setIsUploading(false);
      await refreshConfig();
    } catch {
      window.clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    await fetch(`/api/knowledge/documents/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    await refreshConfig();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <BookOpen className="h-6 w-6 text-cyan-400" />
            Knowledge Base
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Semua data bisnis, FAQ, website, dan dokumen sumber AI sekarang dikelola
            langsung dari dashboard.
          </p>
        </div>

        {activeTab === "faq" ? (
          <Button onClick={() => setIsModalOpen(true)} className="sm:self-start">
            <Plus className="mr-1 h-4.5 w-4.5" />
            Tambah FAQ Baru
          </Button>
        ) : null}
      </div>

      <Tabs
        tabs={[
          { id: "faq", label: "Tanya Jawab (FAQ)" },
          { id: "profile", label: "Profil Bisnis" },
          { id: "docs", label: "Dokumen & Sumber" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "faq" ? (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Cari pertanyaan atau jawaban..."
              className="h-10 pl-9 text-xs"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          {isFaqSaved ? (
            <div className="text-xs font-bold text-emerald-400">
              FAQ knowledge base diperbarui.
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredFaqs.length === 0 ? (
              <div className="col-span-2 rounded-xl border border-white/6 bg-white/3 p-12 text-center text-xs font-semibold text-slate-500">
                Tidak ada FAQ yang cocok.
              </div>
            ) : (
              filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="glass-panel flex flex-col justify-between rounded-xl p-5 transition duration-300 hover:border-cyan-500/20"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="line-clamp-2 text-xs font-bold leading-relaxed text-white">
                        Q: {faq.question}
                      </h4>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="rounded p-1 text-slate-500 transition hover:bg-white/5 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed text-slate-400">
                      A: {faq.answer}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "profile" ? (
        <form
          onSubmit={handleSaveProfile}
          className="glass-panel max-w-2xl space-y-4 rounded-xl p-6"
        >
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Building className="h-4 w-4" />
            Detail Identitas Bisnis
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nama Toko / Bisnis</label>
              <Input value={bizName} onChange={(event) => setBizName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Industri</label>
              <Input
                value={bizIndustry}
                onChange={(event) => setBizIndustry(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Alamat Bisnis</label>
              <Input
                value={bizAddress}
                onChange={(event) => setBizAddress(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Jam Operasional</label>
              <Input
                value={bizHours}
                onChange={(event) => setBizHours(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Deskripsi Bisnis</label>
            <Textarea
              value={bizDesc}
              onChange={(event) => setBizDesc(event.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {isProfileSaved ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 animate-fade-in">
                <Check className="h-4 w-4" />
                Profil knowledge berhasil diperbarui!
              </span>
            ) : (
              <div />
            )}
            <Button type="submit" className="px-5">
              <Save className="mr-1.5 h-4 w-4" />
              Simpan Profil
            </Button>
          </div>
        </form>
      ) : null}

      {activeTab === "docs" ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Daftar Dokumen Aktif
            </h3>
          <div className="space-y-3">
              {files.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-10 w-10" />}
                  title="Belum ada dokumen"
                  description="Unggah SOP, daftar harga, katalog, atau panduan layanan agar AI membaca dokumen nyata milik bisnis Anda."
                  className="min-h-[280px]"
                />
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="glass-panel flex items-center justify-between gap-4 rounded-xl p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-950/40 text-cyan-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-bold text-white">
                          {file.name}
                        </span>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-500">
                          <span>{file.size}</span>
                          <span className="rounded-full border border-white/8 px-2 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">
                            {file.sourceType === "google_sheet"
                              ? "Google Sheet"
                              : file.sourceType === "website"
                                ? "Website"
                                : "Upload"}
                          </span>
                          {file.syncedAt ? <span>sync: {file.syncedAt}</span> : null}
                        </div>
                        {file.sourceUrl ? (
                          <span className="mt-1 block truncate text-[10px] text-cyan-300">
                            {file.sourceUrl}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        Terserap AI
                      </span>
                      <button
                        onClick={() => handleDeleteDocument(file.id)}
                        className="rounded p-1.5 text-slate-500 transition hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel space-y-4 rounded-xl p-5 text-center">
            <h3 className="text-left text-xs font-bold uppercase tracking-wider text-cyan-400">
              Upload & Sinkronisasi Source
            </h3>
            <p className="text-left text-[11px] leading-normal text-slate-400">
              Unggah SOP, daftar harga, FAQ internal, atau panduan layanan. Semua file
              ini akan menjadi sumber pengetahuan AI dan reference automation.
            </p>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300">
                URL Website Sumber Informasi
              </label>
              <Textarea
                value={websiteUrls}
                onChange={(event) => setWebsiteUrls(event.target.value)}
                rows={3}
                placeholder={"https://example.com/faq\nhttps://example.com/pricing"}
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300">
                URL Google Sheet
              </label>
              <Textarea
                value={googleSheetUrls}
                onChange={(event) => setGoogleSheetUrls(event.target.value)}
                rows={3}
                placeholder={
                  "https://docs.google.com/spreadsheets/d/...\nSatu URL sheet per baris"
                }
              />
              <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Link2 className="h-3 w-3" />
                Gunakan link Google Sheet yang bisa diakses viewer atau export.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => void handleSyncSources()}
              disabled={isSyncingSources}
            >
              {isSyncingSources ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-1.5 h-4 w-4" />
              )}
              Sinkronkan Website & Google Sheet
            </Button>

            {sourceSyncMessage ? (
              <p className="text-left text-[11px] font-semibold text-emerald-400">
                {sourceSyncMessage}
              </p>
            ) : null}

            {sourceSyncError ? (
              <p className="text-left text-[11px] font-semibold text-rose-400">
                {sourceSyncError}
              </p>
            ) : null}

            <div className="relative cursor-pointer rounded-xl border border-dashed border-white/12 bg-white/2 p-6 transition duration-200 hover:border-cyan-400/50">
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md,.csv,.json,.html,.doc,.xlsx,.xls"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-cyan-400" />
                <span className="text-xs font-bold text-slate-300">
                  Pilih File PDF, DOCX, XLSX, CSV, atau Text
                </span>
                <span className="text-[10px] font-bold text-slate-500">Maksimal 10MB</span>
              </div>
            </div>

            {isUploading ? (
              <div className="animate-fade-in space-y-2 text-left">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Membaca {uploadName}...
                  </span>
                  <span className="text-white">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah FAQ Baru">
        <form onSubmit={handleAddFaq} className="space-y-4">
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Import FAQ dari file</p>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Gunakan file <span className="font-semibold text-slate-300">.xlsx</span>,
                  <span className="font-semibold text-slate-300"> .xls</span>,
                  <span className="font-semibold text-slate-300"> .csv</span>,
                  <span className="font-semibold text-slate-300"> .json</span>,
                  <span className="font-semibold text-slate-300"> .txt</span>, atau
                  <span className="font-semibold text-slate-300"> .md</span>.
                  Kolom yang didukung: <span className="font-semibold text-slate-300">Pertanyaan/Question</span> dan
                  <span className="font-semibold text-slate-300"> Jawaban/Answer</span>.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-950/40 px-3 py-2 text-[11px] font-bold text-cyan-300 transition hover:border-cyan-300/40 hover:text-cyan-200">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.json,.txt,.md"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={handleFaqFileImport}
                  disabled={isImportingFaqFile}
                />
                {isImportingFaqFile ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Membaca
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Pilih File
                  </>
                )}
              </label>
            </div>

            {faqImportMessage ? (
              <p className="mt-3 text-[11px] font-semibold text-emerald-400">
                {faqImportMessage}
              </p>
            ) : null}

            {faqImportError ? (
              <p className="mt-3 text-[11px] font-semibold text-rose-400">
                {faqImportError}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Pertanyaan</label>
            <Input
              placeholder="Contoh: Apakah bisa COD?"
              value={newQuestion}
              onChange={(event) => setNewQuestion(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Jawaban</label>
            <Textarea
              placeholder="Contoh: Ya, kami melayani COD khusus wilayah Jabodetabek."
              value={newAnswer}
              onChange={(event) => setNewAnswer(event.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="px-4"
            >
              Batal
            </Button>
            <Button type="submit" className="px-5">
              Simpan FAQ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

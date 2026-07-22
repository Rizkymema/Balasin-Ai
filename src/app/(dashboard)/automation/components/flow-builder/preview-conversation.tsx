"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCheck,
  Clock3,
  FileText,
  Loader2,
  RotateCcw,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import type { FlowPreviewResult } from "./flow-builder-types";

type Props = {
  message: string;
  nowIso: string;
  result: FlowPreviewResult | null;
  isRunning: boolean;
  onMessageChange: (value: string) => void;
  onNowChange: (value: string) => void;
  onRun: (customMessage?: string) => void;
  onReset: () => void;
  businessName?: string;
};

export function PreviewConversation({
  message,
  nowIso,
  result,
  isRunning,
  onMessageChange,
  onNowChange,
  onRun,
  onReset,
  businessName,
}: Props) {
  const [lastSentMessage, setLastSentMessage] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [isRunning, result]);

  const sendMessage = (customText?: string) => {
    const nextMessage = (customText ?? message).trim();
    if (!nextMessage || isRunning) return;
    setLastSentMessage(nextMessage);
    if (customText) {
      onMessageChange(customText);
    }
    onRun(nextMessage);
  };

  const resetChat = () => {
    setLastSentMessage("");
    onReset();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0d1117]">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/8 bg-[#111821] px-4">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-blue-950/30">
          <Bot className="h-5 w-5" />
          <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-[#111821] bg-emerald-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">
            {businessName ? `${businessName} AI` : "Workspace AI"}
          </p>
          <p className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            Online - Test sandbox
          </p>
        </div>
        <button
          type="button"
          onClick={resetChat}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/8 hover:text-white"
          aria-label="Reset percakapan test"
          title="Reset chat"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </header>

      <div
        ref={messagesRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.42)_1px,transparent_1px)] bg-[length:22px_22px] px-4 py-4"
      >
        <div className="mx-auto w-fit rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[9px] font-bold text-cyan-300 shadow-sm flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Live Node Inspector Sync Active
        </div>

        {!result && !isRunning && (
          <div className="mx-auto max-w-[260px] rounded-2xl border border-white/8 bg-[#111821]/90 p-4 text-center shadow-xl">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
              <Bot className="h-5 w-5" />
            </span>
            <p className="mt-3 text-xs font-bold text-white">
              Test Percakapan Flow
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
              Pesan dan pengaturan yang Anda atur di <strong>Node Inspector</strong> otomatis diproses di sandbox ini.
            </p>
          </div>
        )}

        {(lastSentMessage || (result && message)) && (
          <ChatBubble sender="customer" text={lastSentMessage || message} />
        )}

        {result?.messages.map((item, index) => (
          <ChatBubble
            key={`${item}-${index}`}
            sender="bot"
            text={item}
            onFormSubmitted={(summary) => sendMessage(summary)}
          />
        ))}

        {isRunning && <TypingBubble />}

        {result?.error && (
          <div className="ml-8 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-[10px] text-red-300">
            {result.error}
          </div>
        )}

        {result?.needsHuman && (
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[9px] font-bold text-amber-300">
            <UserRound className="h-3 w-3" />
            Diteruskan ke {result.handoffTarget || "Admin"}
          </div>
        )}

        {result && (
          <details className="rounded-xl border border-white/8 bg-[#111821]/90 text-[10px] shadow-lg">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 font-bold text-slate-400">
              <span>Detail eksekusi flow ({result.trace.length} langkah)</span>
              {result.decision && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[8px] ${result.decision.grounded ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}
                >
                  {result.decision.grounded ? "Grounded" : "Fallback"} -{" "}
                  {result.decision.confidence}%
                </span>
              )}
            </summary>
            <div className="space-y-2 border-t border-white/8 p-3">
              {result.trace.map((step, index) => (
                <div
                  key={`${step.nodeId}-${index}`}
                  className="flex items-center gap-2"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 font-mono text-cyan-300">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-slate-300 font-semibold">
                    {step.label}
                  </span>
                  {step.outcome && (
                    <span className="text-slate-400 text-[9px] bg-white/5 px-2 py-0.5 rounded">{step.outcome}</span>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Quick Scenario Chips */}
      <div className="shrink-0 border-t border-white/8 bg-[#0f151d] px-3 py-2">
        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
          Uji Skenario Node Inspector:
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => sendMessage("Halo")}
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-300 transition hover:bg-cyan-500/20 active:scale-95"
          >
            👋 Start / Greeting
          </button>
          <button
            type="button"
            onClick={() => sendMessage("Berapa harga layanan Anda?")}
            className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-300 transition hover:bg-blue-500/20 active:scale-95"
          >
            🔧 Tanya Harga Layanan
          </button>
          <button
            type="button"
            onClick={() => sendMessage("Jam berapa kantor buka hari ini?")}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-300 transition hover:bg-amber-500/20 active:scale-95"
          >
            🕒 Jam Kerja
          </button>
          <button
            type="button"
            onClick={() => sendMessage("Saya mau bicara dengan admin")}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-300 transition hover:bg-red-500/20 active:scale-95"
          >
            👨‍💼 Handoff Admin
          </button>
        </div>
      </div>

      <footer className="shrink-0 border-t border-white/8 bg-[#111821] p-3">
        <label className="mb-2 flex items-center gap-2 px-1 text-[9px] font-bold text-slate-500">
          <Clock3 className="h-3 w-3" />
          Waktu simulasi
          <input
            type="datetime-local"
            value={nowIso}
            onChange={(event) => onNowChange(event.target.value)}
            className="ml-auto max-w-44 bg-transparent text-right text-[9px] text-slate-400 outline-none"
          />
        </label>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0d1117] p-1.5 pl-3 focus-within:border-cyan-400/40">
          <Input
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ketik pesan pelanggan..."
            className="h-9 flex-1 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={isRunning || !message.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Kirim pesan test"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[8px] text-slate-600">
          Enter untuk mengirim - Tidak terkirim ke pelanggan asli
        </p>
      </footer>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <Avatar sender="bot" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-white/8 bg-[#17202b] px-4 py-3">
        {[0, 1, 2].map((item) => (
          <span
            key={item}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
            style={{ animationDelay: `${item * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatBubble({
  sender,
  text,
  onFormSubmitted,
}: {
  sender: "customer" | "bot";
  text: string;
  onFormSubmitted?: (summary: string) => void;
}) {
  const isCustomer = sender === "customer";
  const isFormChat = text.startsWith("[FORM_CHAT:");
  const formTitle = isFormChat
    ? text.replace(/^\[FORM_CHAT:[^\]]+\]\s*/, "")
    : "";

  return (
    <div
      className={`flex items-end gap-2 ${isCustomer ? "justify-end" : "justify-start"}`}
    >
      {!isCustomer && <Avatar sender="bot" />}
      <div className="max-w-[85%]">
        {isFormChat ? (
          <InteractiveFormWidget
            title={formTitle}
            onSubmitted={(summary) => onFormSubmitted?.(summary)}
          />
        ) : (
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed whitespace-pre-wrap shadow-md ${isCustomer ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md border border-white/8 bg-[#17202b] text-slate-100"}`}
          >
            {text}
          </div>
        )}
        <p
          className={`mt-1 flex items-center gap-1 px-1 text-[8px] text-slate-600 ${isCustomer ? "justify-end" : "justify-start"}`}
        >
          Sekarang
          {isCustomer && <CheckCheck className="h-3 w-3 text-blue-400" />}
        </p>
      </div>
      {isCustomer && <Avatar sender="customer" />}
    </div>
  );
}

function InteractiveFormWidget({
  title,
  onSubmitted,
}: {
  title: string;
  onSubmitted: (summary: string) => void;
}) {
  const [formData, setFormData] = useState({
    name: "Budi Santoso",
    phone: "081298765432",
    service: "Konsultasi Umum",
  });
  const [isDone, setIsDone] = useState(false);

  if (isDone) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <CheckCheck className="h-4 w-4 text-emerald-400" />
          Form Berhasil Terkirim
        </p>
        <p className="text-[10px] text-slate-300">
          Terima kasih! Data Form ({formData.name} - {formData.service}) telah kami terima.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 rounded-2xl border border-violet-500/30 bg-[#161324] p-3 text-xs text-slate-200 shadow-xl">
      <div className="flex items-center gap-2 border-b border-violet-500/20 pb-2">
        <FileText className="h-4 w-4 text-violet-400" />
        <span className="font-bold text-violet-200">{title || "Form Chatbot Interaktif"}</span>
      </div>
      <div className="space-y-1.5">
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase">Nama Lengkap</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-md border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-white outline-none focus:border-violet-400"
          />
        </div>
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase">Nomor WhatsApp / HP</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full rounded-md border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-white outline-none focus:border-violet-400"
          />
        </div>
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase">Pilihan Layanan</label>
          <select
            value={formData.service}
            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-violet-400"
          >
            <option value="Konsultasi Umum">Konsultasi Umum</option>
            <option value="Pemesanan Layanan">Pemesanan Layanan</option>
            <option value="Tanya Harga">Tanya Harga</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setIsDone(true);
          onSubmitted(`Mengisi form: ${formData.name} (${formData.phone}) - ${formData.service}`);
        }}
        className="w-full rounded-lg bg-violet-600 py-1.5 font-bold text-white text-xs hover:bg-violet-500 transition shadow-md active:scale-95"
      >
        Kirim Form Data
      </button>
    </div>
  );
}

function Avatar({ sender }: { sender: "customer" | "bot" }) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${sender === "bot" ? "bg-cyan-500/15 text-cyan-300" : "bg-white/8 text-slate-400"}`}
    >
      {sender === "bot" ? (
        <Bot className="h-3.5 w-3.5" />
      ) : (
        <UserRound className="h-3.5 w-3.5" />
      )}
    </span>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, X, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";

type MessageTarget = {
  id: string;
  name: string;
  recipientId: string;
  channel: any;
};

type ActionProposal = {
  type: string;
  title: string;
  targets?: MessageTarget[];
  messageTemplate?: string;
  data?: Record<string, any>;
};

type Message = {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  proposal?: ActionProposal | null;
  proposalExecuted?: boolean;
  proposalStatus?: "idle" | "loading" | "success" | "error";
  proposalResultMsg?: string;
};

const SUGGESTIONS = [
  "Rangkum booking terbaru",
  "Berapa tiket prioritas High?",
  "Daftar jasa & produk bisnis kami",
  "Bagaimana cara koneksi Instagram?",
];

export function DashboardAIAssistant() {
  const { config } = useDashboardConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Halo! Saya adalah Balesin Desk Copilot. Saya bisa membantu Anda merangkum booking, menganalisis tiket, atau menjelaskan cara penggunaan fitur sistem Balesin Desk ini. Ada yang bisa saya bantu?",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for the active proposal card
  const [editingTemplate, setEditingTemplate] = useState("");
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("balesin-ai-assistant-toggle", { detail: { isOpen } }));
    }
  }, [isOpen]);

  const toggleTargetSelection = (id: string) => {
    setSelectedTargetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCancelProposal = (msgIndex: number) => {
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === msgIndex
          ? {
              ...msg,
              proposalExecuted: true,
              proposalStatus: "error",
              proposalResultMsg: "Tindakan dibatalkan oleh administrator.",
            }
          : msg
      )
    );
  };

  const handleExecuteProposal = async (msgIndex: number, proposal: ActionProposal) => {
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === msgIndex ? { ...msg, proposalStatus: "loading" } : msg
      )
    );

    try {
      let bodyData: any = {};
      if (proposal.type === "send_followup") {
        const targetsToSend = proposal.targets?.filter((t) =>
          selectedTargetIds.includes(t.id)
        ) ?? [];
        bodyData = {
          action: "send_followup",
          targets: targetsToSend,
          messageTemplate: editingTemplate,
        };
      } else {
        bodyData = {
          action: proposal.type,
          data: proposal.data,
        };
      }

      const response = await fetch("/api/assistant/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const payload = (await response.json()) as { ok: boolean; message?: string; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Gagal mengeksekusi aksi.");
      }

      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === msgIndex
            ? {
                ...msg,
                proposalExecuted: true,
                proposalStatus: "success",
                proposalResultMsg: payload.message || "Aksi berhasil dieksekusi!",
              }
            : msg
        )
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("balesin_refresh_inbox"));
        window.dispatchEvent(new Event("balesin-dashboard-operations-change"));
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === msgIndex
            ? {
                ...msg,
                proposalStatus: "error",
                proposalResultMsg: err instanceof Error ? err.message : "Terjadi kesalahan saat mengeksekusi.",
              }
            : msg
        )
      );
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mendapatkan respons dari asisten AI.");
      }

      const raw = (await response.json()) as {
        ok: boolean;
        data?: { ok: boolean; reply?: string; error?: string };
        error?: string;
        reply?: string;
      };

      const payload = raw.data || raw;
      
      if (!payload.ok || !payload.reply) {
        throw new Error(payload.error || raw.error || "Gagal memproses pesan.");
      }

      const rawText = payload.reply;
      const proposalRegex = /---AI-ACTION-PROPOSAL---([\s\S]*?)---END-AI-ACTION-PROPOSAL---/;
      const match = rawText.match(proposalRegex);

      let cleanText = rawText;
      let proposalObj: ActionProposal | null = null;

      if (match && match[1]) {
        try {
          proposalObj = JSON.parse(match[1].trim()) as ActionProposal;
          cleanText = rawText.replace(proposalRegex, "").trim();
        } catch (e) {
          console.error("Failed to parse AI action proposal:", e);
        }
      }

      const botMsg: Message = {
        sender: "bot",
        text: cleanText,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        proposal: proposalObj,
        proposalExecuted: false,
        proposalStatus: "idle",
      };

      if (proposalObj) {
        setEditingTemplate(proposalObj.messageTemplate || "");
        setSelectedTargetIds(proposalObj.targets?.map((t) => t.id) || []);
      }

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 font-sans">
        {/* Floating Action Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand)] text-slate-950 shadow-lg hover:shadow-[0_0_15px_rgba(0,210,255,0.5)] hover:scale-105 active:scale-95 transition-all duration-200"
          title="Tanya AI Copilot"
        >
          <Bot className="h-6 w-6 animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <Card className="fixed top-0 right-0 h-screen w-full md:w-96 border-l border-white/10 bg-[var(--color-surface)] shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300 rounded-none overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-[var(--color-surface-strong)] border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              AI Copilot
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="text-[10px] text-slate-500">Asisten data {config?.workspace?.name || "Workspace"}</div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/10">
        {messages.map((msg, index) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={index}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? "bg-[var(--color-brand)] text-slate-950 rounded-tr-none font-medium shadow-sm"
                    : "bg-white/[0.03] border border-white/5 text-slate-200 rounded-tl-none"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                
                {/* Proposal Action Card */}
                {msg.proposal && (
                  <div className="mt-3 p-3 rounded-xl border border-white/10 bg-black/35 space-y-3 text-left">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                      <span className="font-bold text-[10px] text-[var(--color-brand)] uppercase tracking-wider">{msg.proposal.title}</span>
                    </div>
                    
                    {!msg.proposalExecuted ? (
                      <>
                        {/* RENDER FOLLOW-UP */}
                        {msg.proposal.type === "send_followup" && msg.proposal.targets && (
                          <>
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Pilih Pelanggan:</span>
                              <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                                {msg.proposal.targets.map((target) => (
                                  <label key={target.id} className="flex items-center gap-2 text-[10px] text-slate-300 hover:text-white cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={selectedTargetIds.includes(target.id)}
                                      onChange={() => toggleTargetSelection(target.id)}
                                      className="rounded border-white/10 bg-white/5 text-[var(--color-brand)] focus:ring-[var(--color-brand)]"
                                    />
                                    <span>{target.name} ({target.channel})</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Edit Pesan (Gunakan {"{name}"}):</span>
                              <textarea
                                value={editingTemplate}
                                onChange={(e) => setEditingTemplate(e.target.value)}
                                className="w-full text-[10px] bg-black/40 border border-white/5 focus:border-[var(--color-brand)] rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)] resize-none h-14 custom-scrollbar"
                                placeholder="Gunakan {name}..."
                              />
                            </div>
                          </>
                        )}

                        {/* RENDER CREATE BOOKING */}
                        {msg.proposal.type === "create_booking" && msg.proposal.data && (
                          <div className="space-y-1.5 text-[10px] text-slate-300 bg-white/5 rounded-lg p-2.5 border border-white/5">
                            <div className="flex justify-between"><span className="text-slate-500">Pelanggan:</span> <span className="font-medium text-white">{msg.proposal.data.customer}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Layanan:</span> <span className="font-medium text-white">{msg.proposal.data.service}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Tanggal:</span> <span className="font-medium text-white">{msg.proposal.data.date}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Jam Slot:</span> <span className="font-medium text-white">{msg.proposal.data.slot}</span></div>
                            {msg.proposal.data.note && (
                              <div className="border-t border-white/5 pt-1 mt-1 text-slate-400 italic">&quot;{msg.proposal.data.note}&quot;</div>
                            )}
                          </div>
                        )}

                        {/* RENDER CREATE TICKET */}
                        {msg.proposal.type === "create_ticket" && msg.proposal.data && (
                          <div className="space-y-1.5 text-[10px] text-slate-300 bg-white/5 rounded-lg p-2.5 border border-white/5">
                            <div className="flex justify-between"><span className="text-slate-500">Pelanggan:</span> <span className="font-medium text-white">{msg.proposal.data.customerName}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Masalah:</span> <span className="font-medium text-white">{msg.proposal.data.issueType}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Prioritas:</span> <span className="font-medium text-amber-400 capitalize">{msg.proposal.data.priority}</span></div>
                            {msg.proposal.data.summary && (
                              <div className="border-t border-white/5 pt-1 mt-1 text-slate-400 italic">&quot;{msg.proposal.data.summary}&quot;</div>
                            )}
                          </div>
                        )}

                        {/* RENDER CREATE CONTACT */}
                        {msg.proposal.type === "create_contact" && msg.proposal.data && (
                          <div className="space-y-1.5 text-[10px] text-slate-300 bg-white/5 rounded-lg p-2.5 border border-white/5">
                            <div className="flex justify-between"><span className="text-slate-500">Nama:</span> <span className="font-medium text-white">{msg.proposal.data.name}</span></div>
                            {msg.proposal.data.phone && <div className="flex justify-between"><span className="text-slate-500">WhatsApp:</span> <span className="font-medium text-white">{msg.proposal.data.phone}</span></div>}
                            {msg.proposal.data.email && <div className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="font-medium text-white">{msg.proposal.data.email}</span></div>}
                            {msg.proposal.data.username && <div className="flex justify-between"><span className="text-slate-500">Instagram:</span> <span className="font-medium text-white">{msg.proposal.data.username}</span></div>}
                            <div className="flex justify-between"><span className="text-slate-500">Channel:</span> <span className="font-medium text-white">{msg.proposal.data.channel || "WhatsApp"}</span></div>
                          </div>
                        )}

                        {/* RENDER CREATE PRODUCT */}
                        {msg.proposal.type === "create_product" && msg.proposal.data && (
                          <div className="space-y-1.5 text-[10px] text-slate-300 bg-white/5 rounded-lg p-2.5 border border-white/5">
                            <div className="flex justify-between"><span className="text-slate-500">Produk:</span> <span className="font-medium text-white">{msg.proposal.data.name}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Harga:</span> <span className="font-medium text-cyan-400">{msg.proposal.data.price}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Stok:</span> <span className="font-medium text-white">{msg.proposal.data.stock}</span></div>
                            {msg.proposal.data.description && (
                              <div className="border-t border-white/5 pt-1 mt-1 text-slate-400 italic">&quot;{msg.proposal.data.description}&quot;</div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-end gap-1.5 pt-1.5 border-t border-white/5">
                          <button
                            onClick={() => handleCancelProposal(index)}
                            className="h-6 text-[9px] px-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition"
                          >
                            Batal
                          </button>
                          <button
                            disabled={msg.proposalStatus === "loading" || (msg.proposal.type === "send_followup" && selectedTargetIds.length === 0)}
                            onClick={() => handleExecuteProposal(index, msg.proposal!)}
                            className="h-6 text-[9px] px-2.5 rounded-lg bg-[var(--color-brand)] text-slate-950 hover:bg-[var(--color-brand)]/90 flex items-center gap-1 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {msg.proposalStatus === "loading" ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Memproses...
                              </>
                            ) : (
                              "Setujui & Jalankan"
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1.5">
                        <div className={`p-2 rounded-lg text-[9px] ${
                          msg.proposalStatus === "success" 
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold" 
                            : "bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold"
                        }`}>
                          {msg.proposalResultMsg}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <span
                  className={`text-[8px] block mt-1 text-right ${
                    isUser ? "text-slate-900/60" : "text-slate-500"
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/[0.03] border border-white/5 text-slate-400 rounded-2xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-2 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-brand)]" />
              <span>AI sedang merangkum data...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion list */}
      {messages.length === 1 && !isLoading && (
        <div className="px-4 py-2 border-t border-white/5 bg-black/10 space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-500 block">Rekomendasi Pertanyaan:</span>
          <div className="flex flex-col gap-1">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSendMessage(suggestion)}
                className="w-full text-left text-[11px] text-slate-300 hover:text-[var(--color-brand)] bg-white/[0.02] border border-white/5 hover:bg-white/5 px-2.5 py-1.5 rounded-lg transition truncate"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-white/5 bg-[var(--color-surface-strong)] flex items-center gap-2 shrink-0">
        <Input
          placeholder="Tanya asisten Balesin Desk..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
          className="bg-black/20 text-xs border-white/5 focus:border-[var(--color-brand)] h-9"
          disabled={isLoading}
        />
        <Button
          onClick={() => handleSendMessage(inputText)}
          disabled={isLoading || !inputText.trim()}
          className="h-9 w-9 p-0 shrink-0 bg-[var(--color-brand)] text-slate-950 hover:bg-[var(--color-brand)]/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

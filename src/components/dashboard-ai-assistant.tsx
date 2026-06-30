"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, X, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Message = {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
};

const SUGGESTIONS = [
  "Rangkum booking terbaru",
  "Berapa tiket prioritas High?",
  "Daftar jasa & produk Johan Garage",
  "Bagaimana cara koneksi Instagram?",
];

export function DashboardAIAssistant() {
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

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

      const payload = (await response.json()) as { ok: boolean; reply?: string; error?: string };
      
      if (!payload.ok || !payload.reply) {
        throw new Error(payload.error || "Gagal memproses pesan.");
      }

      const botMsg: Message = {
        sender: "bot",
        text: payload.reply,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand)] text-slate-950 shadow-lg hover:shadow-[0_0_15px_rgba(0,210,255,0.5)] hover:scale-105 active:scale-95 transition-all duration-200"
          title="Tanya AI Copilot"
        >
          <Bot className="h-6 w-6 animate-pulse" />
        </button>
      )}

      {/* Floating Chat Container */}
      {isOpen && (
        <Card className="w-96 h-[520px] border-white/10 bg-[var(--color-surface)] shadow-2xl flex flex-col rounded-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-[var(--color-surface-strong)] border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  AI Copilot
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="text-[10px] text-slate-500">Asisten data Johan Garage</div>
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
          <div className="p-3 border-t border-white/5 bg-[var(--color-surface-strong)] flex items-center gap-2">
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
      )}
    </div>
  );
}

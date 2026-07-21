"use client";

import {
  Bot,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FlowPreviewResult } from "./flow-builder-types";

type Props = {
  message: string;
  nowIso: string;
  result: FlowPreviewResult | null;
  isRunning: boolean;
  onMessageChange: (value: string) => void;
  onNowChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
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
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/8 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black tracking-[0.18em] text-cyan-400 uppercase">
              Preview Conversation
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Sandbox, tidak mengirim pesan sungguhan.
            </p>
          </div>
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="mt-3 space-y-2">
          <Input
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            placeholder="Tulis pesan pelanggan..."
            className="bg-black/30"
          />
          <Input
            type="datetime-local"
            value={nowIso}
            onChange={(event) => onNowChange(event.target.value)}
            className="bg-black/30 text-[11px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={onRun}
              disabled={isRunning || !message.trim()}
              className="h-9 flex-1 gap-2 px-3 text-xs"
            >
              {isRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {isRunning ? "Running..." : "Test Draft"}
            </Button>
            <Button
              variant="secondary"
              onClick={onReset}
              className="h-9 px-3"
              aria-label="Reset preview"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!result ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="h-8 w-8 text-slate-700" />
            <p className="mt-3 text-xs font-bold text-slate-300">
              Flow belum dites
            </p>
            <p className="mt-1 max-w-52 text-[10px] leading-relaxed text-slate-600">
              Masukkan pesan dan waktu simulasi, lalu jalankan Draft.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ChatBubble sender="customer" text={message} />
            {result.messages.map((item, index) => (
              <ChatBubble key={`${item}-${index}`} sender="bot" text={item} />
            ))}
            {result.error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] p-3 text-[10px] text-red-300">
                {result.error}
              </div>
            )}

            <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase">
                  Execution Trace
                </p>
                {result.decision && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${result.decision.grounded ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}
                  >
                    {result.decision.grounded ? "Grounded" : "Fallback"}{" "}
                    {result.decision.confidence}%
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {result.trace.map((step, index) => (
                  <div
                    key={`${step.nodeId}-${index}`}
                    className="flex items-center gap-2 text-[10px]"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 font-mono text-cyan-300">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-slate-300">
                      {step.label}
                    </span>
                    {step.outcome && (
                      <span className="text-slate-600">{step.outcome}</span>
                    )}
                  </div>
                ))}
              </div>
              {result.needsHuman && (
                <p className="mt-3 rounded-lg bg-red-400/[0.06] px-2.5 py-2 text-[10px] text-red-300">
                  Handoff: {result.handoffTarget || "Admin"}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatBubble({
  sender,
  text,
}: {
  sender: "customer" | "bot";
  text: string;
}) {
  const isCustomer = sender === "customer";
  return (
    <div
      className={`flex items-end gap-2 ${isCustomer ? "justify-end" : "justify-start"}`}
    >
      {!isCustomer && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
          <Bot className="h-3.5 w-3.5" />
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${isCustomer ? "rounded-br-md bg-blue-500 text-white" : "rounded-bl-md border border-white/8 bg-white/[0.05] text-slate-200"}`}
      >
        {text}
      </div>
      {isCustomer && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/8 text-slate-400">
          <UserRound className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );
}

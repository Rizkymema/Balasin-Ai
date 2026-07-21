"use client";

import {
  Bot,
  Clock3,
  FileText,
  Flag,
  MessageSquareText,
  Plus,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";

import type { ConversationFlowNodeType } from "@/types/dashboard-config";

const ITEMS: Array<{
  type: ConversationFlowNodeType;
  label: string;
  description: string;
  icon: typeof Flag;
}> = [
  {
    type: "message",
    label: "Send Message",
    description: "Pesan tetap ke pelanggan",
    icon: MessageSquareText,
  },
  {
    type: "form_chat",
    label: "Form Chat",
    description: "Form isian interaktif (Nama, WA, Booking)",
    icon: FileText,
  },
  {
    type: "office_hours",
    label: "Office Hours",
    description: "Cabang jam kerja",
    icon: Clock3,
  },
  {
    type: "ai_agent",
    label: "AI Agent",
    description: "Jawaban Agent + RAG",
    icon: Bot,
  },
  {
    type: "fallback",
    label: "Fallback",
    description: "Balasan aman",
    icon: ShieldAlert,
  },
  {
    type: "handoff",
    label: "Handoff",
    description: "Teruskan ke admin",
    icon: UserRoundCheck,
  },
  { type: "end", label: "End", description: "Akhiri alur", icon: Flag },
];

export function NodePalette({
  onAdd,
}: {
  onAdd: (type: ConversationFlowNodeType) => void;
}) {
  return (
    <aside className="flex min-h-0 flex-col border-r border-white/8 bg-[#0a0a0c]">
      <div className="border-b border-white/8 px-4 py-4">
        <p className="text-[10px] font-black tracking-[0.18em] text-cyan-400 uppercase">
          Node Library
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          Klik node untuk menambahkannya ke canvas.
        </p>
      </div>
      <div className="space-y-2 overflow-y-auto p-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => onAdd(item.type)}
              className="group flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-left transition hover:border-cyan-400/35 hover:bg-cyan-400/[0.04]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-300 group-hover:text-cyan-300">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-white">
                  {item.label}
                </span>
                <span className="block truncate text-[10px] text-slate-500">
                  {item.description}
                </span>
              </span>
              <Plus className="h-3.5 w-3.5 text-slate-600 group-hover:text-cyan-400" />
            </button>
          );
        })}
      </div>
    </aside>
  );
}

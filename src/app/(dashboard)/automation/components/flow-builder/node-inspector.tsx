"use client";

import { Bot, Settings2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  AIAgent,
  ConversationFlowNodeData,
} from "@/types/dashboard-config";
import type { FlowCanvasNode } from "./flow-builder-types";

type Props = {
  node: FlowCanvasNode | null;
  agents: AIAgent[];
  onChange: (data: ConversationFlowNodeData) => void;
  onDelete: () => void;
};

export function NodeInspector({ node, agents, onChange, onDelete }: Props) {
  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-slate-500">
          <Settings2 className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm font-bold text-white">Pilih sebuah node</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Pengaturan node akan ditampilkan di panel ini.
        </p>
      </div>
    );
  }

  const update = (patch: Partial<ConversationFlowNodeData>) =>
    onChange({ ...node.data, ...patch });

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-start justify-between border-b border-white/8 pb-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.18em] text-cyan-400 uppercase">
            Node Inspector
          </p>
          <h3 className="mt-1 text-sm font-bold text-white">
            {node.data.label}
          </h3>
          <p className="mt-0.5 font-mono text-[9px] text-slate-600">
            {node.id}
          </p>
        </div>
        {node.type !== "start" && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
            aria-label="Hapus node"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Node Label">
          <Input
            value={node.data.label}
            onChange={(event) => update({ label: event.target.value })}
            className="bg-black/30"
          />
        </Field>

        {node.type === "start" && (
          <>
            <Field label="Trigger">
              <select
                value={node.data.trigger ?? "first_incoming_message"}
                onChange={(event) =>
                  update({
                    trigger: event.target
                      .value as ConversationFlowNodeData["trigger"],
                  })
                }
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-white outline-none focus:border-cyan-400"
              >
                <option value="first_incoming_message">
                  Pesan pertama masuk
                </option>
                <option value="outside_office_hours">Di luar jam kerja</option>
                <option value="keyword_match">Keyword tertentu</option>
                <option value="customer_asks_admin">
                  Pelanggan meminta admin
                </option>
                <option value="booking_intent">Booking intent</option>
                <option value="high_risk">High risk / komplain</option>
              </select>
            </Field>
            {node.data.trigger === "keyword_match" && (
              <Field label="Trigger Keywords" hint="Pisahkan dengan koma.">
                <Input
                  value={(node.data.triggerKeywords ?? []).join(", ")}
                  onChange={(event) =>
                    update({
                      triggerKeywords: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="servis, booking, harga"
                  className="bg-black/30"
                />
              </Field>
            )}
          </>
        )}

        {(node.type === "message" || node.type === "fallback") && (
          <Field label="Message" hint="Pesan ini akan terlihat oleh pelanggan.">
            <Textarea
              value={node.data.message ?? ""}
              onChange={(event) => update({ message: event.target.value })}
              className="min-h-36 bg-black/30 text-xs leading-relaxed"
            />
          </Field>
        )}

        {node.type === "office_hours" && (
          <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-3 text-[11px] leading-relaxed text-amber-100/70">
            Node menggunakan timezone dan jam operasional dari Workspace
            Settings. Output `Inside` dan `Outside` wajib terhubung.
          </div>
        )}

        {node.type === "ai_agent" && (
          <>
            <Field label="AI Agent">
              <select
                value={node.data.agentId ?? ""}
                onChange={(event) =>
                  update({ agentId: event.target.value || undefined })
                }
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-white outline-none focus:border-cyan-400"
              >
                <option value="">Auto by channel</option>
                {agents.map((agent) => (
                  <option
                    key={agent.id}
                    value={agent.id}
                    disabled={agent.status !== "Active"}
                  >
                    {agent.name} ({agent.status})
                  </option>
                ))}
              </select>
            </Field>
            <Toggle
              icon={Bot}
              label="Use Conversation History"
              checked={node.data.useConversationHistory !== false}
              onChange={(checked) =>
                update({ useConversationHistory: checked })
              }
            />
            <Toggle
              icon={Bot}
              label="Knowledge Base wajib"
              checked={node.data.requireKnowledgeBase !== false}
              onChange={(checked) => update({ requireKnowledgeBase: checked })}
            />
            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3 text-[11px] leading-relaxed text-cyan-100/70">
              Output: Answered, Human, No data, dan Error. Custom Instructions
              global otomatis diterapkan.
            </div>
          </>
        )}

        {node.type === "handoff" && (
          <>
            <Field label="Handoff Target">
              <Input
                value={node.data.handoffTarget ?? ""}
                onChange={(event) =>
                  update({ handoffTarget: event.target.value })
                }
                placeholder="Admin Desk"
                className="bg-black/30"
              />
            </Field>
            <Field label="Reason">
              <Textarea
                value={node.data.handoffReason ?? ""}
                onChange={(event) =>
                  update({ handoffReason: event.target.value })
                }
                className="min-h-24 bg-black/30"
              />
            </Field>
            <Field label="Customer Message">
              <Textarea
                value={node.data.message ?? ""}
                onChange={(event) => update({ message: event.target.value })}
                className="min-h-24 bg-black/30"
              />
            </Field>
          </>
        )}

        {node.type === "end" && (
          <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3 text-[11px] leading-relaxed text-slate-400">
            End menghentikan eksekusi branch ini. Node End tidak memiliki
            output.
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-bold text-slate-300">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-slate-600">{hint}</span>}
    </label>
  );
}

function Toggle({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: typeof Bot;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] p-3">
      <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
        <Icon className="h-3.5 w-3.5 text-cyan-400" />
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-cyan-500"
      />
    </label>
  );
}

"use client";

import {
  Bot,
  Clock3,
  Flag,
  GitBranch,
  MessageSquareText,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { FlowCanvasNode } from "./flow-builder-types";

const NODE_STYLES = {
  start: { icon: Flag, color: "#30d158", eyebrow: "Entry point" },
  message: {
    icon: MessageSquareText,
    color: "#0a84ff",
    eyebrow: "Bot message",
  },
  office_hours: { icon: Clock3, color: "#ff9f0a", eyebrow: "Condition" },
  ai_agent: { icon: Bot, color: "#64d2ff", eyebrow: "AI response" },
  fallback: { icon: ShieldAlert, color: "#bf5af2", eyebrow: "Safe fallback" },
  handoff: { icon: UserRoundCheck, color: "#ff453a", eyebrow: "Human handoff" },
  end: { icon: Flag, color: "#86868b", eyebrow: "End flow" },
} as const;

const OUTPUTS: Partial<
  Record<FlowCanvasNode["type"], Array<{ id: string; label: string }>>
> = {
  office_hours: [
    { id: "outside", label: "Outside" },
    { id: "inside", label: "Inside" },
  ],
  ai_agent: [
    { id: "answered", label: "Answered" },
    { id: "needs_human", label: "Human" },
    { id: "not_found", label: "No data" },
    { id: "error", label: "Error" },
  ],
};

export function FlowNodeCard({
  data,
  type,
  selected,
}: NodeProps<FlowCanvasNode>) {
  const resolvedType = type ?? "message";
  const style = NODE_STYLES[resolvedType];
  const Icon = style.icon;
  const outputs = OUTPUTS[resolvedType];
  const preview =
    data.message ||
    (resolvedType === "ai_agent"
      ? data.agentId
        ? "Agent khusus terhubung"
        : "Auto by channel"
      : resolvedType === "office_hours"
        ? "Workspace schedule"
        : resolvedType === "handoff"
          ? data.handoffTarget || "Admin Desk"
          : "");

  return (
    <div
      className={`max-w-[260px] min-w-[210px] rounded-2xl border bg-[#121214]/95 shadow-2xl backdrop-blur transition ${
        selected ? "border-cyan-400 ring-4 ring-cyan-400/10" : "border-white/12"
      }`}
    >
      {resolvedType !== "start" && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !border-2 !border-black !bg-slate-400"
        />
      )}
      <div className="flex items-center gap-2 border-b border-white/8 px-3.5 py-2.5">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${style.color}20`, color: style.color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p
            className="text-[9px] font-black tracking-[0.16em] uppercase"
            style={{ color: style.color }}
          >
            {style.eyebrow}
          </p>
          <p className="truncate text-xs font-bold text-white">{data.label}</p>
        </div>
      </div>
      {preview && (
        <p className="line-clamp-3 px-3.5 py-3 text-[11px] leading-relaxed text-slate-300">
          {preview}
        </p>
      )}
      {outputs ? (
        <div
          className="grid gap-px border-t border-white/8 bg-white/8"
          style={{
            gridTemplateColumns: `repeat(${outputs.length}, minmax(0, 1fr))`,
          }}
        >
          {outputs.map((output, index) => (
            <div
              key={output.id}
              className="relative bg-[#121214] px-1 py-2 text-center text-[8px] font-bold text-slate-400"
            >
              {output.label}
              <Handle
                id={output.id}
                type="source"
                position={Position.Bottom}
                className="!h-2.5 !w-2.5 !border-2 !border-black"
                style={{
                  left: `${((index + 1) / (outputs.length + 1)) * 100}%`,
                  backgroundColor: style.color,
                }}
              />
            </div>
          ))}
        </div>
      ) : resolvedType !== "end" ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !border-2 !border-black"
          style={{ backgroundColor: style.color }}
        />
      ) : null}
    </div>
  );
}

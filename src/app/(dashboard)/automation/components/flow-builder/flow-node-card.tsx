"use client";

import {
  Bot,
  Clock3,
  Flag,
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

  if (resolvedType === "start") {
    return (
      <div
        className={`relative rounded-full border bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg transition ${selected ? "border-cyan-300 ring-4 ring-cyan-400/20" : "border-blue-500"}`}
      >
        Start point
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-4 !w-4 !border-2 !border-white !bg-blue-600"
        />
      </div>
    );
  }

  if (resolvedType === "end") {
    return (
      <div
        className={`relative flex min-w-[150px] items-center justify-center gap-2 rounded-lg border bg-slate-100 px-4 py-2 text-[10px] font-bold text-slate-600 shadow-sm transition ${selected ? "border-cyan-500 ring-4 ring-cyan-400/15" : "border-slate-300"}`}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !border-2 !border-white !bg-slate-500"
        />
        <Flag className="h-3.5 w-3.5" />
        {data.label}
      </div>
    );
  }

  return (
    <div
      className={`max-w-[250px] min-w-[210px] rounded-xl border bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)] transition ${
        selected
          ? "border-cyan-500 ring-4 ring-cyan-400/15"
          : "border-slate-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-slate-500"
      />
      <div className="flex items-center gap-2 border-b border-slate-200 px-3.5 py-2.5">
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
          <p className="truncate text-xs font-bold text-slate-900">
            {data.label}
          </p>
        </div>
      </div>
      {preview && (
        <p className="line-clamp-3 px-3.5 py-3 text-[11px] leading-relaxed text-slate-600">
          {preview}
        </p>
      )}
      {outputs ? (
        <div
          className="grid gap-px border-t border-slate-200 bg-slate-200"
          style={{
            gridTemplateColumns: `repeat(${outputs.length}, minmax(0, 1fr))`,
          }}
        >
          {outputs.map((output, index) => (
            <div
              key={output.id}
              className="relative bg-slate-50 px-1 py-2 text-center text-[8px] font-bold text-slate-500"
            >
              {output.label}
              <Handle
                id={output.id}
                type="source"
                position={Position.Bottom}
                className="!h-2.5 !w-2.5 !border-2 !border-white"
                style={{
                  left: `${((index + 1) / (outputs.length + 1)) * 100}%`,
                  backgroundColor: style.color,
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !border-2 !border-white"
          style={{ backgroundColor: style.color }}
        />
      )}
    </div>
  );
}

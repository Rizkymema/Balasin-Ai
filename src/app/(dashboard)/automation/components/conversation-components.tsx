"use client";

import {
  MessageSquareText,
  Search,
  MoreVertical,
  Edit2,
  Copy,
  PowerOff,
  Power,
  Trash2,
  BotMessageSquare,
  WandSparkles,
  Settings,
  MessageSquare,
  Instagram,
  Send,
  HelpCircle,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import type { ConversationFlow } from "@/types/dashboard-config";

export function BotResponseQuotaCard({ quota }: { quota: number }) {
  return (
    <Card className="flex flex-col gap-2 p-5 bg-white border-slate-200">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900">
            Bot Response Quota
          </div>
          <div className="text-xs text-slate-500">
            Sisa kuota balasan otomatis bot workspace Anda.
          </div>
        </div>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">
        {quota.toLocaleString("id-ID")}
      </div>
    </Card>
  );
}

export function ConversationSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="text"
        placeholder="Search conversations..."
        className="h-9 border-slate-200 bg-white pl-9 text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: ConversationFlow["status"] }) {
  if (status === "Published") {
    return <Badge variant="success">Active</Badge>;
  }
  if (status === "Draft") {
    return <Badge variant="warning">Draft</Badge>;
  }
  return <Badge variant="secondary">Inactive</Badge>;
}

function ChannelBadge({ channel }: { channel: string }) {
  const normalized = channel.toLowerCase();
  
  if (normalized.includes("whatsapp")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
        {channel}
      </span>
    );
  }
  if (normalized.includes("instagram")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1 text-xs font-bold text-fuchsia-700">
        <Instagram className="h-3.5 w-3.5 text-fuchsia-600" />
        {channel}
      </span>
    );
  }
  if (normalized.includes("telegram")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
        <Send className="h-3.5 w-3.5 text-sky-600" />
        {channel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
      <MessageSquareText className="h-3.5 w-3.5 text-blue-600" />
      {channel}
    </span>
  );
}

export function ConversationTable({
  conversations,
  onEdit,
  onDuplicate,
  onToggleStatus,
  togglingFlowId,
  onDelete,
  onEditSettings,
}: {
  conversations: ConversationFlow[];
  onEdit: (flow: ConversationFlow) => void;
  onDuplicate: (flow: ConversationFlow) => void;
  onToggleStatus: (flow: ConversationFlow) => void;
  togglingFlowId?: string | null;
  onDelete: (flow: ConversationFlow) => void;
  onEditSettings?: (flow: ConversationFlow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
      <table className="w-full text-left text-xs text-slate-700">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
          <tr>
            <th className="px-4 py-3.5 font-bold">Conversation Name</th>
            <th className="px-4 py-3.5 font-bold">Bot Response</th>
            <th className="px-4 py-3.5 font-bold">Channel</th>
            <th className="px-4 py-3.5 font-bold">Last Update</th>
            <th className="px-4 py-3.5 font-bold">Status</th>
            <th className="px-4 py-3.5 text-right font-bold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {conversations.map((flow) => {
            const dropdownItems = [
              {
                label: "Edit Settings",
                icon: <Settings className="h-4 w-4" />,
                onClick: () => onEditSettings?.(flow),
              },
              {
                label: "Duplicate",
                icon: <Copy className="h-4 w-4" />,
                onClick: () => onDuplicate(flow),
              },
            ] as Array<{
              label: string;
              onClick: () => void;
              icon?: React.ReactNode;
              className?: string;
              danger?: boolean;
            }>;

            if (flow.status !== "Draft") {
              dropdownItems.push({
                label: flow.status === "Published" ? "Deactivate" : "Activate",
                icon: flow.status === "Published" ? (
                  <PowerOff className="h-4 w-4" />
                ) : (
                  <Power className="h-4 w-4" />
                ),
                onClick: () => onToggleStatus(flow),
              });
            }

            dropdownItems.push({
              label: "Delete",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => onDelete(flow),
              danger: true,
            });

            return (
              <tr
                key={flow.id}
                className="transition-colors hover:bg-slate-50/70"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 font-bold">
                      <MessageSquareText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate max-w-[240px]" title={flow.name}>
                        {flow.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <Zap className="h-3 w-3 text-slate-400" />
                        <span className="truncate max-w-[200px]" title={flow.trigger}>
                          Trigger: {flow.trigger}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-900">
                      {flow.botResponse.toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs text-slate-500">responses</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <ChannelBadge channel={flow.channel} />
                </td>
                <td className="px-4 py-3.5 text-slate-500 font-medium">{flow.lastUpdate}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={flow.status} />
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onEdit(flow)}
                      className="gap-1.5 text-xs font-bold"
                    >
                      <WandSparkles className="h-3.5 w-3.5" />
                      Builder
                    </Button>
                    <Dropdown
                      align="right"
                      trigger={
                        <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      }
                      items={dropdownItems}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyConversationState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center shadow-2xs">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <BotMessageSquare className="h-7 w-7" />
      </div>
      <h3 className="mb-1 text-base font-bold text-slate-900">
        Belum ada conversation
      </h3>
      <p className="mx-auto mb-5 max-w-sm text-xs text-slate-500">
        Buat conversation pertama Anda untuk mulai mengatur chatbot otomatis di berbagai channel.
      </p>
      <Button onClick={onCreate} variant="primary" size="sm" className="gap-2">
        Create Conversation
      </Button>
    </div>
  );
}

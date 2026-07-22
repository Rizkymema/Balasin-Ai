"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  Mail,
  MessageSquareText,
  Phone,
  Plus,
  Sparkles,
  Tag,
  Ticket,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { ConversationRecord } from "@/types/operations";

import {
  type ConversationContext,
  getConversationStatusMeta,
  getSuggestedNextAction,
  maskEmail,
  maskPhone,
} from "./inbox-view-model";

type CustomerContextPanelProps = {
  conversation: ConversationRecord | null;
  context: ConversationContext | null;
  onCreateTicket: () => void;
  onUpdateSentiment?: (sentiment: "positive" | "neutral" | "negative") => Promise<void>;
  hiddenOnDesktop?: boolean;
};

function SidebarSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-white/[0.06] px-5 py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-slate-200">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-[12px]">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-300">{value}</span>
    </div>
  );
}

function statusCardClass(status: ConversationRecord["status"]) {
  switch (status) {
    case "resolved":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    case "assigned_to_admin":
      return "border-blue-400/30 bg-blue-500/15 text-blue-300";
    case "waiting_customer":
      return "border-cyan-400/30 bg-cyan-500/15 text-cyan-300";
    case "ai_paused":
      return "border-amber-400/30 bg-amber-500/15 text-amber-300";
    case "blocked":
      return "border-red-400/30 bg-red-500/15 text-red-300";
    case "spam":
      return "border-slate-500/30 bg-slate-500/15 text-slate-400";
    default:
      return "border-cyan-400/30 bg-cyan-500/15 text-cyan-300";
  }
}

export function CustomerContextPanel({
  conversation,
  context,
  onCreateTicket,
  onUpdateSentiment,
  hiddenOnDesktop = false,
}: CustomerContextPanelProps) {
  if (!conversation || !context) {
    return (
      <aside
        className={cn(
          "rounded-xl border border-white/[0.06] bg-[#0a0e1c] lg:h-full",
          hiddenOnDesktop ? "xl:hidden" : "",
        )}
      >
        <EmptyState
          title="Customer context belum tersedia"
          description="Pilih percakapan agar panel kanan menampilkan identitas customer, AI summary, ticket, dan booking terkait."
          className="min-h-[42rem] border-none bg-transparent lg:h-full lg:min-h-0"
          icon={<UserRound className="h-10 w-10" />}
        />
      </aside>
    );
  }

  const statusMeta = getConversationStatusMeta(conversation);
  const StatusIcon = statusMeta.icon;

  return (
    <aside
      className={cn(
        "custom-scrollbar overflow-y-auto overscroll-contain rounded-xl border border-white/[0.06] bg-[#0a0e1c] lg:h-full lg:min-h-0",
        hiddenOnDesktop ? "xl:hidden" : "",
      )}
    >
      {/* Customer Avatar & Name */}
      <div className="flex items-start gap-3 px-5 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] text-slate-400">
          <UserRound className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-[1.1rem] font-semibold text-slate-100">
            {conversation.name}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-[13px] text-slate-500">
            <span>{conversation.channel}</span>
          </div>
          <div
            className={cn(
              "mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold",
              statusCardClass(conversation.status),
            )}
          >
            <StatusIcon className="mr-1 h-3.5 w-3.5" />
            {statusMeta.shortLabel}
          </div>
        </div>
      </div>

      <SidebarSection title="Contact">
        <div className="space-y-3">
          <div className="inline-flex w-full items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
            <Phone className="h-4 w-4 text-slate-500" />
            {maskPhone(conversation.phone)}
          </div>
          <div className="inline-flex w-full items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
            <Mail className="h-4 w-4 text-slate-500" />
            {maskEmail(conversation.email)}
          </div>
        </div>
      </SidebarSection>

      <SidebarSection
        title="Room History"
        action={<ChevronRight className="h-4 w-4 text-slate-500" />}
      >
        <div className="space-y-3">
          <DetailRow label="Customer since" value={context.customerSinceLabel} />
          <DetailRow
            label="Total chat"
            value={`${context.customer?.totalConversation ?? 0}`}
          />
          <DetailRow label="Lead score" value={`${context.leadScore}/100`} />
        </div>
      </SidebarSection>

      <SidebarSection
        title="Profile Information"
        action={<Plus className="h-4 w-4 text-slate-500" />}
      >
        <div className="space-y-3">
          <DetailRow
            label="Lifecycle"
            value={context.customer?.leadStatus ?? "Belum tersegmentasi"}
          />
          <DetailRow
            label="Segment"
            value={context.customer?.segment || "General"}
          />
          <DetailRow label="Assigned" value={conversation.assignedTo} />
          <DetailRow label="Intent" value={conversation.lastIntent} />
        </div>
      </SidebarSection>

      <SidebarSection title="Notes">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
          <p className="text-sm leading-6 text-slate-400">
            {conversation.notes.trim()
              ? conversation.notes
              : "Belum ada catatan internal pada percakapan ini."}
          </p>
        </div>
      </SidebarSection>

      <SidebarSection title="Tags">
        <div className="flex flex-wrap gap-2">
          {conversation.tags.length > 0 ? (
            conversation.tags.map((tag) => (
              <Badge
                key={tag}
                className="rounded-full border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] text-slate-400"
              >
                <Tag className="mr-1 h-3.5 w-3.5" />
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-slate-500">Belum ada tag</span>
          )}
        </div>
      </SidebarSection>

      <SidebarSection title="About Room">
        <div className="space-y-3">
          <DetailRow label="Created" value={conversation.timestamp} />
          <DetailRow
            label="Last Seen"
            value={conversation.lastSeenAt || conversation.timestamp}
          />
          <DetailRow
            label="Session"
            value={conversation.status === "resolved" ? "Expired" : "Active"}
          />
        </div>
      </SidebarSection>

      <SidebarSection title="AI Summary">
        <div className="space-y-3">
          <div className="rounded-xl border border-[#00d2ff]/15 bg-[#00d2ff]/[0.06] p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-[#00d2ff]" />
              <p className="text-sm leading-6 text-slate-300">
                {conversation.summary}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Next Action
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {getSuggestedNextAction(conversation)}
            </p>
          </div>
        </div>
      </SidebarSection>

      <SidebarSection title="Automation Runtime">
        <div className="space-y-3">
          <DetailRow
            label="Flow"
            value={conversation.automation?.activeFlowName ?? "Belum dipetakan"}
          />
          <DetailRow
            label="AI Agent"
            value={conversation.automation?.activeAgentName ?? "Default AI"}
          />
          <DetailRow
            label="AI Reply Count"
            value={`${conversation.automation?.aiReplyCount ?? 0}`}
          />
          <DetailRow
            label="Handoff Reason"
            value={conversation.automation?.handoffReason ?? "-"}
          />
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Latest Automation Logs
            </p>
            <div className="mt-3 space-y-3">
              {(conversation.automation?.logs ?? []).length > 0 ? (
                conversation.automation?.logs.slice(0, 3).map((log) => (
                  <div key={log.id} className="rounded-lg border border-white/[0.05] bg-black/20 p-2.5">
                    <p className="text-[11px] font-semibold text-slate-300">{log.event}</p>
                    <p className="mt-1 text-[12px] leading-5 text-slate-400">{log.summary}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Belum ada log automation untuk percakapan ini.</p>
              )}
            </div>
          </div>
        </div>
      </SidebarSection>

      <SidebarSection title="Operational">
        <div className="space-y-3">
          <DetailRow
            label="Ticket"
            value={context.activeTicket?.id ?? "Belum ada"}
          />
          <DetailRow
            label="Booking"
            value={context.latestBooking?.service ?? "Belum ada booking"}
          />
          <DetailRow label="Payment" value={context.paymentStatusLabel} />
          <DetailRow label="Last Service" value={context.lastServiceLabel} />
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-[12px] leading-5 text-slate-400">
            {context.latestBooking
              ? [
                  context.latestBooking.date,
                  context.latestBooking.slot,
                  context.latestBooking.status,
                ].join(" | ")
              : "Data booking akan muncul di sini setelah customer dijadwalkan."}
          </div>
        </div>
      </SidebarSection>

      <SidebarSection title="Sentiment & AI Training Feedback">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Sentiment Terdeteksi:</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
              conversation.sentiment === "positive" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
              conversation.sentiment === "negative" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
              "bg-slate-500/10 text-slate-400 border-slate-500/20"
            )}>
              {conversation.sentiment === "positive" ? "Positif 😊" :
               conversation.sentiment === "negative" ? "Negatif 😡" : "Netral 😐"}
            </span>
          </div>

          {onUpdateSentiment && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-[11px] font-semibold text-slate-400 block">Koreksi & Latih AI:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["positive", "neutral", "negative"] as const).map((sent) => (
                  <button
                    key={sent}
                    onClick={() => onUpdateSentiment(sent)}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-[10px] font-bold border transition text-center cursor-pointer",
                      conversation.sentiment === sent
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                        : "bg-white/2 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    )}
                  >
                    {sent === "positive" ? "Positif 😊" :
                     sent === "neutral" ? "Netral 😐" : "Negatif 😡"}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-500 mt-1 leading-normal">
                Memilih sentimen di atas akan mengoreksi status percakapan dan secara otomatis melatih AI (*few-shot reinforcement*) untuk mengenali pola pesan serupa di masa depan.
              </p>
            </div>
          )}
        </div>
      </SidebarSection>

      {conversation.channel === "Instagram Comment" ? (
        <SidebarSection title="Comment Context">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400" />
            <p className="text-sm leading-6 text-slate-300">
              Comment reply butuh moderasi ekstra. Jika topik sensitif, lebih aman
              arahkan ke DM.
            </p>
          </div>
        </SidebarSection>
      ) : null}

      <SidebarSection title="Quick Actions">
        <div className="grid gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-10 justify-start rounded-xl border-white/[0.08] bg-white/[0.04] px-4 text-[11px] text-slate-300 hover:bg-white/[0.08]"
            onClick={onCreateTicket}
          >
            <Ticket className="mr-2 h-4 w-4" />
            Buat Ticket
          </Button>
          {/* 
          <Link
            href="/booking"
            className="inline-flex h-10 items-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-[11px] font-semibold text-slate-300 transition hover:bg-white/[0.08]"
          >
            <CalendarClock className="mr-2 h-4 w-4" />
            Buka Booking
          </Link>
          */}
          <Link
            href="/customers"
            className="inline-flex h-10 items-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-[11px] font-semibold text-slate-300 transition hover:bg-white/[0.08]"
          >
            <UserRound className="mr-2 h-4 w-4" />
            Buka Customer
          </Link>
        </div>
      </SidebarSection>

      <SidebarSection title="Internal Notes">
        <div className="flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] p-3">
          <MessageSquareText className="mt-0.5 h-4 w-4 text-purple-400" />
          <p className="text-sm leading-6 text-slate-300">
            {conversation.notes.trim()
              ? conversation.notes
              : "Belum ada catatan internal pada percakapan ini."}
          </p>
        </div>
      </SidebarSection>
    </aside>
  );
}

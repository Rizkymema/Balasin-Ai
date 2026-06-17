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
    <section className="border-t border-[#eef2f6] px-5 py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-[#344054]">{title}</h3>
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
      <span className="text-[#98a2b3]">{label}</span>
      <span className="text-right font-medium text-[#475467]">{value}</span>
    </div>
  );
}

function statusCardClass(status: ConversationRecord["status"]) {
  switch (status) {
    case "resolved":
      return "border-[#b8e7c9] bg-[#eefbf2] text-[#279455]";
    case "assigned_to_admin":
      return "border-[#bfd3ff] bg-[#edf4ff] text-[#2563eb]";
    case "waiting_customer":
      return "border-[#c7defe] bg-[#eef6ff] text-[#1d4ed8]";
    case "ai_paused":
      return "border-[#f3d6a1] bg-[#fff7e8] text-[#b54708]";
    case "blocked":
      return "border-[#f8c4c7] bg-[#fff1f2] text-[#d92d20]";
    case "spam":
      return "border-[#d6dbe5] bg-[#f7f8fa] text-[#667085]";
    default:
      return "border-[#d7e7ff] bg-[#eff6ff] text-[#1570ef]";
  }
}

export function CustomerContextPanel({
  conversation,
  context,
  onCreateTicket,
  hiddenOnDesktop = false,
}: CustomerContextPanelProps) {
  if (!conversation || !context) {
    return (
      <aside
        className={cn(
          "rounded-[18px] border border-[#d9dfeb] bg-white",
          hiddenOnDesktop ? "xl:hidden" : "",
        )}
      >
        <EmptyState
          title="Customer context belum tersedia"
          description="Pilih percakapan agar panel kanan menampilkan identitas customer, AI summary, ticket, dan booking terkait."
          className="min-h-[42rem] border-none bg-transparent"
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
        "custom-scrollbar min-h-[42rem] overflow-y-auto rounded-[18px] border border-[#d9dfeb] bg-white shadow-[0_8px_24px_rgba(92,110,145,0.08)]",
        hiddenOnDesktop ? "xl:hidden" : "",
      )}
    >
      <div className="flex items-start gap-3 px-5 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#dde4ee] bg-[#f5f7fb] text-[#667085]">
          <UserRound className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-[1.1rem] font-semibold text-[#344054]">
            {conversation.name}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-[13px] text-[#98a2b3]">
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
          <div className="inline-flex w-full items-center gap-2 rounded-[12px] border border-[#e4e7ec] bg-white px-3 py-2 text-sm text-[#475467]">
            <Phone className="h-4 w-4 text-[#98a2b3]" />
            {maskPhone(conversation.phone)}
          </div>
          <div className="inline-flex w-full items-center gap-2 rounded-[12px] border border-[#e4e7ec] bg-white px-3 py-2 text-sm text-[#475467]">
            <Mail className="h-4 w-4 text-[#98a2b3]" />
            {maskEmail(conversation.email)}
          </div>
        </div>
      </SidebarSection>

      <SidebarSection
        title="Room History"
        action={<ChevronRight className="h-4 w-4 text-[#98a2b3]" />}
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
        action={<Plus className="h-4 w-4 text-[#98a2b3]" />}
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
        <div className="rounded-[12px] border border-[#eaecf0] bg-[#fafbfc] p-3">
          <p className="text-sm leading-6 text-[#667085]">
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
                className="rounded-full border-[#e4e7ec] bg-white px-3 py-1 text-[11px] text-[#667085]"
              >
                <Tag className="mr-1 h-3.5 w-3.5" />
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-[#98a2b3]">Belum ada tag</span>
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
          <div className="rounded-[12px] border border-[#d7e7ff] bg-[#eef6ff] p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-[#1570ef]" />
              <p className="text-sm leading-6 text-[#475467]">
                {conversation.summary}
              </p>
            </div>
          </div>
          <div className="rounded-[12px] border border-[#eaecf0] bg-[#fafbfc] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
              Next Action
            </p>
            <p className="mt-2 text-sm leading-6 text-[#475467]">
              {getSuggestedNextAction(conversation)}
            </p>
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
          <div className="rounded-[12px] border border-[#eaecf0] bg-[#fafbfc] p-3 text-[12px] leading-5 text-[#667085]">
            {context.latestBooking
              ? [
                  context.latestBooking.date,
                  context.latestBooking.slot,
                  context.latestBooking.status,
                ].join(" • ")
              : "Data booking akan muncul di sini setelah customer dijadwalkan."}
          </div>
        </div>
      </SidebarSection>

      <SidebarSection title="Sentiment & Risk">
        <div className="rounded-[12px] border border-[#eaecf0] bg-[#fafbfc] p-3">
          <p className="text-sm font-semibold capitalize text-[#344054]">
            {[conversation.sentiment, conversation.riskLevel].join(" • ")}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#667085]">
            {statusMeta.description}
          </p>
        </div>
      </SidebarSection>

      {conversation.channel === "Instagram Comment" ? (
        <SidebarSection title="Comment Context">
          <div className="flex items-start gap-3 rounded-[12px] border border-[#fedf89] bg-[#fffaeb] p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-[#dc6803]" />
            <p className="text-sm leading-6 text-[#475467]">
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
            className="h-10 justify-start rounded-[12px] border-[#dfe5ef] bg-white px-4 text-[11px] text-[#475467] hover:bg-[#f8fafc]"
            onClick={onCreateTicket}
          >
            <Ticket className="mr-2 h-4 w-4" />
            Buat Ticket
          </Button>
          <Link
            href="/booking"
            className="inline-flex h-10 items-center rounded-[12px] border border-[#dfe5ef] bg-white px-4 text-[11px] font-semibold text-[#475467] transition hover:bg-[#f8fafc]"
          >
            <CalendarClock className="mr-2 h-4 w-4" />
            Buka Booking
          </Link>
          <Link
            href="/customers"
            className="inline-flex h-10 items-center rounded-[12px] border border-[#dfe5ef] bg-white px-4 text-[11px] font-semibold text-[#475467] transition hover:bg-[#f8fafc]"
          >
            <UserRound className="mr-2 h-4 w-4" />
            Buka Customer
          </Link>
        </div>
      </SidebarSection>

      <SidebarSection title="Internal Notes">
        <div className="flex items-start gap-3 rounded-[12px] border border-[#e9d7fe] bg-[#f9f5ff] p-3">
          <MessageSquareText className="mt-0.5 h-4 w-4 text-[#7a5af8]" />
          <p className="text-sm leading-6 text-[#475467]">
            {conversation.notes.trim()
              ? conversation.notes
              : "Belum ada catatan internal pada percakapan ini."}
          </p>
        </div>
      </SidebarSection>
    </aside>
  );
}

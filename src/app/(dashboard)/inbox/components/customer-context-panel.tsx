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
    <section className="border-t border-slate-100 px-4 py-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-slate-900">{title}</h3>
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
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
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
          "rounded-2xl border border-slate-200 bg-white shadow-2xs lg:h-full",
          hiddenOnDesktop ? "xl:hidden" : "",
        )}
      >
        <EmptyState
          title="Customer context belum tersedia"
          description="Pilih percakapan agar panel kanan menampilkan identitas customer, AI summary, ticket, dan booking terkait."
          className="min-h-[42rem] border-none bg-transparent lg:h-full lg:min-h-0"
          icon={<UserRound className="h-8 w-8 text-slate-400" />}
        />
      </aside>
    );
  }

  const statusMeta = getConversationStatusMeta(conversation);
  const StatusIcon = statusMeta.icon;

  return (
    <aside
      className={cn(
        "custom-scrollbar overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-2xs lg:h-full lg:min-h-0",
        hiddenOnDesktop ? "xl:hidden" : "",
      )}
    >
      {/* Customer Avatar & Name */}
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-bold">
          <UserRound className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-slate-900">
            {conversation.name}
          </h2>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
            <span>{conversation.channel}</span>
          </div>
          <div className="mt-2 inline-flex items-center">
            <Badge variant="default" className="text-[10px]">
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusMeta.shortLabel}
            </Badge>
          </div>
        </div>
      </div>

      <SidebarSection title="Contact">
        <div className="space-y-2">
          <div className="inline-flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            {maskPhone(conversation.phone)}
          </div>
          <div className="inline-flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {maskEmail(conversation.email)}
          </div>
        </div>
      </SidebarSection>

      <SidebarSection
        title="Room History"
        action={<ChevronRight className="h-4 w-4 text-slate-400" />}
      >
        <div className="space-y-2">
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
        action={<Plus className="h-4 w-4 text-slate-400" />}
      >
        <div className="space-y-2">
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
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs leading-relaxed text-slate-600">
            {conversation.notes.trim()
              ? conversation.notes
              : "Belum ada catatan internal pada percakapan ini."}
          </p>
        </div>
      </SidebarSection>

      <SidebarSection title="Tags">
        <div className="flex flex-wrap gap-1.5">
          {conversation.tags.length > 0 ? (
            conversation.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-lg text-[10px]"
              >
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-slate-400">Belum ada tag</span>
          )}
        </div>
      </SidebarSection>

      <SidebarSection title="AI Summary">
        <div className="space-y-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-blue-600 shrink-0" />
              <p className="text-xs leading-relaxed text-slate-800 font-medium">
                {conversation.summary}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
              Next Action
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-700 font-semibold">
              {getSuggestedNextAction(conversation)}
            </p>
          </div>
        </div>
      </SidebarSection>

      <SidebarSection title="Operational">
        <div className="space-y-2">
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
        </div>
      </SidebarSection>

      <SidebarSection title="Quick Actions">
        <div className="grid gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={onCreateTicket}
          >
            <Ticket className="mr-2 h-4 w-4" />
            Buat Ticket
          </Button>
          <Link
            href="/customers"
            className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <UserRound className="mr-2 h-4 w-4" />
            Buka Customer CRM
          </Link>
        </div>
      </SidebarSection>
    </aside>
  );
}

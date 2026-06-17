"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  Mail,
  MessageSquareText,
  Phone,
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

function ContextBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[var(--color-border)] bg-white/[0.03] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
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
          "rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]",
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

  return (
    <aside
      className={cn(
        "custom-scrollbar min-h-[42rem] overflow-y-auto rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5",
        hiddenOnDesktop ? "xl:hidden" : "",
      )}
    >
      <div className="rounded-[24px] border border-[var(--color-brand)]/20 bg-[var(--color-brand)]/8 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand)]">
          Customer Context
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {conversation.name}
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              {statusMeta.description}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
              <Phone className="h-4 w-4 text-slate-400" />
              {maskPhone(conversation.phone)}
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
              <Mail className="h-4 w-4 text-slate-400" />
              {maskEmail(conversation.email)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <ContextBlock title="CRM Information">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] text-slate-400">Lifecycle stage</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {context.customer?.leadStatus ?? "Belum tersegmentasi"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] text-slate-400">Lead score</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {context.leadScore}/100
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] text-slate-400">Segment</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {context.customer?.segment || "General"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] text-slate-400">Customer since</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {context.customerSinceLabel}
              </p>
            </div>
          </div>
        </ContextBlock>

        <ContextBlock title="AI Summary">
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-cyan-500/15 bg-cyan-500/6 p-3">
              <Sparkles className="mt-0.5 h-4 w-4 text-cyan-200" />
              <p className="text-sm leading-6 text-slate-100">
                {conversation.summary}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] text-slate-400">Suggested next action</p>
              <p className="mt-1 text-sm leading-6 text-white">
                {getSuggestedNextAction(conversation)}
              </p>
            </div>
          </div>
        </ContextBlock>

        <ContextBlock title="Operational Information">
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] text-slate-400">Ticket aktif</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {context.activeTicket?.id ?? "Belum ada"}
                  </p>
                </div>
                <Ticket className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                {context.activeTicket?.summary ??
                  "Gunakan tombol ticket bila butuh handoff ke proses internal."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] text-slate-400">Booking terakhir</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {context.latestBooking?.service ?? "Belum ada booking"}
                  </p>
                </div>
                <CalendarClock className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                {context.latestBooking
                  ? `${context.latestBooking.date} • ${context.latestBooking.slot} • ${context.latestBooking.status}`
                  : "Data booking akan muncul di sini setelah customer dijadwalkan."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] text-slate-400">Payment status</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {context.paymentStatusLabel}
              </p>
            </div>
          </div>
        </ContextBlock>

        <ContextBlock title="Tags & Signals">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {conversation.tags.length > 0 ? (
                conversation.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-200"
                  >
                    <Tag className="mr-1 h-3.5 w-3.5" />
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-400">Belum ada tag</span>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] text-slate-400">Sentiment & risk</p>
              <p className="mt-1 text-sm font-semibold capitalize text-white">
                {conversation.sentiment} • {conversation.riskLevel}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] text-slate-400">Last service hint</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {context.lastServiceLabel}
              </p>
            </div>
          </div>
        </ContextBlock>

        <ContextBlock title="Quick Links">
          <div className="grid gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-11 justify-start rounded-2xl px-4 text-xs"
              onClick={onCreateTicket}
            >
              <Ticket className="mr-2 h-4 w-4" />
              Buat Ticket dari Chat
            </Button>
            <Link
              href="/booking"
              className="inline-flex h-11 items-center rounded-2xl border border-[var(--color-border)] bg-white/[0.03] px-4 text-xs font-semibold text-white transition hover:bg-white/[0.06]"
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              Buka Booking
            </Link>
            <Link
              href="/customers"
              className="inline-flex h-11 items-center rounded-2xl border border-[var(--color-border)] bg-white/[0.03] px-4 text-xs font-semibold text-white transition hover:bg-white/[0.06]"
            >
              <UserRound className="mr-2 h-4 w-4" />
              Buka Customer
            </Link>
          </div>
        </ContextBlock>

        {conversation.channel === "Instagram Comment" ? (
          <ContextBlock title="Comment Context">
            <div className="flex items-start gap-3 rounded-2xl border border-orange-500/15 bg-orange-500/6 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-200" />
              <p className="text-sm leading-6 text-slate-100">
                Comment reply butuh moderasi ekstra. Pertimbangkan pindah ke DM
                jika percakapan mulai sensitif atau butuh data privat.
              </p>
            </div>
          </ContextBlock>
        ) : null}

        <ContextBlock title="Internal Notes">
          <div className="flex items-start gap-3 rounded-2xl border border-violet-500/15 bg-violet-500/6 p-3">
            <MessageSquareText className="mt-0.5 h-4 w-4 text-violet-200" />
            <p className="text-sm leading-6 text-slate-100">
              {conversation.notes.trim()
                ? conversation.notes
                : "Belum ada catatan internal pada percakapan ini."}
            </p>
          </div>
        </ContextBlock>
      </div>
    </aside>
  );
}


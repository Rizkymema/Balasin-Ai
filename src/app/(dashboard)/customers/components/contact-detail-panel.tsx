"use client";

import {
  CalendarClock,
  FileText,
  MessageSquareText,
  Plus,
  ShieldAlert,
  Ticket,
  Trash2,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

import type { CrmContactDetail } from "./crm-view-model";

type ContactDetailPanelProps = {
  detail: CrmContactDetail | null;
  onSendMessage: () => void;
  onCreateDeal: () => void;
  onAddTask: () => void;
  onDeleteContact: () => void;
};

function scoreTone(score: number) {
  if (score >= 76) {
    return "border-emerald-400/20 bg-emerald-950/30 text-emerald-200";
  }

  if (score >= 51) {
    return "border-orange-400/20 bg-orange-950/30 text-orange-200";
  }

  if (score >= 21) {
    return "border-cyan-400/20 bg-cyan-950/30 text-cyan-200";
  }

  return "border-white/10 bg-white/[0.05] text-slate-300";
}

function renderFallbackValue(value: string) {
  return value.trim().length > 0 ? value : "-";
}

export function ContactDetailPanel({
  detail,
  onSendMessage,
  onCreateDeal,
  onAddTask,
  onDeleteContact,
}: ContactDetailPanelProps) {
  if (!detail) {
    return (
      <Card className="h-full min-h-[480px] border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <EmptyState
          icon={<MessageSquareText className="h-10 w-10" />}
          title="Pilih contact"
          description="Pilih salah satu contact dari tabel untuk melihat profil, timeline aktivitas, dan data terkait CRM."
          className="h-full min-h-[420px]"
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-5 border-slate-200 bg-white p-5 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:p-6">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-[#f8fbff] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-lg font-bold text-cyan-700">
              {detail.customer.name.slice(0, 1)}
            </span>

            <div className="space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{detail.customer.name}</h2>
                  <Badge className="border-slate-200 bg-white text-slate-700">
                    {detail.lifecycle}
                  </Badge>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      scoreTone(detail.leadScore),
                    )}
                  >
                    Score {detail.leadScore}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-600">{detail.summary}</p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  {detail.customer.channel}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  Owner: {detail.customer.assignedTo}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  Segment: {detail.customer.segment || "General"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-[380px] xl:justify-end">
            <Button type="button" className="h-10 rounded-xl px-4" onClick={onSendMessage}>
              <MessageSquareText className="mr-2 h-4 w-4" />
              Send Message
            </Button>
            <Button type="button" variant="secondary" className="h-10 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50">
              <CalendarClock className="mr-2 h-4 w-4" />
              Create Booking
            </Button>
            <Button type="button" variant="secondary" className="h-10 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50">
              <Ticket className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
            <Button type="button" variant="secondary" className="h-10 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50" onClick={onCreateDeal}>
              <WalletCards className="mr-2 h-4 w-4" />
              Create Deal
            </Button>
            <Button type="button" variant="secondary" className="h-10 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50" onClick={onAddTask}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
            <Button
              type="button"
              variant="secondary"
                className="h-10 rounded-xl border-rose-200 bg-rose-50 px-4 text-rose-600 hover:bg-rose-100"
                onClick={onDeleteContact}
              >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Suggested next action: {detail.suggestedNextAction}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Card className="space-y-4 border-slate-200 bg-white p-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Informasi Customer</h3>
                <p className="mt-1 text-xs leading-6 text-slate-500">
                  Identitas utama, preferensi channel, dan data standar contact.
                </p>
              </div>

              <div className="space-y-3 text-sm">
                {detail.primaryIdentityRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="text-slate-500">{row.label}</span>
                    <span className="text-right text-slate-700">
                      {renderFallbackValue(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-4 border-slate-200 bg-white p-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Identity Resolution</h3>
                <p className="mt-1 text-xs leading-6 text-slate-500">
                  Mapping channel agar WhatsApp, Instagram, dan website tetap mengarah ke satu contact.
                </p>
              </div>

              <div className="space-y-3 text-sm">
                {detail.channelIdentityRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="text-slate-500">{row.label}</span>
                    <span className="text-right text-slate-700">
                      {renderFallbackValue(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="space-y-4 border-slate-200 bg-white p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Tags & Context</h3>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                Tag, catatan singkat, dan ringkasan segmentasi yang membantu pencarian serta campaign.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {detail.tags.length > 0 ? (
                detail.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="border-slate-200 bg-slate-50 text-slate-700"
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-500">Belum ada tag.</span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              {detail.customer.note.trim().length > 0
                ? detail.customer.note
                : "Belum ada note tambahan untuk contact ini."}
            </div>
          </Card>

          <Card className="space-y-3 border-slate-200 bg-white p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Consent & Readiness</h3>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                Placeholder awal untuk consent, opt-in, dan readiness CRM lanjutan.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Preferred
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {detail.customer.channel}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Risk
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {detail.customer.leadStatus === "Complaint" ? "High" : "Normal"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Consent
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Manual follow-up</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-4 border-slate-200 bg-white p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Timeline Aktivitas</h3>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                Histori chat, booking, dan ticket yang menyatu ke contact ini.
              </p>
            </div>

            <div className="space-y-3">
              {detail.timeline.length > 0 ? (
                detail.timeline.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-2xl border p-4",
                      item.toneClassName,
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <span className="text-[11px] opacity-80">{item.time}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 opacity-90">{item.detail}</p>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<FileText className="h-8 w-8" />}
                  title="Belum ada timeline"
                  description="Aktivitas chat, booking, dan ticket akan muncul di area ini saat data tersedia."
                  className="min-h-[220px]"
                />
              )}
            </div>
          </Card>

          <Card className="space-y-4 border-slate-200 bg-white p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Related Data</h3>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                Deal, task, booking, dan ticket yang terkait dengan contact ini.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Deals
                </p>
                <div className="mt-3 space-y-2">
                  {detail.relatedDeals.length > 0 ? (
                    detail.relatedDeals.slice(0, 3).map((deal) => (
                      <div key={deal.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-900">{deal.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {deal.valueLabel} · {deal.stage} · {deal.expectedClose}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Belum ada deal terkait.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Tasks
                </p>
                <div className="mt-3 space-y-2">
                  {detail.relatedTasks.length > 0 ? (
                    detail.relatedTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {task.status} · {task.dueLabel} · {task.owner}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Belum ada task terkait.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Bookings
                </p>
                <div className="mt-3 space-y-2">
                  {detail.relatedBookings.length > 0 ? (
                    detail.relatedBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-900">{booking.service}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {booking.date} {booking.slot} · {booking.status}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Belum ada booking terkait.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Tickets
                </p>
                <div className="mt-3 space-y-2">
                  {detail.relatedTickets.length > 0 ? (
                    detail.relatedTickets.slice(0, 3).map((ticket) => (
                      <div key={ticket.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{ticket.issueType}</p>
                          {ticket.status !== "resolved" ? (
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-300" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {ticket.status} · {ticket.priority} · {ticket.assignedTo}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Belum ada ticket terkait.</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </Card>
  );
}

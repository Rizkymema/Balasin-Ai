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
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (score >= 51) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (score >= 21) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
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
      <Card className="h-full min-h-[480px] border-slate-200 bg-white">
        <EmptyState
          icon={<MessageSquareText className="h-10 w-10 text-blue-600" />}
          title="Pilih contact"
          description="Pilih salah satu contact dari tabel untuk melihat profil, timeline aktivitas, dan data terkait CRM."
          className="h-full min-h-[420px]"
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-5 md:p-6 border-slate-200 bg-white shadow-2xs">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/40 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-lg font-bold text-blue-700 shadow-2xs shrink-0">
              {detail.customer.name.slice(0, 1).toUpperCase()}
            </span>

            <div className="space-y-3 min-w-0">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">{detail.customer.name}</h2>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {detail.lifecycle}
                  </Badge>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-2xs",
                      scoreTone(detail.leadScore),
                    )}
                  >
                    Score {detail.leadScore}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-600 font-semibold">{detail.summary}</p>
              </div>

              <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 font-bold">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-2xs">
                  {detail.customer.channel}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-2xs">
                  Owner: {detail.customer.assignedTo}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-2xs">
                  Segment: {detail.customer.segment || "General"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-[380px] xl:justify-end shrink-0">
            <Button type="button" variant="primary" size="sm" className="h-9 px-3.5" onClick={onSendMessage}>
              <MessageSquareText className="mr-1.5 h-3.5 w-3.5" />
              Send Message
            </Button>
            <Button type="button" variant="secondary" size="sm" className="h-9 px-3.5">
              <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
              Create Booking
            </Button>
            <Button type="button" variant="secondary" size="sm" className="h-9 px-3.5">
              <Ticket className="mr-1.5 h-3.5 w-3.5" />
              Create Ticket
            </Button>
            <Button type="button" variant="secondary" size="sm" className="h-9 px-3.5" onClick={onCreateDeal}>
              <WalletCards className="mr-1.5 h-3.5 w-3.5" />
              Create Deal
            </Button>
            <Button type="button" variant="secondary" size="sm" className="h-9 px-3.5" onClick={onAddTask}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Task
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-9 px-3.5"
              onClick={onDeleteContact}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 font-bold shadow-2xs">
          Suggested next action: <span className="font-semibold text-slate-800">{detail.suggestedNextAction}</span>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Card className="space-y-4 p-5 border-slate-200 bg-white shadow-2xs">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Informasi Customer</h3>
                <p className="text-[11px] leading-normal text-slate-500 font-medium mt-0.5">
                  Identitas utama, preferensi channel, dan data standar contact.
                </p>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                {detail.primaryIdentityRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <span className="text-slate-400">{row.label}</span>
                    <span className="text-right text-slate-800 font-bold">
                      {renderFallbackValue(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-4 p-5 border-slate-200 bg-white shadow-2xs">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Identity Resolution</h3>
                <p className="text-[11px] leading-normal text-slate-500 font-medium mt-0.5">
                  Mapping channel agar WhatsApp, Instagram, dan website tetap mengarah ke satu contact.
                </p>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                {detail.channelIdentityRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <span className="text-slate-400">{row.label}</span>
                    <span className="text-right text-slate-800 font-bold">
                      {renderFallbackValue(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="space-y-4 p-5 border-slate-200 bg-white shadow-2xs">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tags & Context</h3>
              <p className="text-[11px] leading-normal text-slate-500 font-medium mt-0.5">
                Tag, catatan singkat, dan ringkasan segmentasi yang membantu pencarian serta campaign.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {detail.tags.length > 0 ? (
                detail.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] font-bold"
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 font-bold">Belum ada tag.</span>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs leading-relaxed text-slate-600 font-medium">
              {detail.customer.note.trim().length > 0
                ? detail.customer.note
                : "Belum ada note tambahan untuk contact ini."}
            </div>
          </Card>

          <Card className="space-y-3 p-5 border-slate-200 bg-white shadow-2xs">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Consent & Readiness</h3>
              <p className="text-[11px] leading-normal text-slate-500 font-medium mt-0.5">
                Persetujuan (consent), opt-in, dan kesiapan CRM lanjutan.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-1">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Preferred
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {detail.customer.channel}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-1">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Risk
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {detail.customer.leadStatus === "Complaint" ? "High" : "Normal"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-1">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Consent
                </p>
                <p className="text-xs font-bold text-slate-800">Manual follow-up</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-4 p-5 border-slate-200 bg-white shadow-2xs">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Timeline Aktivitas</h3>
              <p className="text-[11px] leading-normal text-slate-500 font-medium mt-0.5">
                Histori chat, booking, dan ticket yang menyatu ke contact ini.
              </p>
            </div>

            <div className="space-y-3">
              {detail.timeline.length > 0 ? (
                detail.timeline.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-2xl border p-4.5 shadow-2xs space-y-2",
                      item.toneClassName,
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2">
                      <p className="text-xs font-bold leading-tight">{item.title}</p>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{item.time}</span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90 font-medium">{item.detail}</p>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<FileText className="h-8 w-8 text-slate-400" />}
                  title="Belum ada timeline"
                  description="Aktivitas chat, booking, dan ticket akan muncul di area ini saat data tersedia."
                  className="min-h-[220px]"
                />
              )}
            </div>
          </Card>

          <Card className="space-y-4 p-5 border-slate-200 bg-white shadow-2xs">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Related Data</h3>
              <p className="text-[11px] leading-normal text-slate-500 font-medium mt-0.5">
                Deal, task, booking, dan ticket yang terkait dengan contact ini.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/60 pb-1">
                  Deals
                </p>
                <div className="space-y-2">
                  {detail.relatedDeals.length > 0 ? (
                    detail.relatedDeals.slice(0, 3).map((deal) => (
                      <div key={deal.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-1 shadow-2xs">
                        <p className="text-xs font-bold text-slate-900 leading-snug">{deal.title}</p>
                        <p className="text-[10px] text-slate-500 font-bold leading-normal">
                          {deal.valueLabel} • {deal.stage} • {deal.expectedClose}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 font-bold">Belum ada deal terkait.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/60 pb-1">
                  Tasks
                </p>
                <div className="space-y-2">
                  {detail.relatedTasks.length > 0 ? (
                    detail.relatedTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-1 shadow-2xs">
                        <p className="text-xs font-bold text-slate-900 leading-snug">{task.title}</p>
                        <p className="text-[10px] text-slate-500 font-bold leading-normal">
                          {task.status} • {task.dueLabel} • {task.owner}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 font-bold">Belum ada task terkait.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/60 pb-1">
                  Bookings
                </p>
                <div className="space-y-2">
                  {detail.relatedBookings.length > 0 ? (
                    detail.relatedBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-1 shadow-2xs">
                        <p className="text-xs font-bold text-slate-900 leading-snug">{booking.service}</p>
                        <p className="text-[10px] text-slate-500 font-bold leading-normal">
                          {booking.date} {booking.slot} • {booking.status}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 font-bold">Belum ada booking terkait.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/60 pb-1">
                  Tickets
                </p>
                <div className="space-y-2">
                  {detail.relatedTickets.length > 0 ? (
                    detail.relatedTickets.slice(0, 3).map((ticket) => (
                      <div key={ticket.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 justify-between">
                          <p className="text-xs font-bold text-slate-900 leading-snug">{ticket.issueType}</p>
                          {ticket.status !== "resolved" ? (
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          ) : null}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold leading-normal border-t border-slate-100 pt-1 mt-1">
                          {ticket.status} • {ticket.priority} • {ticket.assignedTo}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 font-bold">Belum ada ticket terkait.</p>
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

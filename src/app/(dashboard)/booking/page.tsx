"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  BellRing,
  CalendarCheck2,
  CalendarClock,
  Clock3,
  MapPin,
  NotebookPen,
  Plus,
  Trash2,
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import {
  createOperatorTimestamp,
  createRecordId,
  deriveLeadStatusFromBookingStatus,
  normalizeLookupKey,
} from "@/lib/dashboard-records";
import { buildBookingTimeline } from "@/lib/dashboard-operations";
import type { BookingRecord, BookingStatus, ChannelKind, CustomerRecord } from "@/types/operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusClasses: Record<BookingStatus, string> = {
  Confirmed: "text-emerald-300 border-emerald-400/20 bg-emerald-950/30",
  "Waiting Payment": "text-amber-300 border-amber-400/20 bg-amber-950/30",
  New: "text-cyan-300 border-cyan-400/20 bg-cyan-950/30",
  "Pending Confirmation": "text-sky-300 border-sky-400/20 bg-sky-950/30",
  Done: "text-slate-200 border-white/10 bg-white/5",
  Rescheduled: "text-violet-300 border-violet-400/20 bg-violet-950/30",
  Cancelled: "text-rose-300 border-rose-400/20 bg-rose-950/30",
};

type BookingDraft = {
  customer: string;
  service: string;
  date: string;
  slot: string;
  channel: ChannelKind;
  status: BookingStatus;
  technician: string;
  branch: string;
  note: string;
};

const initialDraft: BookingDraft = {
  customer: "",
  service: "",
  date: "",
  slot: "",
  channel: "WhatsApp",
  status: "New",
  technician: "Booking Desk",
  branch: "Workshop Pusat",
  note: "",
};

export default function BookingPage() {
  const { config } = useDashboardConfig();
  const { data, patchData } = useDashboardOperations();
  const [selectedId, setSelectedId] = useState<string>(data.bookings[0]?.id ?? "");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draft, setDraft] = useState<BookingDraft>(initialDraft);

  const selectedBooking =
    data.bookings.find((booking) => booking.id === selectedId) ?? data.bookings[0];

  const bookingStats = useMemo(
    () => [
      {
        label: "Booking aktif",
        value: `${data.bookings.length}`,
        note: "Semua booking lintas channel yang sudah masuk ke desk operasional.",
      },
      {
        label: "Menunggu pembayaran",
        value: `${data.bookings.filter((booking) => booking.status === "Waiting Payment").length}`,
        note: "Sinkron dengan reminder dan follow-up automation.",
      },
      {
        label: "Reminder default",
        value: `${config.automation.bookingReminderHours} jam`,
        note: "Diambil dari control center automation dashboard.",
      },
      {
        label: "Booking confirmed",
        value: `${data.bookings.filter((booking) => booking.status === "Confirmed").length}`,
        note: "Siap diteruskan ke operasi lapangan atau service desk.",
      },
    ],
    [config.automation.bookingReminderHours, data.bookings],
  );

  const timelineItems = useMemo(() => buildBookingTimeline(data.bookings), [data.bookings]);

  const updateBooking = (updates: Partial<BookingRecord>) => {
    if (!selectedBooking) {
      return;
    }

    patchData((current) => ({
      ...current,
      bookings: current.bookings.map((booking) =>
        booking.id === selectedBooking.id ? { ...booking, ...updates } : booking,
      ),
      customers: current.customers.map((customer) =>
        customer.id === selectedBooking.customerId
          ? {
              ...customer,
              name: updates.customer ?? customer.name,
              channel: updates.channel ?? customer.channel,
              leadStatus: updates.status
                ? deriveLeadStatusFromBookingStatus(updates.status)
                : customer.leadStatus,
              note: updates.note ?? customer.note,
              assignedTo: updates.technician ?? customer.assignedTo,
              lastContact: createOperatorTimestamp(),
            }
          : customer,
      ),
    }));
  };

  const handleCreateBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.customer.trim() || !draft.service.trim()) {
      return;
    }

    const timestamp = createOperatorTimestamp();

    patchData((current) => {
      const existingCustomer = current.customers.find(
        (customer) => normalizeLookupKey(customer.name) === normalizeLookupKey(draft.customer),
      );

      const customerId = existingCustomer?.id ?? createRecordId("cust");
      const nextBooking: BookingRecord = {
        id: createRecordId("booking"),
        customerId,
        customer: draft.customer.trim(),
        service: draft.service.trim(),
        date: draft.date.trim() || timestamp,
        slot: draft.slot.trim() || "-",
        channel: draft.channel,
        status: draft.status,
        technician: draft.technician.trim() || "Booking Desk",
        branch: draft.branch.trim() || "Workshop Pusat",
        note: draft.note.trim(),
      };

      const nextCustomers = existingCustomer
        ? current.customers.map((customer) =>
            customer.id === existingCustomer.id
              ? {
                  ...customer,
                  name: draft.customer.trim(),
                  channel: draft.channel,
                  leadStatus: deriveLeadStatusFromBookingStatus(draft.status),
                  note: draft.note.trim() || customer.note,
                  assignedTo: draft.technician.trim() || customer.assignedTo,
                  lastContact: timestamp,
                }
              : customer,
          )
        : [
            {
              id: customerId,
              name: draft.customer.trim(),
              channel: draft.channel,
              leadStatus: deriveLeadStatusFromBookingStatus(draft.status),
              tags: ["Booking", "Manual entry"],
              lastContact: timestamp,
              assignedTo: draft.technician.trim() || "Booking Desk",
              totalConversation: 0,
              revenueHint: "Booking pipeline",
              note: draft.note.trim(),
              phone: "",
              email: "",
              username: "",
              segment: "Booking lead",
              activeTicketCount: 0,
            } satisfies CustomerRecord,
            ...current.customers,
          ];

      setSelectedId(nextBooking.id);

      return {
        ...current,
        bookings: [nextBooking, ...current.bookings],
        customers: nextCustomers,
      };
    });

    setDraft(initialDraft);
    setIsCreateOpen(false);
  };

  const handleDeleteBooking = () => {
    if (!selectedBooking) {
      return;
    }

    const nextSelectedId = data.bookings.find((booking) => booking.id !== selectedBooking.id)?.id ?? "";

    patchData((current) => ({
      ...current,
      bookings: current.bookings.filter((booking) => booking.id !== selectedBooking.id),
    }));

    setSelectedId(nextSelectedId);
  };

  if (!selectedBooking) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/8 bg-gradient-to-r from-white/[0.04] to-transparent p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge>Booking Desk</Badge>
            <h1 className="text-3xl font-bold text-white">
              Booking sekarang sudah menjadi data operasional yang siap dibaca automation.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-300">
              Slot, status, reminder, dan catatan booking kini tersimpan dalam store yang sama
              dengan inbox dan customer. Admin juga bisa membuat booking baru langsung dari dashboard.
            </p>
          </div>
          <Button type="button" variant="secondary" className="rounded-xl px-4" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah booking
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {bookingStats.map((stat) => (
          <Card key={stat.label} className="glass-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
            <p className="mt-4 text-xs leading-6 text-slate-400">{stat.note}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Upcoming bookings</h2>
              <p className="text-xs text-slate-400">
                Booking dari semua channel yang sudah diubah menjadi agenda operasional.
              </p>
            </div>
            <Badge className="border-white/10 bg-white/5 text-slate-300">
              {data.bookings.length} items
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bookings.map((booking) => (
                <TableRow
                  key={booking.id}
                  className={booking.id === selectedBooking.id ? "bg-white/[0.04]" : undefined}
                >
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedId(booking.id)}
                      className="text-left text-white"
                    >
                      {booking.customer}
                    </button>
                  </TableCell>
                  <TableCell>{booking.service}</TableCell>
                  <TableCell>{booking.date}</TableCell>
                  <TableCell>{booking.slot}</TableCell>
                  <TableCell>{booking.channel}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClasses[booking.status]}`}
                    >
                      {booking.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="glass-panel p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-3 text-cyan-300">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Daily timeline</h2>
              <p className="text-xs text-slate-400">
                Ringkasan cepat untuk operator yang mengecek slot hari ini.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {timelineItems.map((item) => (
              <div key={item.id} className={`rounded-2xl border p-4 ${item.tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-xs leading-6 text-slate-300">{item.meta}</p>
                  </div>
                  <span className="text-xs font-bold">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="glass-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CalendarCheck2 className="h-5 w-5 text-emerald-300" />
              <h3 className="text-base font-semibold text-white">Booking detail</h3>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl border-rose-500/20 bg-rose-950/20 px-4 text-rose-200 hover:border-rose-400/30 hover:bg-rose-950/30"
              onClick={handleDeleteBooking}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nama customer</label>
                <Input
                  value={selectedBooking.customer}
                  onChange={(event) => updateBooking({ customer: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nama layanan</label>
                <Input
                  value={selectedBooking.service}
                  onChange={(event) => updateBooking({ service: event.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tanggal</label>
                <Input
                  value={selectedBooking.date}
                  onChange={(event) => updateBooking({ date: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Slot</label>
                <Input
                  value={selectedBooking.slot}
                  onChange={(event) => updateBooking({ slot: event.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Channel</label>
              <Select
                value={selectedBooking.channel}
                onChange={(event) =>
                  updateBooking({ channel: event.target.value as ChannelKind })
                }
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Website Chat">Website Chat</option>
                <option value="Instagram DM">Instagram DM</option>
                <option value="Instagram Comment">Instagram Comment</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Status Booking</label>
              <Select
                value={selectedBooking.status}
                onChange={(event) =>
                  updateBooking({ status: event.target.value as BookingStatus })
                }
              >
                <option value="New">New</option>
                <option value="Pending Confirmation">Pending Confirmation</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Waiting Payment">Waiting Payment</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Done">Done</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Teknisi / PIC</label>
                <Input
                  value={selectedBooking.technician ?? ""}
                  onChange={(event) => updateBooking({ technician: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Cabang / Lokasi</label>
                <Input
                  value={selectedBooking.branch ?? ""}
                  onChange={(event) => updateBooking({ branch: event.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Catatan Booking</label>
              <Textarea
                value={selectedBooking.note ?? ""}
                onChange={(event) => updateBooking({ note: event.target.value })}
                rows={4}
              />
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-panel p-5">
            <div className="flex items-center gap-3">
              <BellRing className="h-5 w-5 text-amber-300" />
              <h3 className="text-base font-semibold text-white">Reminder engine</h3>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Reminder H-1 hari, H-{config.automation.bookingReminderHours} jam, dan konfirmasi pembayaran
              sekarang mengikuti pengaturan automation global dari dashboard.
            </p>
          </Card>

          <Card className="glass-panel p-5">
            <div className="flex items-center gap-3">
              <NotebookPen className="h-5 w-5 text-cyan-300" />
              <h3 className="text-base font-semibold text-white">Operational notes</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-slate-500" />
                Slot dan durasi layanan kini tersimpan sebagai contract data bersama.
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                Lokasi dan PIC bisa dipakai backend automation untuk reminder dan dispatch.
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setDraft(initialDraft);
        }}
        title="Tambah Booking"
        className="max-w-2xl"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={draft.customer}
              onChange={(event) => setDraft((current) => ({ ...current, customer: event.target.value }))}
              placeholder="Nama customer"
              required
            />
            <Input
              value={draft.service}
              onChange={(event) => setDraft((current) => ({ ...current, service: event.target.value }))}
              placeholder="Layanan / paket"
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={draft.date}
              onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
              placeholder="Sabtu, 21 Juni"
            />
            <Input
              value={draft.slot}
              onChange={(event) => setDraft((current) => ({ ...current, slot: event.target.value }))}
              placeholder="10:30"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              value={draft.channel}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  channel: event.target.value as ChannelKind,
                }))
              }
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="Website Chat">Website Chat</option>
              <option value="Instagram DM">Instagram DM</option>
              <option value="Instagram Comment">Instagram Comment</option>
            </Select>
            <Select
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  status: event.target.value as BookingStatus,
                }))
              }
            >
              <option value="New">New</option>
              <option value="Pending Confirmation">Pending Confirmation</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Waiting Payment">Waiting Payment</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="Done">Done</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={draft.technician}
              onChange={(event) => setDraft((current) => ({ ...current, technician: event.target.value }))}
              placeholder="PIC / Teknisi"
            />
            <Input
              value={draft.branch}
              onChange={(event) => setDraft((current) => ({ ...current, branch: event.target.value }))}
              placeholder="Cabang"
            />
          </div>
          <Textarea
            rows={4}
            value={draft.note}
            onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
            placeholder="Catatan booking"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan booking</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

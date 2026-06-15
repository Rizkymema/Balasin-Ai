"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CircleDollarSign,
  Filter,
  Phone,
  Plus,
  Search,
  Tags,
  Trash2,
  UserRound,
  Users2,
} from "lucide-react";

import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import { createOperatorTimestamp, createRecordId } from "@/lib/dashboard-records";
import type { ChannelKind, CustomerRecord, LeadStatus } from "@/types/operations";
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

const leadStatusClasses: Record<LeadStatus, string> = {
  "New Lead": "text-cyan-300 border-cyan-400/20 bg-cyan-950/30",
  Interested: "text-emerald-300 border-emerald-400/20 bg-emerald-950/30",
  "Hot Lead": "text-orange-300 border-orange-400/20 bg-orange-950/30",
  "Asked Price": "text-amber-300 border-amber-400/20 bg-amber-950/30",
  Booking: "text-violet-300 border-violet-400/20 bg-violet-950/30",
  Paid: "text-sky-300 border-sky-400/20 bg-sky-950/30",
  Complaint: "text-rose-300 border-rose-400/20 bg-rose-950/30",
  Spam: "text-slate-300 border-white/10 bg-white/5",
};

type CustomerDraft = {
  name: string;
  channel: ChannelKind;
  leadStatus: LeadStatus;
  assignedTo: string;
  revenueHint: string;
  segment: string;
  phone: string;
  email: string;
  username: string;
  tags: string;
  note: string;
};

const initialDraft: CustomerDraft = {
  name: "",
  channel: "WhatsApp",
  leadStatus: "New Lead",
  assignedTo: "AI Agent",
  revenueHint: "Rp0",
  segment: "General",
  phone: "",
  email: "",
  username: "",
  tags: "Lead baru, Manual entry",
  note: "",
};

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function CustomersPage() {
  const { data, patchData } = useDashboardOperations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string>(data.customers[0]?.id ?? "");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draft, setDraft] = useState<CustomerDraft>(initialDraft);

  const filteredCustomers = useMemo(() => {
    return data.customers.filter((customer) => {
      const searchable = [
        customer.name,
        customer.tags.join(" "),
        customer.phone ?? "",
        customer.email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = searchable.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : customer.leadStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data.customers, search, statusFilter]);

  const selectedCustomer =
    filteredCustomers.find((customer) => customer.id === selectedId) ??
    filteredCustomers[0] ??
    data.customers[0];

  const customerStats = useMemo(
    () => [
      {
        label: "Total customer aktif",
        value: `${data.customers.length}`,
        icon: Users2,
        tone: "text-cyan-300",
      },
      {
        label: "Lead panas",
        value: `${data.customers.filter((customer) => customer.leadStatus === "Interested" || customer.leadStatus === "Hot Lead").length}`,
        icon: CircleDollarSign,
        tone: "text-emerald-300",
      },
      {
        label: "Butuh follow-up",
        value: `${data.customers.filter((customer) => customer.leadStatus === "Asked Price" || customer.leadStatus === "Booking").length}`,
        icon: Phone,
        tone: "text-amber-300",
      },
      {
        label: "Tag unik",
        value: `${new Set(data.customers.flatMap((customer) => customer.tags)).size}`,
        icon: Tags,
        tone: "text-fuchsia-300",
      },
    ],
    [data.customers],
  );

  const updateSelectedCustomer = (updates: Partial<CustomerRecord>) => {
    if (!selectedCustomer) {
      return;
    }

    patchData((current) => ({
      ...current,
      customers: current.customers.map((customer) =>
        customer.id === selectedCustomer.id ? { ...customer, ...updates } : customer,
      ),
      conversations: current.conversations.map((conversation) =>
        conversation.customerId === selectedCustomer.id
          ? {
              ...conversation,
              name: updates.name ?? conversation.name,
              channel: updates.channel ?? conversation.channel,
              phone: updates.phone ?? conversation.phone,
              email: updates.email ?? conversation.email,
              username: updates.username ?? conversation.username,
              assignedTo: updates.assignedTo ?? conversation.assignedTo,
              notes: updates.note ?? conversation.notes,
              tags: updates.tags ?? conversation.tags,
            }
          : conversation,
      ),
    }));
  };

  const handleCreateCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.name.trim()) {
      return;
    }

    const nextCustomer: CustomerRecord = {
      id: createRecordId("cust"),
      name: draft.name.trim(),
      channel: draft.channel,
      leadStatus: draft.leadStatus,
      tags: parseTags(draft.tags),
      lastContact: createOperatorTimestamp(),
      assignedTo: draft.assignedTo.trim() || "AI Agent",
      totalConversation: 0,
      revenueHint: draft.revenueHint.trim() || "Rp0",
      note: draft.note.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      username: draft.username.trim(),
      segment: draft.segment.trim() || "General",
      activeTicketCount: 0,
    };

    patchData((current) => ({
      ...current,
      customers: [nextCustomer, ...current.customers],
    }));

    setSelectedId(nextCustomer.id);
    setSearch("");
    setStatusFilter("all");
    setDraft(initialDraft);
    setIsCreateOpen(false);
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) {
      return;
    }

    const nextSelectedId =
      data.customers.find((customer) => customer.id !== selectedCustomer.id)?.id ?? "";

    patchData((current) => ({
      ...current,
      customers: current.customers.filter((customer) => customer.id !== selectedCustomer.id),
      conversations: current.conversations.filter(
        (conversation) => conversation.customerId !== selectedCustomer.id,
      ),
      bookings: current.bookings.filter((booking) => booking.customerId !== selectedCustomer.id),
      tickets: current.tickets.filter((ticket) => ticket.customerId !== selectedCustomer.id),
    }));

    setSelectedId(nextSelectedId);
  };

  if (!selectedCustomer) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-r from-white/[0.04] to-transparent p-6 md:p-8">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-cyan-400/6 blur-3xl" />
        <div className="relative z-10 space-y-3">
          <Badge>Customer CRM</Badge>
          <h1 className="text-3xl font-bold text-white">
            Customer registry sekarang sudah siap menjadi basis follow-up dan automation.
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Data lead status, tag, catatan, channel, dan kontak customer sudah tersentral
            sehingga admin bisa menambah, mengubah, atau membersihkan data langsung dari dashboard.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {customerStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="glass-panel p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`rounded-2xl border border-white/8 bg-white/5 p-3 ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="glass-panel p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Customer registry</h2>
              <p className="text-xs text-slate-400">
                Fokus pada lead yang paling dekat ke booking, pembayaran, atau eskalasi.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Cari nama, kontak, atau tag..."
                />
              </div>
              <div className="min-w-[180px]">
                <Select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as LeadStatus | "all")
                  }
                >
                  <option value="all">Semua status</option>
                  <option value="New Lead">New Lead</option>
                  <option value="Interested">Interested</option>
                  <option value="Hot Lead">Hot Lead</option>
                  <option value="Asked Price">Asked Price</option>
                  <option value="Booking">Booking</option>
                  <option value="Paid">Paid</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Spam">Spam</option>
                </Select>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-11 rounded-xl px-4"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah customer
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Last contact</TableHead>
                <TableHead>Revenue hint</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className={
                    customer.id === selectedCustomer.id ? "bg-white/[0.04]" : undefined
                  }
                >
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedId(customer.id)}
                      className="flex items-center gap-3 text-left"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-950/30 text-sm font-bold text-cyan-300">
                        {customer.name.slice(0, 1)}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-white">
                          {customer.name}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {customer.totalConversation} percakapan
                        </span>
                      </span>
                    </button>
                  </TableCell>
                  <TableCell>{customer.channel}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${leadStatusClasses[customer.leadStatus]}`}
                    >
                      {customer.leadStatus}
                    </span>
                  </TableCell>
                  <TableCell>{customer.assignedTo}</TableCell>
                  <TableCell>{customer.lastContact}</TableCell>
                  <TableCell>{customer.revenueHint}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3 text-cyan-300">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Customer detail</h2>
                <p className="text-xs text-slate-400">
                  Edit data customer tanpa keluar dari dashboard.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="rounded-xl border-rose-500/20 bg-rose-950/20 px-4 text-rose-200 hover:border-rose-400/30 hover:bg-rose-950/30"
              onClick={handleDeleteCustomer}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-white/8 bg-[#020611]/60 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-950/30 text-lg font-bold text-cyan-300">
                  {selectedCustomer.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedCustomer.channel} • assigned to {selectedCustomer.assignedTo}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Lead status
                </p>
                <div className="mt-3">
                  <Select
                    value={selectedCustomer.leadStatus}
                    onChange={(event) =>
                      updateSelectedCustomer({
                        leadStatus: event.target.value as LeadStatus,
                      })
                    }
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Interested">Interested</option>
                    <option value="Hot Lead">Hot Lead</option>
                    <option value="Asked Price">Asked Price</option>
                    <option value="Booking">Booking</option>
                    <option value="Paid">Paid</option>
                    <option value="Complaint">Complaint</option>
                    <option value="Spam">Spam</option>
                  </Select>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Revenue hint
                </p>
                <Input
                  className="mt-3"
                  value={selectedCustomer.revenueHint}
                  onChange={(event) =>
                    updateSelectedCustomer({ revenueHint: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Nama customer
                </p>
                <Input
                  className="mt-3"
                  value={selectedCustomer.name}
                  onChange={(event) => updateSelectedCustomer({ name: event.target.value })}
                />
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Assigned to
                </p>
                <Input
                  className="mt-3"
                  value={selectedCustomer.assignedTo}
                  onChange={(event) =>
                    updateSelectedCustomer({ assignedTo: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Segment
                </p>
                <Input
                  className="mt-3"
                  value={selectedCustomer.segment}
                  onChange={(event) =>
                    updateSelectedCustomer({ segment: event.target.value })
                  }
                />
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Active tickets
                </p>
                <p className="mt-3 text-2xl font-bold text-white">
                  {selectedCustomer.activeTicketCount}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Telepon
                </p>
                <Input
                  className="mt-3"
                  value={selectedCustomer.phone ?? ""}
                  onChange={(event) => updateSelectedCustomer({ phone: event.target.value })}
                />
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Email
                </p>
                <Input
                  className="mt-3"
                  value={selectedCustomer.email ?? ""}
                  onChange={(event) => updateSelectedCustomer({ email: event.target.value })}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                Username / handle
              </p>
              <Input
                className="mt-3"
                value={selectedCustomer.username ?? ""}
                onChange={(event) => updateSelectedCustomer({ username: event.target.value })}
              />
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                Active tags
              </p>
              <Input
                className="mt-3"
                value={selectedCustomer.tags.join(", ")}
                onChange={(event) =>
                  updateSelectedCustomer({ tags: parseTags(event.target.value) })
                }
                placeholder="VIP, Follow-up, Sparepart"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedCustomer.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="border-white/10 bg-white/5 text-slate-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                Internal note
              </p>
              <Textarea
                className="mt-3 min-h-[120px]"
                value={selectedCustomer.note}
                onChange={(event) => updateSelectedCustomer({ note: event.target.value })}
              />
            </div>

            <div className="rounded-2xl border border-amber-400/15 bg-amber-950/15 p-4">
              <div className="flex items-start gap-3">
                <Filter className="mt-0.5 h-4 w-4 text-amber-300" />
                <p className="text-sm leading-6 text-slate-300">
                  Perubahan customer di panel ini langsung ikut memperbarui data inbox yang
                  terhubung, jadi operator tidak perlu mengedit di dua tempat.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setDraft(initialDraft);
        }}
        title="Tambah Customer"
        className="max-w-2xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nama customer</label>
              <Input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nama customer"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Channel utama</label>
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
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Lead status</label>
              <Select
                value={draft.leadStatus}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    leadStatus: event.target.value as LeadStatus,
                  }))
                }
              >
                <option value="New Lead">New Lead</option>
                <option value="Interested">Interested</option>
                <option value="Hot Lead">Hot Lead</option>
                <option value="Asked Price">Asked Price</option>
                <option value="Booking">Booking</option>
                <option value="Paid">Paid</option>
                <option value="Complaint">Complaint</option>
                <option value="Spam">Spam</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Assigned to</label>
              <Input
                value={draft.assignedTo}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, assignedTo: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={draft.phone}
              onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
              placeholder="Nomor telepon"
            />
            <Input
              value={draft.email}
              onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={draft.username}
              onChange={(event) =>
                setDraft((current) => ({ ...current, username: event.target.value }))
              }
              placeholder="Username / handle"
            />
            <Input
              value={draft.segment}
              onChange={(event) => setDraft((current) => ({ ...current, segment: event.target.value }))}
              placeholder="Segment"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={draft.revenueHint}
              onChange={(event) =>
                setDraft((current) => ({ ...current, revenueHint: event.target.value }))
              }
              placeholder="Revenue hint"
            />
            <Input
              value={draft.tags}
              onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
              placeholder="Tag dipisah koma"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Catatan internal</label>
            <Textarea
              rows={4}
              value={draft.note}
              onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan customer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

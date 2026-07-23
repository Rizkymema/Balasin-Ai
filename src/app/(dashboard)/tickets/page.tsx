"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  ShieldAlert,
  Ticket,
  Trash2,
  UserRound,
} from "lucide-react";

import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import {
  createOperatorTimestamp,
  createRecordId,
  deriveConversationStatusFromTicketStatus,
  normalizeLookupKey,
} from "@/lib/dashboard-records";
import type {
  ChannelKind,
  ConversationRecord,
  CustomerRecord,
  TicketPriority,
  TicketRecord,
  TicketStatus,
} from "@/types/operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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

const priorityClasses: Record<TicketPriority, string> = {
  low: "border-sky-200 bg-sky-50 text-sky-700",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-rose-200 bg-rose-50 text-rose-700",
};

type TicketDraft = {
  customerName: string;
  channel: ChannelKind;
  issueType: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string;
  summary: string;
  resolutionNote: string;
};

const initialDraft: TicketDraft = {
  customerName: "",
  channel: "WhatsApp",
  issueType: "Handoff manual",
  priority: "medium",
  status: "open",
  assignedTo: "Admin Desk",
  summary: "",
  resolutionNote: "",
};

export default function TicketsPage() {
  const { data, patchData } = useDashboardOperations();
  const [selectedId, setSelectedId] = useState<string>(data.tickets[0]?.id ?? "");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draft, setDraft] = useState<TicketDraft>(initialDraft);

  const selectedTicket =
    data.tickets.find((ticket) => ticket.id === selectedId) ?? data.tickets[0];

  const stats = useMemo(
    () => [
      {
        label: "Open",
        value: `${data.tickets.filter((ticket) => ticket.status === "open").length}`,
      },
      {
        label: "In progress",
        value: `${data.tickets.filter((ticket) => ticket.status === "in_progress").length}`,
      },
      {
        label: "Complaint",
        value: `${data.tickets.filter((ticket) => ticket.status === "complaint").length}`,
      },
      {
        label: "Resolved",
        value: `${data.tickets.filter((ticket) => ticket.status === "resolved").length}`,
      },
    ],
    [data.tickets],
  );

  const updateTicket = (updates: Partial<TicketRecord>) => {
    if (!selectedTicket) {
      return;
    }

    patchData((current) => {
      const nextTickets = current.tickets.map((ticket) =>
        ticket.id === selectedTicket.id
          ? { ...ticket, ...updates, updatedAt: createOperatorTimestamp() }
          : ticket,
      );

      const nextTicket = nextTickets.find((ticket) => ticket.id === selectedTicket.id);
      if (!nextTicket) {
        return current;
      }

      const nextConversations = current.conversations.map((conversation) =>
        conversation.id === nextTicket.conversationId
          ? {
              ...conversation,
              name: updates.customerName ?? conversation.name,
              channel: updates.channel ?? conversation.channel,
              status: updates.status
                ? deriveConversationStatusFromTicketStatus(updates.status)
                : conversation.status,
              assignedTo: updates.assignedTo ?? conversation.assignedTo,
              ticketId: nextTicket.id,
              summary: updates.summary ?? conversation.summary,
              notes: updates.resolutionNote ?? conversation.notes,
            }
          : conversation,
      );

      return {
        ...current,
        tickets: nextTickets,
        conversations: nextConversations,
        customers: current.customers.map((customer) =>
          customer.id === nextTicket.customerId
            ? {
                ...customer,
                name: updates.customerName ?? customer.name,
                channel: updates.channel ?? customer.channel,
                assignedTo: updates.assignedTo ?? customer.assignedTo,
                note: updates.summary ?? customer.note,
                activeTicketCount: nextTickets.filter(
                  (ticket) =>
                    ticket.customerId === customer.id && ticket.status !== "resolved",
                ).length,
              }
            : {
                ...customer,
                activeTicketCount: nextTickets.filter(
                  (ticket) =>
                    ticket.customerId === customer.id && ticket.status !== "resolved",
                ).length,
              },
        ),
      };
    });
  };

  const handleCreateTicket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.customerName.trim() || !draft.summary.trim()) {
      return;
    }

    const timestamp = createOperatorTimestamp();

    patchData((current) => {
      const existingCustomer = current.customers.find(
        (customer) =>
          normalizeLookupKey(customer.name) === normalizeLookupKey(draft.customerName),
      );

      const customerId = existingCustomer?.id ?? createRecordId("cust");
      const existingConversation = current.conversations.find(
        (conversation) => conversation.customerId === customerId,
      );

      const conversationId = existingConversation?.id ?? createRecordId("conv");
      const nextTicketId = createRecordId("ticket");

      const nextConversation: ConversationRecord =
        existingConversation ?? {
          id: conversationId,
          customerId,
          name: draft.customerName.trim(),
          channel: draft.channel,
          lastMessage: draft.summary.trim(),
          timestamp,
          unreadCount: 0,
          status: deriveConversationStatusFromTicketStatus(draft.status),
          messages: [
            {
              id: createRecordId("msg"),
              sender: "system",
              text: `Ticket dibuat dari dashboard: ${draft.summary.trim()}`,
              timestamp,
              type: "system",
            },
          ],
          tags: ["Ticket", "Manual handoff"],
          notes: draft.resolutionNote.trim(),
          summary: draft.summary.trim(),
          lastSeenAt: null,
          typingActor: null,
          assignedTo: draft.assignedTo.trim() || "Admin Desk",
          responseTimeSeconds: 0,
          lastIntent: draft.issueType.trim(),
          sentiment: "neutral",
          aiConfidence: 0,
          riskLevel: draft.priority === "critical" || draft.priority === "high" ? "high" : "medium",
          ticketId: nextTicketId,
        };

      const nextTicket: TicketRecord = {
        id: nextTicketId,
        conversationId,
        customerId,
        customerName: draft.customerName.trim(),
        channel: draft.channel,
        issueType: draft.issueType.trim() || "Handoff manual",
        priority: draft.priority,
        status: draft.status,
        assignedTo: draft.assignedTo.trim() || "Admin Desk",
        summary: draft.summary.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
        resolutionNote: draft.resolutionNote.trim(),
      };

      const nextCustomers = existingCustomer
        ? current.customers.map((customer) =>
            customer.id === existingCustomer.id
              ? {
                  ...customer,
                  name: draft.customerName.trim(),
                  channel: draft.channel,
                  assignedTo: draft.assignedTo.trim() || customer.assignedTo,
                  note: draft.summary.trim(),
                  activeTicketCount: current.tickets.filter(
                    (ticket) =>
                      ticket.customerId === existingCustomer.id && ticket.status !== "resolved",
                  ).length + (draft.status === "resolved" ? 0 : 1),
                }
              : customer,
          )
        : [
            {
              id: customerId,
              name: draft.customerName.trim(),
              channel: draft.channel,
              leadStatus: "Complaint",
              tags: ["Ticket", "Manual handoff"],
              lastContact: timestamp,
              assignedTo: draft.assignedTo.trim() || "Admin Desk",
              totalConversation: existingConversation ? 1 : 0,
              revenueHint: "At risk",
              note: draft.summary.trim(),
              phone: "",
              email: "",
              username: "",
              segment: "Support",
              activeTicketCount: draft.status === "resolved" ? 0 : 1,
            } satisfies CustomerRecord,
            ...current.customers,
          ];

      const nextConversations = existingConversation
        ? current.conversations.map((conversation) =>
            conversation.id === existingConversation.id
              ? {
                  ...conversation,
                  name: draft.customerName.trim(),
                  channel: draft.channel,
                  status: deriveConversationStatusFromTicketStatus(draft.status),
                  assignedTo: draft.assignedTo.trim() || conversation.assignedTo,
                  ticketId: nextTicketId,
                  summary: draft.summary.trim(),
                  notes: draft.resolutionNote.trim(),
                  lastIntent: draft.issueType.trim() || conversation.lastIntent,
                  lastMessage: draft.summary.trim(),
                  timestamp,
                }
              : conversation,
          )
        : [nextConversation, ...current.conversations];

      setSelectedId(nextTicketId);

      return {
        ...current,
        tickets: [nextTicket, ...current.tickets],
        customers: nextCustomers,
        conversations: nextConversations,
      };
    });

    setDraft(initialDraft);
    setIsCreateOpen(false);
  };

  const handleDeleteTicket = () => {
    if (!selectedTicket) {
      return;
    }

    const nextSelectedId = data.tickets.find((ticket) => ticket.id !== selectedTicket.id)?.id ?? "";

    patchData((current) => {
      const nextTickets = current.tickets.filter((ticket) => ticket.id !== selectedTicket.id);

      return {
        ...current,
        tickets: nextTickets,
        conversations: current.conversations.map((conversation) =>
          conversation.id === selectedTicket.conversationId
            ? {
                ...conversation,
                ticketId: null,
                status: "ai_active",
                assignedTo: "AI Agent",
              }
            : conversation,
        ),
        customers: current.customers.map((customer) => ({
          ...customer,
          activeTicketCount: nextTickets.filter(
            (ticket) =>
              ticket.customerId === customer.id && ticket.status !== "resolved",
          ).length,
        })),
      };
    });

    setSelectedId(nextSelectedId);
  };

  if (!selectedTicket) {
    return (
      <div className="space-y-6">
        <Card className="p-6 md:p-8 bg-white border border-slate-200 shadow-2xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge variant="secondary">Ticket / Handoff Admin</Badge>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                Ticket desk siap dipakai saat kasus admin pertama masuk.
              </h1>
              <p className="max-w-3xl text-xs md:text-sm leading-relaxed text-slate-600 font-medium">
                Belum ada ticket tersimpan. Anda bisa membuat ticket manual sekarang atau
                biarkan ticket dibuat dari inbox saat AI perlu handoff ke admin.
              </p>
            </div>
            <Button type="button" variant="primary" className="px-5 shrink-0" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Buat ticket
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-5 bg-white border border-slate-200 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">{stat.value}</p>
            </Card>
          ))}
        </div>

        <EmptyState
          icon={<Ticket className="h-10 w-10 text-blue-600" />}
          title="Belum ada ticket"
          description="Ticket akan muncul saat ada handoff dari inbox atau saat Anda membuat kasus manual dari dashboard."
          action={
            <Button type="button" variant="primary" className="px-5" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Buat ticket
            </Button>
          }
          className="min-h-[360px]"
        />

        <Modal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setDraft(initialDraft);
          }}
          title="Buat Ticket"
          className="max-w-2xl"
        >
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Nama Customer</label>
                <Input
                  value={draft.customerName}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, customerName: event.target.value }))
                  }
                  placeholder="Nama customer"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Jenis Issue</label>
                <Input
                  value={draft.issueType}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, issueType: event.target.value }))
                  }
                  placeholder="Jenis issue"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Saluran (Channel)</label>
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
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Petugas (Assigned to)</label>
                <Input
                  value={draft.assignedTo}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, assignedTo: event.target.value }))
                  }
                  placeholder="Assigned to"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Prioritas</label>
                <Select
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      priority: event.target.value as TicketPriority,
                    }))
                  }
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Status</label>
                <Select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as TicketStatus,
                    }))
                  }
                >
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="complaint">complaint</option>
                  <option value="resolved">resolved</option>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Ringkasan Masalah</label>
              <Textarea
                rows={4}
                value={draft.summary}
                onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
                placeholder="Ringkasan ticket"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Catatan Tambahan / Resolution Note</label>
              <Textarea
                rows={3}
                value={draft.resolutionNote}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, resolutionNote: event.target.value }))
                }
                placeholder="Catatan tambahan / resolution note"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">Simpan ticket</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8 bg-white border border-slate-200 shadow-2xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary">Ticket / Handoff Admin</Badge>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Semua kasus yang butuh admin sekarang ditrack sebagai ticket operasional.
            </h1>
            <p className="max-w-3xl text-xs md:text-sm leading-relaxed text-slate-600 font-medium mt-1">
              Modul ini mengikuti flow `handoff`: AI berhenti membalas, sistem membuat ticket,
              admin mengambil alih, lalu status percakapan dan customer ikut tersinkron.
            </p>
          </div>
          <Button type="button" variant="primary" className="px-5 shrink-0" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Buat ticket
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5 bg-white border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] items-start">
        <Card className="p-5 md:p-6 bg-white border border-slate-200 shadow-2xs">
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ticket queue</h2>
              <p className="text-xs text-slate-500 font-medium">
                Daftar kasus yang dibuat dari inbox, komplain, atau handoff AI.
              </p>
            </div>
            <Badge variant="secondary">{data.tickets.length} ticket</Badge>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-xs">Customer</TableHead>
                  <TableHead className="font-bold text-xs">Issue</TableHead>
                  <TableHead className="font-bold text-xs">Priority</TableHead>
                  <TableHead className="font-bold text-xs">Status</TableHead>
                  <TableHead className="font-bold text-xs">Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className={ticket.id === selectedTicket.id ? "bg-blue-50/50" : undefined}
                  >
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setSelectedId(ticket.id)}
                        className="text-left font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer text-xs"
                      >
                        {ticket.customerName}
                      </button>
                    </TableCell>
                    <TableCell className="text-slate-700 text-xs font-semibold">{ticket.issueType}</TableCell>
                    <TableCell>
                      <Badge className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${priorityClasses[ticket.priority]}`}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">{ticket.status}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs font-semibold">{ticket.assignedTo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-5 md:p-6 bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-2.5 text-blue-600">
                <Ticket className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Ticket detail</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Perubahan sinkron ke conversation status.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteTicket}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Hapus
            </Button>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
              <p className="text-sm font-bold text-slate-900">{selectedTicket.customerName}</p>
              <p className="text-[11px] text-slate-500 font-semibold">
                {selectedTicket.channel} • dibuat {selectedTicket.createdAt}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Customer</label>
              <Input
                value={selectedTicket.customerName}
                onChange={(event) => updateTicket({ customerName: event.target.value })}
                className="h-9 bg-slate-50 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Issue type</label>
              <Input
                value={selectedTicket.issueType}
                onChange={(event) => updateTicket({ issueType: event.target.value })}
                className="h-9 bg-slate-50 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Channel</label>
              <Select
                value={selectedTicket.channel}
                onChange={(event) =>
                  updateTicket({ channel: event.target.value as ChannelKind })
                }
                className="h-9 text-xs"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Website Chat">Website Chat</option>
                <option value="Instagram DM">Instagram DM</option>
                <option value="Instagram Comment">Instagram Comment</option>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Status</label>
                <Select
                  value={selectedTicket.status}
                  onChange={(event) =>
                    updateTicket({ status: event.target.value as TicketStatus })
                  }
                  className="h-9 text-xs"
                >
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="complaint">complaint</option>
                  <option value="resolved">resolved</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Priority</label>
                <Select
                  value={selectedTicket.priority}
                  onChange={(event) =>
                    updateTicket({ priority: event.target.value as TicketPriority })
                  }
                  className="h-9 text-xs"
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Assigned to</label>
              <Input
                value={selectedTicket.assignedTo}
                onChange={(event) => updateTicket({ assignedTo: event.target.value })}
                className="h-9 bg-slate-50 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Ringkasan ticket</label>
              <Textarea
                rows={3}
                value={selectedTicket.summary}
                onChange={(event) => updateTicket({ summary: event.target.value })}
                className="bg-slate-50 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Resolution note</label>
              <Textarea
                rows={2}
                value={selectedTicket.resolutionNote ?? ""}
                onChange={(event) => updateTicket({ resolutionNote: event.target.value })}
                className="bg-slate-50 text-xs"
              />
            </div>

            <p className="text-[10px] text-slate-400 font-bold mt-2">
              Terakhir diperbarui: {selectedTicket.updatedAt}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-5 bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Safety first</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 font-medium">
            Ticket membantu memastikan AI tidak memaksa menjawab komplain, refund,
            harga yang tidak ada datanya, atau pertanyaan teknis berat.
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Admin ownership</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 font-medium">
            Saat ticket aktif, conversation otomatis dianggap berada di jalur admin
            sampai diselesaikan atau AI diaktifkan kembali dari inbox.
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900">Closure sync</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 font-medium">
            Menandai ticket `resolved` akan mengubah status conversation ke selesai
            dan mengurangi active ticket count pada customer terkait.
          </p>
        </Card>
      </div>

      <Card className="p-5 bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-xs leading-relaxed text-slate-600 font-semibold">
            Tahap berikutnya tinggal menghubungkan modul ini ke notifikasi real-time,
            SLA admin, dan webhook worker supaya ticket dibuat otomatis dari backend.
          </p>
        </div>
      </Card>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setDraft(initialDraft);
        }}
        title="Buat Ticket"
        className="max-w-2xl"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Nama Customer</label>
              <Input
                value={draft.customerName}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, customerName: event.target.value }))
                }
                placeholder="Nama customer"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Jenis Issue</label>
              <Input
                value={draft.issueType}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, issueType: event.target.value }))
                }
                placeholder="Jenis issue"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Saluran (Channel)</label>
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
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Petugas (Assigned to)</label>
              <Input
                value={draft.assignedTo}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, assignedTo: event.target.value }))
                }
                placeholder="Assigned to"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Prioritas</label>
              <Select
                value={draft.priority}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priority: event.target.value as TicketPriority,
                  }))
                }
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Status</label>
              <Select
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as TicketStatus,
                  }))
                }
              >
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="complaint">complaint</option>
                <option value="resolved">resolved</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">Ringkasan Masalah</label>
            <Textarea
              rows={4}
              value={draft.summary}
              onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
              placeholder="Ringkasan ticket"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">Catatan Tambahan / Resolution Note</label>
            <Textarea
              rows={3}
              value={draft.resolutionNote}
              onChange={(event) =>
                setDraft((current) => ({ ...current, resolutionNote: event.target.value }))
              }
              placeholder="Catatan tambahan / resolution note"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">Simpan ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

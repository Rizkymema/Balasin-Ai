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
  low: "border-sky-400/20 bg-sky-950/20 text-sky-300",
  medium: "border-cyan-400/20 bg-cyan-950/20 text-cyan-300",
  high: "border-amber-400/20 bg-amber-950/20 text-amber-300",
  critical: "border-rose-400/20 bg-rose-950/20 text-rose-300",
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
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/8 bg-gradient-to-r from-white/[0.04] to-transparent p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge>Ticket / Handoff Admin</Badge>
            <h1 className="mt-3 text-3xl font-bold text-white">
              Semua kasus yang butuh admin sekarang ditrack sebagai ticket operasional.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Modul ini mengikuti flow `handoff`: AI berhenti membalas, sistem membuat ticket,
              admin mengambil alih, lalu status percakapan dan customer ikut tersinkron.
            </p>
          </div>
          <Button type="button" variant="secondary" className="rounded-xl px-4" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Buat ticket
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="glass-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Ticket queue</h2>
              <p className="text-xs text-slate-400">
                Daftar kasus yang dibuat dari inbox, komplain, atau handoff AI.
              </p>
            </div>
            <Badge>{data.tickets.length} ticket</Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className={ticket.id === selectedTicket.id ? "bg-white/[0.04]" : undefined}
                >
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedId(ticket.id)}
                      className="text-left text-white"
                    >
                      {ticket.customerName}
                    </button>
                  </TableCell>
                  <TableCell>{ticket.issueType}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${priorityClasses[ticket.priority]}`}
                    >
                      {ticket.priority}
                    </span>
                  </TableCell>
                  <TableCell>{ticket.status}</TableCell>
                  <TableCell>{ticket.assignedTo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3 text-cyan-300">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Ticket detail</h2>
                <p className="text-xs text-slate-400">
                  Perubahan di sini langsung mempengaruhi conversation status.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl border-rose-500/20 bg-rose-950/20 px-4 text-rose-200 hover:border-rose-400/30 hover:bg-rose-950/30"
              onClick={handleDeleteTicket}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">{selectedTicket.customerName}</p>
              <p className="mt-1 text-xs text-slate-400">
                {selectedTicket.channel} | dibuat {selectedTicket.createdAt}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Customer</label>
              <Input
                value={selectedTicket.customerName}
                onChange={(event) => updateTicket({ customerName: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Issue type</label>
              <Input
                value={selectedTicket.issueType}
                onChange={(event) => updateTicket({ issueType: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Channel</label>
              <Select
                value={selectedTicket.channel}
                onChange={(event) =>
                  updateTicket({ channel: event.target.value as ChannelKind })
                }
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Website Chat">Website Chat</option>
                <option value="Instagram DM">Instagram DM</option>
                <option value="Instagram Comment">Instagram Comment</option>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Status</label>
                <Select
                  value={selectedTicket.status}
                  onChange={(event) =>
                    updateTicket({ status: event.target.value as TicketStatus })
                  }
                >
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="complaint">complaint</option>
                  <option value="resolved">resolved</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Priority</label>
                <Select
                  value={selectedTicket.priority}
                  onChange={(event) =>
                    updateTicket({ priority: event.target.value as TicketPriority })
                  }
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Assigned to</label>
              <Input
                value={selectedTicket.assignedTo}
                onChange={(event) => updateTicket({ assignedTo: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Ringkasan ticket</label>
              <Textarea
                rows={4}
                value={selectedTicket.summary}
                onChange={(event) => updateTicket({ summary: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Resolution note</label>
              <Textarea
                rows={3}
                value={selectedTicket.resolutionNote ?? ""}
                onChange={(event) => updateTicket({ resolutionNote: event.target.value })}
              />
            </div>

            <p className="text-[11px] text-slate-500">
              Terakhir diperbarui: {selectedTicket.updatedAt}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-300" />
            <h3 className="text-base font-semibold text-white">Safety first</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Ticket membantu memastikan AI tidak memaksa menjawab komplain, refund,
            harga yang tidak ada datanya, atau pertanyaan teknis berat.
          </p>
        </Card>

        <Card className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-cyan-300" />
            <h3 className="text-base font-semibold text-white">Admin ownership</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Saat ticket aktif, conversation otomatis dianggap berada di jalur admin
            sampai diselesaikan atau AI diaktifkan kembali dari inbox.
          </p>
        </Card>

        <Card className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <h3 className="text-base font-semibold text-white">Closure sync</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Menandai ticket `resolved` akan mengubah status conversation ke selesai
            dan mengurangi active ticket count pada customer terkait.
          </p>
        </Card>
      </div>

      <Card className="glass-panel p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-300" />
          <p className="text-sm leading-7 text-slate-300">
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
            <Input
              value={draft.customerName}
              onChange={(event) =>
                setDraft((current) => ({ ...current, customerName: event.target.value }))
              }
              placeholder="Nama customer"
              required
            />
            <Input
              value={draft.issueType}
              onChange={(event) =>
                setDraft((current) => ({ ...current, issueType: event.target.value }))
              }
              placeholder="Jenis issue"
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
            <Input
              value={draft.assignedTo}
              onChange={(event) =>
                setDraft((current) => ({ ...current, assignedTo: event.target.value }))
              }
              placeholder="Assigned to"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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
          <Textarea
            rows={4}
            value={draft.summary}
            onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
            placeholder="Ringkasan ticket"
            required
          />
          <Textarea
            rows={3}
            value={draft.resolutionNote}
            onChange={(event) =>
              setDraft((current) => ({ ...current, resolutionNote: event.target.value }))
            }
            placeholder="Catatan tambahan / resolution note"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

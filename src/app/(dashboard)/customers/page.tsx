"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Users2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import { createOperatorTimestamp, createRecordId } from "@/lib/dashboard-records";
import type {
  ConversationRecord,
  CrmDealEntry,
  CrmTaskEntry,
  CustomerRecord,
} from "@/types/operations";

import { CrmActionModals } from "./components/crm-action-modals";
import { ContactsTablePanel } from "./components/contacts-table-panel";
import { CreateContactModal } from "./components/create-contact-modal";
import {
  deriveContactDetail,
  deriveContactRows,
  deriveOwnerOptions,
  deriveQuickFilterSummary,
  deriveSegmentOptions,
  deriveTagOptions,
  type CrmFilters,
} from "./components/crm-view-model";

const initialFilters: CrmFilters = {
  search: "",
  segment: "all",
  tag: "all",
  owner: "all",
  channel: "all",
  quickFilter: "all",
  dateRange: "all",
};

export default function CustomersPage() {
  const { data, isLoading, patchData } = useDashboardOperations();
  const [filters, setFilters] = useState<CrmFilters>(initialFilters);
  const [selectedId, setSelectedId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeActionModal, setActiveActionModal] = useState<
    "message" | "deal" | "task" | null
  >(null);

  const allRows = useMemo(
    () =>
      deriveContactRows(data, {
        ...initialFilters,
      }),
    [data],
  );

  const filteredRows = useMemo(() => deriveContactRows(data, filters), [data, filters]);
  const quickFilters = useMemo(() => deriveQuickFilterSummary(allRows), [allRows]);
  const segmentOptions = useMemo(() => deriveSegmentOptions(data), [data]);
  const tagOptions = useMemo(() => deriveTagOptions(data), [data]);
  const ownerOptions = useMemo(() => deriveOwnerOptions(data), [data]);


  useEffect(() => {
    if (!selectedId && allRows[0]) {
      setSelectedId(allRows[0].id);
      return;
    }

    if (selectedId && !allRows.some((row) => row.id === selectedId)) {
      setSelectedId(allRows[0]?.id ?? "");
    }
  }, [allRows, selectedId]);

  const selectedRow =
    filteredRows.find((row) => row.id === selectedId) ??
    allRows.find((row) => row.id === selectedId) ??
    filteredRows[0] ??
    allRows[0] ??
    null;

  const selectedDetail = useMemo(
    () => (selectedRow ? deriveContactDetail(data, selectedRow.customer) : null),
    [data, selectedRow],
  );

  const handleCreateContact = (
    draft: Omit<
      CustomerRecord,
      "id" | "lastContact" | "totalConversation" | "activeTicketCount"
    >,
  ) => {
    const nextCustomer: CustomerRecord = {
      id: createRecordId("cust"),
      name: draft.name,
      channel: draft.channel,
      leadStatus: draft.leadStatus,
      tags: draft.tags,
      lastContact: createOperatorTimestamp(),
      assignedTo: draft.assignedTo,
      totalConversation: 0,
      revenueHint: draft.revenueHint,
      note: draft.note,
      phone: draft.phone,
      email: draft.email,
      username: draft.username,
      segment: draft.segment,
      activeTicketCount: 0,
    };

    void patchData((current) => ({
      ...current,
      customers: [nextCustomer, ...current.customers],
    }));

    setSelectedId(nextCustomer.id);
    setFilters(initialFilters);
  };

  const handleDeleteContact = () => {
    if (!selectedDetail) {
      return;
    }

    const shouldDelete = window.confirm(
      `Hapus contact "${selectedDetail.customer.name}" dari CRM?`,
    );

    if (!shouldDelete) {
      return;
    }

    const targetId = selectedDetail.customer.id;

    void patchData((current) => ({
      ...current,
      customers: current.customers.filter((customer) => customer.id !== targetId),
      conversations: current.conversations.filter(
        (conversation) => conversation.customerId !== targetId,
      ),
      bookings: current.bookings.filter((booking) => booking.customerId !== targetId),
      tickets: current.tickets.filter((ticket) => ticket.customerId !== targetId),
    }));
  };

  const handleSendMessage = (payload: { message: string }) => {
    if (!selectedDetail) {
      return;
    }

    const customer = selectedDetail.customer;
    const timestampLabel = createOperatorTimestamp();
    const nowIso = new Date().toISOString();

    void patchData((current) => {
      const existingConversation = current.conversations.find(
        (conversation) => conversation.customerId === customer.id,
      );

      const nextMessage = {
        id: createRecordId("msg"),
        sender: "admin" as const,
        text: payload.message,
        timestamp: timestampLabel,
        status: "sent" as const,
        type: "text" as const,
      };

      const nextConversation: ConversationRecord = existingConversation
        ? {
            ...existingConversation,
            lastMessage: payload.message,
            timestamp: timestampLabel,
            unreadCount: 0,
            status: "assigned_to_admin",
            messages: [...existingConversation.messages, nextMessage],
            assignedTo: customer.assignedTo || "Admin Desk",
            summary: "Percakapan diupdate manual dari halaman CRM.",
            lastSeenAt: nowIso,
            typingActor: null,
          }
        : {
            id: createRecordId("conv"),
            customerId: customer.id,
            name: customer.name,
            channel: customer.channel,
            lastMessage: payload.message,
            timestamp: timestampLabel,
            unreadCount: 0,
            status: "assigned_to_admin",
            messages: [nextMessage],
            tags: customer.tags,
            notes: customer.note,
            summary: "Percakapan baru dibuat dari halaman CRM.",
            lastSeenAt: nowIso,
            typingActor: null,
            phone: customer.phone,
            email: customer.email,
            username: customer.username,
            assignedTo: customer.assignedTo || "Admin Desk",
            responseTimeSeconds: 0,
            lastIntent: "CRM Follow-up",
            sentiment: "neutral",
            aiConfidence: 0.84,
            riskLevel: customer.leadStatus === "Complaint" ? "high" : "low",
            ticketId: null,
          };

      return {
        ...current,
        conversations: existingConversation
          ? current.conversations.map((conversation) =>
              conversation.id === existingConversation.id ? nextConversation : conversation,
            )
          : [nextConversation, ...current.conversations],
        customers: current.customers.map((item) =>
          item.id === customer.id
            ? {
                ...item,
                lastContact: timestampLabel,
                assignedTo: nextConversation.assignedTo,
                totalConversation: existingConversation
                  ? item.totalConversation
                  : item.totalConversation + 1,
              }
            : item,
        ),
      };
    });
  };

  const handleCreateDeal = (payload: {
    title: string;
    stage: CrmDealEntry["stage"];
    valueLabel: string;
    probability: number;
    owner: string;
    expectedClose: string;
    productOrService: string;
    note: string;
  }) => {
    if (!selectedDetail) {
      return;
    }

    const customer = selectedDetail.customer;
    const timestampLabel = createOperatorTimestamp();

    const nextDeal: CrmDealEntry = {
      id: createRecordId("deal"),
      title: payload.title,
      contactId: customer.id,
      contactName: customer.name,
      stage: payload.stage,
      valueLabel: payload.valueLabel,
      probability: payload.probability,
      owner: payload.owner,
      source: customer.channel,
      expectedClose: payload.expectedClose,
      productOrService: payload.productOrService,
      note: payload.note,
      createdAt: timestampLabel,
      updatedAt: timestampLabel,
    };

    void patchData((current) => ({
      ...current,
      crmDeals: [nextDeal, ...current.crmDeals],
    }));
  };

  const handleCreateTask = (payload: {
    title: string;
    type: string;
    status: CrmTaskEntry["status"];
    dueLabel: string;
    priority: CrmTaskEntry["priority"];
    owner: string;
    outcome: string;
  }) => {
    if (!selectedDetail) {
      return;
    }

    const customer = selectedDetail.customer;
    const timestampLabel = createOperatorTimestamp();

    const nextTask: CrmTaskEntry = {
      id: createRecordId("task"),
      contactId: customer.id,
      contactName: customer.name,
      title: payload.title,
      type: payload.type,
      status: payload.status,
      dueLabel: payload.dueLabel,
      priority: payload.priority,
      owner: payload.owner,
      outcome: payload.outcome,
      createdAt: timestampLabel,
      updatedAt: timestampLabel,
    };

    void patchData((current) => ({
      ...current,
      crmTasks: [nextTask, ...current.crmTasks],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-sm text-[var(--color-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat Contacts / CRM...
        </div>
      </div>
    );
  }

  if (allRows.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[24px] overflow-hidden">
          <EmptyState
            icon={<Users2 className="h-10 w-10 text-[var(--color-brand)]" />}
            title="Belum ada contact tersimpan"
            description="Tambahkan contact pertama agar inbox, booking, ticket, segment, deal, dan task memiliki sumber data CRM yang sama."
            action={
              <Button className="h-11 rounded-xl px-4 bg-[var(--color-brand)] text-slate-950 hover:bg-[var(--color-brand-hover)]" onClick={() => setIsCreateOpen(true)}>
                Tambah Contact
              </Button>
            }
            className="min-h-[440px]"
          />
        </Card>

        <CreateContactModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateContact}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="w-full">
        <ContactsTablePanel
          rows={filteredRows}
          selectedId={selectedRow?.id ?? ""}
          onSelect={setSelectedId}
          filters={filters}
          onFiltersChange={(next) => setFilters((current) => ({ ...current, ...next }))}
          segmentOptions={segmentOptions}
          tagOptions={tagOptions}
          ownerOptions={ownerOptions}
          quickFilters={quickFilters}
          onCreateContact={() => setIsCreateOpen(true)}
        />
      </div>

      <CreateContactModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateContact}
      />

      <CrmActionModals
        activeModal={activeActionModal}
        customer={selectedDetail?.customer ?? null}
        onClose={() => setActiveActionModal(null)}
        onSendMessage={handleSendMessage}
        onCreateDeal={handleCreateDeal}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}

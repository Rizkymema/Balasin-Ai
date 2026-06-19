"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ChannelKind, CustomerRecord, LeadStatus } from "@/types/operations";

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

type CreateContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (draft: Omit<CustomerRecord, "id" | "lastContact" | "totalConversation" | "activeTicketCount">) => void;
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

export function CreateContactModal({
  isOpen,
  onClose,
  onCreate,
}: CreateContactModalProps) {
  const [draft, setDraft] = useState<CustomerDraft>(initialDraft);

  const handleClose = () => {
    setDraft(initialDraft);
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.name.trim()) {
      return;
    }

    onCreate({
      name: draft.name.trim(),
      channel: draft.channel,
      leadStatus: draft.leadStatus,
      assignedTo: draft.assignedTo.trim() || "AI Agent",
      revenueHint: draft.revenueHint.trim() || "Rp0",
      segment: draft.segment.trim() || "General",
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      username: draft.username.trim(),
      tags: parseTags(draft.tags),
      note: draft.note.trim(),
    });

    setDraft(initialDraft);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Contact" className="max-w-3xl">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Nama lengkap
            </label>
            <Input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Contoh: Budi Santoso"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Owner
            </label>
            <Input
              value={draft.assignedTo}
              onChange={(event) =>
                setDraft((current) => ({ ...current, assignedTo: event.target.value }))
              }
              placeholder="AI Agent / Admin"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Channel
            </label>
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

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Lead status
            </label>
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

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Nomor telepon
            </label>
            <Input
              value={draft.phone}
              onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
              placeholder="+62..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Email
            </label>
            <Input
              value={draft.email}
              onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
              placeholder="email@domain.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Username / ID
            </label>
            <Input
              value={draft.username}
              onChange={(event) =>
                setDraft((current) => ({ ...current, username: event.target.value }))
              }
              placeholder="@username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Segment
            </label>
            <Input
              value={draft.segment}
              onChange={(event) =>
                setDraft((current) => ({ ...current, segment: event.target.value }))
              }
              placeholder="General / VIP / Bengkel"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Tags
            </label>
            <Input
              value={draft.tags}
              onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
              placeholder="Pisahkan dengan koma"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Revenue hint
            </label>
            <Input
              value={draft.revenueHint}
              onChange={(event) =>
                setDraft((current) => ({ ...current, revenueHint: event.target.value }))
              }
              placeholder="Rp350.000"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Note
            </label>
            <Textarea
              value={draft.note}
              onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
              placeholder="Catatan singkat customer, kendaraan, kebutuhan, atau preferensi follow-up."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/8 pt-4">
          <Button type="button" variant="secondary" className="h-11 rounded-xl px-4" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" className="h-11 rounded-xl px-4">
            Simpan Contact
          </Button>
        </div>
      </form>
    </Modal>
  );
}

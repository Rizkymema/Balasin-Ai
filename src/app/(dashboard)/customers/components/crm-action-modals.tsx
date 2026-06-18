"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CrmDealStage, CrmTaskPriority, CrmTaskStatus, CustomerRecord } from "@/types/operations";

type CrmActionModalId = "message" | "deal" | "task" | null;

type CrmActionModalsProps = {
  activeModal: CrmActionModalId;
  customer: CustomerRecord | null;
  onClose: () => void;
  onSendMessage: (payload: { message: string }) => void;
  onCreateDeal: (payload: {
    title: string;
    stage: CrmDealStage;
    valueLabel: string;
    probability: number;
    owner: string;
    expectedClose: string;
    productOrService: string;
    note: string;
  }) => void;
  onCreateTask: (payload: {
    title: string;
    type: string;
    status: CrmTaskStatus;
    dueLabel: string;
    priority: CrmTaskPriority;
    owner: string;
    outcome: string;
  }) => void;
};

const initialDealForm = {
  title: "",
  stage: "Qualified" as CrmDealStage,
  valueLabel: "Rp0",
  probability: 45,
  owner: "AI Agent",
  expectedClose: "Minggu ini",
  productOrService: "",
  note: "",
};

const initialTaskForm = {
  title: "",
  type: "WhatsApp Follow-up",
  status: "Open" as CrmTaskStatus,
  dueLabel: "Hari ini",
  priority: "Medium" as CrmTaskPriority,
  owner: "AI Agent",
  outcome: "",
};

export function CrmActionModals({
  activeModal,
  customer,
  onClose,
  onSendMessage,
  onCreateDeal,
  onCreateTask,
}: CrmActionModalsProps) {
  const [message, setMessage] = useState("");
  const [dealForm, setDealForm] = useState(initialDealForm);
  const [taskForm, setTaskForm] = useState(initialTaskForm);

  useEffect(() => {
    if (!customer) {
      return;
    }

    setDealForm({
      ...initialDealForm,
      title: `Opportunity - ${customer.name}`,
      owner: customer.assignedTo || "AI Agent",
      productOrService: customer.segment || customer.channel,
      valueLabel: customer.revenueHint || "Rp0",
    });
    setTaskForm({
      ...initialTaskForm,
      title: `Follow-up ${customer.name}`,
      owner: customer.assignedTo || "AI Agent",
    });
  }, [activeModal, customer]);

  const handleClose = () => {
    setMessage("");
    setDealForm(initialDealForm);
    setTaskForm(initialTaskForm);
    onClose();
  };

  const handleSubmitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    onSendMessage({ message: message.trim() });
    handleClose();
  };

  const handleSubmitDeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dealForm.title.trim()) {
      return;
    }

    onCreateDeal({
      ...dealForm,
      title: dealForm.title.trim(),
      owner: dealForm.owner.trim() || "AI Agent",
      productOrService: dealForm.productOrService.trim() || "General opportunity",
      note: dealForm.note.trim(),
    });
    handleClose();
  };

  const handleSubmitTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskForm.title.trim()) {
      return;
    }

    onCreateTask({
      ...taskForm,
      title: taskForm.title.trim(),
      owner: taskForm.owner.trim() || "AI Agent",
      type: taskForm.type.trim() || "Follow-up",
      outcome: taskForm.outcome.trim(),
    });
    handleClose();
  };

  return (
    <>
      <Modal
        isOpen={activeModal === "message" && customer !== null}
        onClose={handleClose}
        title={`Send Message${customer ? ` - ${customer.name}` : ""}`}
        className="max-w-2xl border-slate-200 bg-white text-slate-900"
      >
        <form className="space-y-5" onSubmit={handleSubmitMessage}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Manual outbound message
            </label>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="min-h-[160px] border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              placeholder="Tulis balasan atau follow-up yang ingin dikirim dari CRM. Pesan ini akan membuat / memperbarui thread contact di Inbox."
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" className="h-11 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="h-11 rounded-xl px-4">
              Kirim ke Inbox
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === "deal" && customer !== null}
        onClose={handleClose}
        title={`Create Deal${customer ? ` - ${customer.name}` : ""}`}
        className="max-w-3xl border-slate-200 bg-white text-slate-900"
      >
        <form className="space-y-5" onSubmit={handleSubmitDeal}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Deal title
              </label>
              <Input
                value={dealForm.title}
                onChange={(event) => setDealForm((current) => ({ ...current, title: event.target.value }))}
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                placeholder="Nama deal"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Stage
              </label>
              <Select
                value={dealForm.stage}
                onChange={(event) =>
                  setDealForm((current) => ({
                    ...current,
                    stage: event.target.value as CrmDealStage,
                  }))
                }
                className="border-slate-200 bg-slate-50 text-slate-900"
              >
                <option value="New Lead">New Lead</option>
                <option value="Qualified">Qualified</option>
                <option value="Booking">Booking</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Value
              </label>
              <Input
                value={dealForm.valueLabel}
                onChange={(event) =>
                  setDealForm((current) => ({ ...current, valueLabel: event.target.value }))
                }
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                placeholder="Rp0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Probability
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={dealForm.probability}
                onChange={(event) =>
                  setDealForm((current) => ({
                    ...current,
                    probability: Number(event.target.value || 0),
                  }))
                }
                className="border-slate-200 bg-slate-50 text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Owner
              </label>
              <Input
                value={dealForm.owner}
                onChange={(event) =>
                  setDealForm((current) => ({ ...current, owner: event.target.value }))
                }
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Expected close
              </label>
              <Input
                value={dealForm.expectedClose}
                onChange={(event) =>
                  setDealForm((current) => ({ ...current, expectedClose: event.target.value }))
                }
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Product / Service
              </label>
              <Input
                value={dealForm.productOrService}
                onChange={(event) =>
                  setDealForm((current) => ({
                    ...current,
                    productOrService: event.target.value,
                  }))
                }
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Note
              </label>
              <Textarea
                value={dealForm.note}
                onChange={(event) =>
                  setDealForm((current) => ({ ...current, note: event.target.value }))
                }
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                placeholder="Catatan deal, kebutuhan customer, atau syarat closing."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" className="h-11 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="h-11 rounded-xl px-4">
              Simpan Deal
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === "task" && customer !== null}
        onClose={handleClose}
        title={`Add Task${customer ? ` - ${customer.name}` : ""}`}
        className="max-w-3xl border-slate-200 bg-white text-slate-900"
      >
        <form className="space-y-5" onSubmit={handleSubmitTask}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Task title
              </label>
              <Input
                value={taskForm.title}
                onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Type
              </label>
              <Input
                value={taskForm.type}
                onChange={(event) => setTaskForm((current) => ({ ...current, type: event.target.value }))}
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Owner
              </label>
              <Input
                value={taskForm.owner}
                onChange={(event) => setTaskForm((current) => ({ ...current, owner: event.target.value }))}
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Status
              </label>
              <Select
                value={taskForm.status}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    status: event.target.value as CrmTaskStatus,
                  }))
                }
                className="border-slate-200 bg-slate-50 text-slate-900"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Due label
              </label>
              <Input
                value={taskForm.dueLabel}
                onChange={(event) => setTaskForm((current) => ({ ...current, dueLabel: event.target.value }))}
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Priority
              </label>
              <Select
                value={taskForm.priority}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    priority: event.target.value as CrmTaskPriority,
                  }))
                }
                className="border-slate-200 bg-slate-50 text-slate-900"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Outcome / Notes
              </label>
              <Textarea
                value={taskForm.outcome}
                onChange={(event) => setTaskForm((current) => ({ ...current, outcome: event.target.value }))}
                className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                placeholder="Tujuan task, next step, atau konteks follow-up."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" className="h-11 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="h-11 rounded-xl px-4">
              Simpan Task
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

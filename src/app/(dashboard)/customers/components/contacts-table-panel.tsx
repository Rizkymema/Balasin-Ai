"use client";

import {
  CalendarClock,
  Eye,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ChannelKind } from "@/types/operations";

import {
  type CrmContactRow,
  type CrmFilters,
  type CrmQuickFilterSummary,
} from "./crm-view-model";

type ContactsTablePanelProps = {
  rows: CrmContactRow[];
  selectedId: string;
  onSelect: (id: string) => void;
  filters: CrmFilters;
  onFiltersChange: (next: Partial<CrmFilters>) => void;
  segmentOptions: string[];
  tagOptions: string[];
  ownerOptions: string[];
  quickFilters: CrmQuickFilterSummary[];
  onCreateContact: () => void;
};

function scoreTone(score: number) {
  if (score >= 76) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (score >= 51) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (score >= 21) {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function channelTone(channel: ChannelKind) {
  switch (channel) {
    case "WhatsApp":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Instagram DM":
    case "Instagram Comment":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
    default:
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }
}

function quickFilterHighlight(id: CrmQuickFilterSummary["id"]) {
  switch (id) {
    case "hot_lead":
      return "text-orange-700";
    case "follow_up":
      return "text-amber-700";
    case "complaint":
      return "text-rose-700";
    case "customer":
      return "text-emerald-700";
    default:
      return "text-slate-700";
  }
}

export function ContactsTablePanel({
  rows,
  selectedId,
  onSelect,
  filters,
  onFiltersChange,
  segmentOptions,
  tagOptions,
  ownerOptions,
  quickFilters,
  onCreateContact,
}: ContactsTablePanelProps) {
  return (
    <Card className="space-y-5 border-slate-200 bg-white p-5 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Contacts</h2>
          <p className="text-xs leading-6 text-slate-500">
            Search customer, filter lifecycle, tag, owner, dan channel dari satu tabel utama.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
          onClick={onCreateContact}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,0.7fr))]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={filters.search}
            onChange={(event) => onFiltersChange({ search: event.target.value })}
            className="border-slate-200 bg-slate-50 pl-9 text-slate-900 placeholder:text-slate-400"
            placeholder="Search customer, phone, email, tag, booking, ticket..."
          />
        </div>

        <Select
          value={filters.segment}
          onChange={(event) => onFiltersChange({ segment: event.target.value })}
          className="border-slate-200 bg-slate-50 text-slate-900"
        >
          {segmentOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Segment" : option}
            </option>
          ))}
        </Select>

        <Select
          value={filters.tag}
          onChange={(event) => onFiltersChange({ tag: event.target.value })}
          className="border-slate-200 bg-slate-50 text-slate-900"
        >
          {tagOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Tag" : option}
            </option>
          ))}
        </Select>

        <Select
          value={filters.owner}
          onChange={(event) => onFiltersChange({ owner: event.target.value })}
          className="border-slate-200 bg-slate-50 text-slate-900"
        >
          {ownerOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Owner" : option}
            </option>
          ))}
        </Select>

        <Select
          value={filters.channel}
          onChange={(event) =>
            onFiltersChange({ channel: event.target.value as CrmFilters["channel"] })
          }
          className="border-slate-200 bg-slate-50 text-slate-900"
        >
          <option value="all">Channel</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Website Chat">Website Chat</option>
          <option value="Instagram DM">Instagram DM</option>
          <option value="Instagram Comment">Instagram Comment</option>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFiltersChange({ quickFilter: filter.id })}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  filters.quickFilter === filter.id
                    ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
                )}
          >
            <span className={quickFilterHighlight(filter.id)}>{filter.label}</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-600 shadow-sm">
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-10 w-10" />}
          title="Tidak ada contact yang cocok"
          description="Coba ubah search atau filter. CRM ini mencari nama, nomor telepon, email, username, tag, booking, ticket, dan catatan."
          action={
            <Button
              type="button"
              variant="secondary"
              className="h-11 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
              onClick={onCreateContact}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Contact
            </Button>
          }
          className="min-h-[320px]"
        />
      ) : (
        <>
          <div className="hidden lg:block">
            <Table className="rounded-2xl overflow-hidden">
              <TableHeader className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "hover:bg-slate-50",
                      row.id === selectedId ? "bg-cyan-50/70" : undefined,
                    )}
                  >
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => onSelect(row.id)}
                        className="flex items-center gap-3 text-left"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-sm font-bold text-cyan-700">
                          {row.customer.name.slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {row.customer.name}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {row.lastActivity}
                          </span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="text-slate-600">{row.primaryContact}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          channelTone(row.customer.channel),
                        )}
                      >
                        {row.customer.channel}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">{row.statusLabel}</TableCell>
                    <TableCell className="text-slate-600">{row.customer.segment || "General"}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          scoreTone(row.leadScore),
                        )}
                      >
                        {row.leadScore}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">{row.customer.assignedTo}</TableCell>
                    <TableCell className="text-slate-600">{row.lastInteraction}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                        {row.nextFollowUp}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onSelect(row.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50"
                        >
                          Assign
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => onSelect(row.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  row.id === selectedId
                    ? "border-cyan-200 bg-cyan-50"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{row.customer.name}</span>
                      {row.openTicketCount > 0 ? (
                        <ShieldAlert className="h-4 w-4 text-amber-300" />
                      ) : null}
                      {row.leadScore >= 76 ? (
                        <Star className="h-4 w-4 text-emerald-300" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{row.primaryContact}</p>
                  </div>

                  <span
                    className={cn(
                      "rounded-full border px-2 py-1 text-[11px] font-semibold",
                      scoreTone(row.leadScore),
                    )}
                  >
                    {row.leadScore}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={cn("border-slate-200 bg-white text-slate-700", channelTone(row.customer.channel))}>
                    {row.customer.channel}
                  </Badge>
                  <Badge className="border-slate-200 bg-white text-slate-700">
                    {row.statusLabel}
                  </Badge>
                  <Badge className="border-slate-200 bg-white text-slate-600">
                    {row.customer.segment || "General"}
                  </Badge>
                </div>

                <div className="mt-3 grid gap-1 text-xs text-slate-500">
                  <span>Owner: {row.customer.assignedTo}</span>
                  <span>Last active: {row.lastInteraction}</span>
                  <span>Next follow-up: {row.nextFollowUp}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

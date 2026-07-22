"use client";

import { useState, useEffect, useMemo, useRef, type ChangeEvent } from "react";
import {
  CalendarClock,
  Eye,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  Star,
  ChevronDown,
  Download,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  MoreHorizontal,
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
import { Dropdown } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import type { ChannelKind, CustomerRecord, LeadStatus } from "@/types/operations";

import {
  type CrmContactRow,
  type CrmFilters,
  type CrmQuickFilterSummary,
} from "./crm-view-model";

type ContactsTablePanelProps = {
  rows: CrmContactRow[];
  allRows: CrmContactRow[];
  selectedId: string;
  onSelect: (id: string) => void;
  filters: CrmFilters;
  onFiltersChange: (next: Partial<CrmFilters>) => void;
  segmentOptions: string[];
  tagOptions: string[];
  ownerOptions: string[];
  quickFilters: CrmQuickFilterSummary[];
  onCreateContact: () => void;
  onBulkDelete: (ids: string[]) => void;
  onImportContacts: (
    drafts: Array<
      Omit<CustomerRecord, "id" | "lastContact" | "totalConversation" | "activeTicketCount">
    >,
  ) => void;
};

// Custom Premium Social SVGs
const WhatsAppIcon = () => (
  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)] shrink-0">
    <svg className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.517 2.266 2.27 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.806-9.799.002-2.618-1.016-5.079-2.87-6.934C16.356 2.017 13.9 1.002 11.281 1.002 5.882 1.002 1.482 5.398 1.48 10.803c-.001 1.562.415 3.09 1.202 4.453l-.992 3.626 3.72-.976.237.141zm11.367-6.845c-.3-.15-1.77-.875-2.04-.972-.27-.099-.47-.15-.67.15-.2.3-.77.972-.94 1.17-.17.2-.34.224-.64.075-.3-.15-1.27-.47-2.42-1.49-.894-.8-1.5-1.785-1.675-2.08-.175-.3-.02-.46.13-.61.135-.13.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.075-.79.37-.27.3-1.03 1.01-1.03 2.46s1.05 2.85 1.2 3.05c.15.2 2.07 3.16 5.01 4.43.7.3 1.25.48 1.68.62.7.22 1.34.19 1.84.11.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.175-1.42-.075-.125-.275-.2-.575-.35z" />
    </svg>
  </span>
);

const InstagramIcon = () => (
  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-pink-500/10 border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.15)] shrink-0">
    <svg className="h-3.5 w-3.5 text-pink-400 fill-none stroke-[2px]" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  </span>
);

const WebsiteChatIcon = () => (
  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)] shrink-0">
    <svg className="h-3.5 w-3.5 text-cyan-400 fill-none stroke-[2px]" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  </span>
);

export function ContactsTablePanel({
  rows,
  allRows,
  selectedId,
  onSelect,
  filters,
  onFiltersChange,
  segmentOptions,
  tagOptions,
  ownerOptions,
  quickFilters,
  onCreateContact,
  onBulkDelete,
  onImportContacts,
}: ContactsTablePanelProps) {
  // Pagination & Checkbox states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const importInputRef = useRef<HTMLInputElement>(null);

  // Reset page and selection when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRowIds(new Set());
  }, [filters]);

  const totalContacts = rows.length;
  const totalPages = Math.ceil(totalContacts / rowsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return rows.slice(startIndex, startIndex + rowsPerPage);
  }, [rows, currentPage, rowsPerPage]);

  // Bulk select toggles
  const toggleAll = () => {
    const currentPageIds = paginatedRows.map((r) => r.id);
    const allSelectedOnCurrentPage = currentPageIds.every((id) => selectedRowIds.has(id));

    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnCurrentPage) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Bulk actions handlers
  const downloadCsv = (contacts: CrmContactRow[]) => {
    const headers = [
      "name",
      "channel",
      "leadStatus",
      "assignedTo",
      "revenueHint",
      "segment",
      "phone",
      "email",
      "username",
      "tags",
      "note",
    ];
    const escapeCell = (value: unknown) => {
      const normalized = String(value ?? "").replace(/"/g, '""');
      return `"${normalized}"`;
    };
    const csv = [
      headers.join(","),
      ...contacts.map(({ customer }) =>
        [
          customer.name,
          customer.channel,
          customer.leadStatus,
          customer.assignedTo,
          customer.revenueHint,
          customer.segment,
          customer.phone,
          customer.email,
          customer.username,
          customer.tags.join(", "),
          customer.note,
        ]
          .map(escapeCell)
          .join(","),
      ),
    ].join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkExport = () => {
    downloadCsv(rows.filter((row) => selectedRowIds.has(row.id)));
    setSelectedRowIds(new Set());
  };

  const handleBulkDelete = () => {
    const ids = [...selectedRowIds];
    if (ids.length > 0 && confirm(`Apakah Anda yakin ingin menghapus ${ids.length} kontak terpilih?`)) {
      onBulkDelete(ids);
      setSelectedRowIds(new Set());
    }
  };

  const parseCsv = (value: string) => {
    const records: string[][] = [];
    let record: string[] = [];
    let cell = "";
    let quoted = false;

    for (let index = 0; index < value.length; index += 1) {
      const character = value[index];
      const nextCharacter = value[index + 1];
      if (character === '"' && quoted && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === "," && !quoted) {
        record.push(cell.trim());
        cell = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && nextCharacter === "\n") {
          index += 1;
        }
        record.push(cell.trim());
        if (record.some(Boolean)) {
          records.push(record);
        }
        record = [];
        cell = "";
      } else {
        cell += character;
      }
    }

    record.push(cell.trim());
    if (record.some(Boolean)) {
      records.push(record);
    }
    return records;
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const records = parseCsv(await file.text());
    const [rawHeader, ...rowsToImport] = records;
    const header = rawHeader?.map((name) => name.replace(/^\uFEFF/, "").trim());
    if (!header || rowsToImport.length === 0) {
      alert("File CSV kosong atau hanya berisi header.");
      return;
    }

    const indexes = new Map(header.map((name, index) => [name.toLowerCase(), index]));
    const read = (row: string[], key: string) => row[indexes.get(key) ?? -1] ?? "";
    const validChannels: ChannelKind[] = [
      "WhatsApp",
      "Website Chat",
      "Instagram DM",
      "Instagram Comment",
    ];
    const validLeadStatuses: LeadStatus[] = [
      "New Lead",
      "Interested",
      "Hot Lead",
      "Asked Price",
      "Booking",
      "Paid",
      "Complaint",
      "Spam",
    ];
    const drafts = rowsToImport
      .map((row) => {
        const name = read(row, "name").trim();
        const channel = read(row, "channel");
        const leadStatus = read(row, "leadstatus");
        if (!name) {
          return null;
        }
        return {
          name,
          channel: validChannels.includes(channel as ChannelKind)
            ? (channel as ChannelKind)
            : "Website Chat",
          leadStatus: validLeadStatuses.includes(leadStatus as LeadStatus)
            ? (leadStatus as LeadStatus)
            : "New Lead",
          assignedTo: read(row, "assignedto") || "AI Agent",
          revenueHint: read(row, "revenuehint") || "Rp0",
          segment: read(row, "segment") || "General",
          phone: read(row, "phone"),
          email: read(row, "email"),
          username: read(row, "username"),
          tags: read(row, "tags")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          note: read(row, "note"),
        } satisfies Omit<CustomerRecord, "id" | "lastContact" | "totalConversation" | "activeTicketCount">;
      })
      .filter((draft): draft is NonNullable<typeof draft> => Boolean(draft));

    if (drafts.length === 0) {
      alert("Tidak ada baris kontak valid. Pastikan kolom name terisi.");
      return;
    }

    onImportContacts(drafts);
  };

  const handleMergeContact = (row: CrmContactRow) => {
    alert(`Menggabungkan profil "${row.customer.name}" dengan akun media sosial/aplikasi pesan lainnya...`);
  };

  const renderChannelIcon = (channel: ChannelKind) => {
    switch (channel) {
      case "WhatsApp":
        return (
          <div className="flex items-center gap-2">
            <WhatsAppIcon />
            <span className="text-emerald-400 text-xs font-semibold">WhatsApp</span>
          </div>
        );
      case "Instagram DM":
      case "Instagram Comment":
        return (
          <div className="flex items-center gap-2">
            <InstagramIcon />
            <span className="text-pink-400 text-xs font-semibold">Instagram</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <WebsiteChatIcon />
            <span className="text-cyan-400 text-xs font-semibold">{channel}</span>
          </div>
        );
    }
  };

  // Dropdown items for global actions
  const globalActionItems = [
    {
      label: "Ekspor Semua Kontak (.csv)",
      onClick: () => downloadCsv(allRows),
      icon: <Download className="h-4 w-4" />,
    },
    {
      label: "Impor Kontak (.csv)",
      onClick: () => importInputRef.current?.click(),
      icon: <Upload className="h-4 w-4" />,
    },
  ];

  return (
    <Card className="relative space-y-5 p-5 md:p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[24px]">
      {/* 1. TOP BAR (Title, Create, and Actions Dropdown) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Contacts</h2>
          <p className="text-xs leading-6 text-slate-400">
            Kelola database pelanggan, saluran pesan, dan waktu pembaruan interaksi.
          </p>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => void handleImportFile(event)}
        />

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            className="h-11 rounded-xl bg-[var(--color-brand)] text-slate-950 hover:bg-[var(--color-brand-hover)] px-4 font-semibold text-sm transition-all duration-200"
            onClick={onCreateContact}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create contact
          </Button>

          <Dropdown
            trigger={
              <Button
                variant="secondary"
                type="button"
                className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] px-4 font-semibold text-sm transition-all duration-200 flex items-center gap-2"
              >
                Actions
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>
            }
            items={globalActionItems}
            align="right"
          />
        </div>
      </div>

      {/* 2. FILTER & SEARCH TOOLS (Middle Top) */}
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            value={filters.search}
            onChange={(event) => onFiltersChange({ search: event.target.value })}
            className="pl-9 h-11 bg-white/[0.02] border-white/10 hover:border-white/20 focus:border-[var(--color-brand)] transition rounded-xl text-sm"
            placeholder="Search contact name"
          />
        </div>

        {/* Channel Filter */}
        <div className="relative">
          <Select
            value={filters.channel}
            onChange={(event) =>
              onFiltersChange({ channel: event.target.value as CrmFilters["channel"] })
            }
            className="h-11 w-full bg-white/[0.02] border-white/10 rounded-xl px-3 text-sm text-slate-200 cursor-pointer"
          >
            <option value="all">All channels</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Website Chat">Website Chat</option>
            <option value="Instagram DM">Instagram DM</option>
            <option value="Instagram Comment">Instagram Comment</option>
          </Select>
        </div>

        {/* Date Picker (Pembaruan Terakhir) */}
        <div className="relative">
          <Select
            value={filters.dateRange || "all"}
            onChange={(event) =>
              onFiltersChange({ dateRange: event.target.value })
            }
            className="h-11 w-full bg-white/[0.02] border-white/10 rounded-xl px-3 text-sm text-slate-200 cursor-pointer"
          >
            <option value="all">All time</option>
            <option value="today">Hari ini</option>
            <option value="yesterday">Kemarin</option>
            <option value="this_week">Minggu ini</option>
            <option value="this_month">Bulan ini</option>
          </Select>
        </div>
      </div>


      {/* 3. CONTACT INFORMATION TABLE */}
      {paginatedRows.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-10 w-10 text-slate-400" />}
          title="Tidak ada kontak yang cocok"
          description="Ubah pencarian, rentang tanggal, atau filter saluran komunikasi Anda."
          action={
            <Button
              type="button"
              variant="secondary"
              className="h-11 rounded-xl px-4"
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
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table className="rounded-2xl overflow-hidden border border-white/5">
              <TableHeader className="bg-white/[0.02] border-b border-white/8 text-slate-400">
                <TableRow>
                  {/* Bulk Checkbox Head */}
                  <TableHead className="w-[50px] px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        paginatedRows.length > 0 &&
                        paginatedRows.every((r) => selectedRowIds.has(r.id))
                      }
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-[var(--color-brand)] focus:ring-[var(--color-brand)] focus:ring-offset-slate-900 cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3">Name</TableHead>
                  <TableHead className="px-4 py-3">Channels</TableHead>
                  <TableHead className="px-4 py-3">Last updated</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/4 bg-transparent">
                {paginatedRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "hover:bg-white/[0.02] transition-all duration-150",
                      row.id === selectedId ? "bg-white/[0.04]" : undefined,
                    )}
                  >
                    {/* Checkbox Single */}
                    <TableCell className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRowIds.has(row.id)}
                        onChange={() => toggleOne(row.id)}
                        className="h-4 w-4 rounded border-white/20 bg-white/5 text-[var(--color-brand)] focus:ring-[var(--color-brand)] focus:ring-offset-slate-900 cursor-pointer"
                      />
                    </TableCell>

                    {/* Name Clickable */}
                    <TableCell className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onSelect(row.id)}
                        className="flex items-center gap-3 text-left hover:opacity-80 transition group"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-brand)]/20 bg-[var(--color-brand)]/8 text-sm font-bold text-[var(--color-brand)] shadow-[0_0_8px_rgba(var(--color-brand-rgb),0.1)]">
                          {row.customer.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-white group-hover:text-[var(--color-brand)] transition">
                            {row.customer.name}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {row.customer.phone || row.customer.email || "No email/phone"}
                          </span>
                        </div>
                      </button>
                    </TableCell>

                    {/* Channel */}
                    <TableCell className="px-4 py-3">
                      {renderChannelIcon(row.customer.channel)}
                    </TableCell>

                    {/* Last updated */}
                    <TableCell className="px-4 py-3 text-sm text-slate-300">
                      {row.customer.lastContact || "Belum ada kontak"}
                    </TableCell>

                    {/* Actions dropdown */}
                    <TableCell className="px-4 py-3 text-right">
                      <Dropdown
                        trigger={
                          <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition">
                            <MoreHorizontal className="h-4.5 w-4.5" />
                          </button>
                        }
                        items={[
                          {
                            label: "View Profile",
                            onClick: () => onSelect(row.id),
                            icon: <Eye className="h-4 w-4" />,
                          },
                          {
                            label: "Merge Contact",
                            onClick: () => handleMergeContact(row),
                            icon: <UserCheck className="h-4 w-4" />,
                          },
                          {
                            label: "Delete Contact",
                            onClick: () => {
                              onSelect(row.id);
                              setTimeout(() => {
                                const btn = document.querySelector('[data-action="delete-contact"]') as HTMLButtonElement;
                                if (btn) {
                                  btn.click();
                                } else {
                                  if (confirm(`Hapus kontak "${row.customer.name}"?`)) {
                                    alert("Silakan hapus kontak ini via tombol Hapus Kontak di panel detail sebelah kanan.");
                                  }
                                }
                              }, 100);
                            },
                            danger: true,
                            icon: <Trash2 className="h-4 w-4" />,
                          },
                        ]}
                        align="right"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="grid gap-3 lg:hidden">
            {paginatedRows.map((row) => (
              <div
                key={row.id}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all duration-200 relative",
                  row.id === selectedId
                    ? "border-[var(--color-brand)]/25 bg-[var(--color-brand)]/8"
                    : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-[var(--color-brand)] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onSelect(row.id)}
                      className="text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{row.customer.name}</span>
                        {row.customer.leadStatus === "Hot Lead" ? (
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {row.customer.phone || row.customer.email || "No details"}
                      </p>
                    </button>
                  </div>

                  <Dropdown
                    trigger={
                      <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition">
                        <MoreHorizontal className="h-4.5 w-4.5" />
                      </button>
                    }
                    items={[
                      {
                        label: "View Profile",
                        onClick: () => onSelect(row.id),
                        icon: <Eye className="h-4 w-4" />,
                      },
                      {
                        label: "Merge Contact",
                        onClick: () => handleMergeContact(row),
                        icon: <UserCheck className="h-4 w-4" />,
                      },
                    ]}
                    align="right"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.04] pt-2.5">
                  {renderChannelIcon(row.customer.channel)}
                  <span className="text-[10px] text-slate-400">
                    Update: {row.customer.lastContact || "Belum ada"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 4. BULK ACTIONS BAR (Floats inside layout when checkboxes are checked) */}
          {selectedRowIds.size > 0 && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[#0d1c33] border border-cyan-500/20 rounded-xl shadow-lg animate-slide-in-up">
              <span className="text-xs text-slate-200 font-semibold">
                {selectedRowIds.size} kontak terpilih
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleBulkExport}
                  variant="secondary"
                  className="h-8 text-xs font-semibold px-3 py-1 bg-white/[0.03] text-slate-200 border-white/10 hover:bg-white/10 rounded-lg"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Ekspor
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  variant="secondary"
                  className="h-8 text-xs font-semibold px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Hapus
                </Button>
                <button
                  onClick={() => setSelectedRowIds(new Set())}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 transition"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* 5. KONTROL HALAMAN & NAVIGASI (Pagination & Rows per Page) */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-white/[0.04]">
            {/* Rows Per Page */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 font-medium cursor-pointer focus:border-[var(--color-brand)] outline-none"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-[11px] text-slate-500 text-center sm:text-right">
                Page {currentPage} of {totalPages} (Showing {Math.min(totalContacts, (currentPage - 1) * rowsPerPage + 1)}-{Math.min(totalContacts, currentPage * rowsPerPage)} of {totalContacts} contacts)
              </span>

              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-white/8 bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/5 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Draw direct page buttons */}
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNum = index + 1;
                  // Show current page, and page numbers around it, and first/last page
                  const shouldShow =
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - currentPage) <= 1;

                  if (!shouldShow) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return <span key={pageNum} className="px-1 text-slate-600 text-xs">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "h-8 w-8 rounded-lg text-xs font-semibold transition cursor-pointer",
                        currentPage === pageNum
                          ? "bg-[var(--color-brand)] text-slate-950 shadow-[0_0_8px_rgba(var(--color-brand-rgb),0.2)]"
                          : "border border-white/8 bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/5",
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-white/8 bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/5 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

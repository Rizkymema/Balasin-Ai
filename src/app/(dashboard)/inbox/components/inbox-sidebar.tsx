"use client";

import {
  Plus,
  Search,
  ChevronsLeft,
  ChevronsRight,
  PlusCircle,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxQuickFilterId, InboxSummary } from "./inbox-view-model";

type InboxSidebarProps = {
  quickFilter: InboxQuickFilterId;
  onQuickFilterChange: (filter: InboxQuickFilterId) => void;
  summary: InboxSummary;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSearchClick: () => void;
};

export function InboxSidebar({
  quickFilter,
  onQuickFilterChange,
  summary,
  collapsed,
  onToggleCollapse,
  onSearchClick,
}: InboxSidebarProps) {
  const folders: Array<{
    id: InboxQuickFilterId;
    label: string;
    count?: number;
  }> = [
    { id: "all", label: "All chats", count: summary.allCount },
    { id: "unhandled", label: "My chats" },
    { id: "need_admin", label: "Unassigned", count: summary.needAdminCount },
    { id: "mine", label: "Assigned", count: summary.mineCount },
    { id: "resolved", label: "Resolved" },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-white/[0.06] bg-[#0a0e1c] transition-all duration-300 h-full justify-between shrink-0",
        collapsed ? "w-16" : "w-[15rem]"
      )}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4.5 border-b border-white/[0.04]">
          {!collapsed && (
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">
              Inbox
            </span>
          )}
          <div className={cn("flex items-center gap-1.5", collapsed && "mx-auto flex-col")}>
            <button
              type="button"
              onClick={onSearchClick}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
              title="Cari percakapan"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
              title="Buat chat baru"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Folders List */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {folders.map((folder) => {
            const active = quickFilter === folder.id;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => onQuickFilterChange(folder.id)}
                className={cn(
                  "flex items-center justify-between w-full rounded-xl text-[13px] font-bold transition duration-150 cursor-pointer px-3.5 py-2.5",
                  active
                    ? "bg-white/[0.06] text-[#00d2ff] shadow-[0_0_12px_rgba(0,210,255,0.03)] border-l-2 border-[#00d2ff] rounded-l-none"
                    : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                )}
                title={collapsed ? folder.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FolderOpen className={cn("h-4 w-4 shrink-0", active ? "text-[#00d2ff]" : "text-slate-500")} />
                  {!collapsed && <span className="truncate">{folder.label}</span>}
                </div>
                {!collapsed && folder.count !== undefined && folder.count > 0 && (
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                    active ? "bg-[#00d2ff]/15 text-[#00d2ff]" : "bg-white/[0.06] text-slate-500"
                  )}>
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Section CUSTOM VIEW */}
          {!collapsed && (
            <div className="pt-6 px-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Custom View
                </span>
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-300 transition"
                  title="Buat custom view"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">
                Belum ada custom view
              </p>
            </div>
          )}
        </nav>
      </div>

      {/* Explore Card & Collapse Button at Bottom */}
      <div className="p-3 border-t border-white/[0.04] bg-[#080c18]/50 space-y-3">
        {!collapsed && (
          <div className="rounded-xl border border-[#00d2ff]/10 bg-[#00d2ff]/[0.02] p-3.5 space-y-3">
            <div>
              <p className="text-[11px] font-extrabold text-slate-200">
                Explore Inbox new look
              </p>
              <p className="text-[10px] text-slate-500 leading-normal mt-1">
                Rasakan performa CRM terpusat dengan layout 3-kolom baru.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                className="w-full border border-white/[0.08] hover:bg-white/[0.06] text-slate-300 rounded-lg text-[10px] font-bold py-1.5 transition"
              >
                Switch to old inbox
              </button>
              <button
                type="button"
                className="w-full bg-[#00d2ff] hover:bg-[#4de0ff] text-[#050814] rounded-lg text-[10px] font-black py-1.5 transition shadow-[0_2px_8px_rgba(0,210,255,0.15)]"
              >
                Give feedback
              </button>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center py-1 text-slate-500 hover:text-slate-300 transition"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}

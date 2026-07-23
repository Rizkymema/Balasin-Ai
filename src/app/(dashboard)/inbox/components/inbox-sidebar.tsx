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
        "flex flex-col border border-slate-200 bg-white rounded-2xl shadow-2xs transition-all duration-300 h-full justify-between shrink-0 overflow-hidden",
        collapsed ? "w-16" : "w-[15rem]"
      )}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Inbox
            </span>
          )}
          <div className={cn("flex items-center gap-1", collapsed && "mx-auto flex-col")}>
            <button
              type="button"
              onClick={onSearchClick}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              title="Cari percakapan"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              title="Buat chat baru"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Folders List */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          {folders.map((folder) => {
            const active = quickFilter === folder.id;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => onQuickFilterChange(folder.id)}
                className={cn(
                  "flex items-center justify-between w-full text-xs font-semibold transition duration-150 cursor-pointer px-3 py-2 rounded-xl",
                  active
                    ? "bg-blue-50 text-blue-700 font-bold border-l-3 border-blue-600 rounded-l-none"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
                title={collapsed ? folder.label : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FolderOpen className={cn("h-4 w-4 shrink-0", active ? "text-blue-600" : "text-slate-400")} />
                  {!collapsed && <span className="truncate">{folder.label}</span>}
                </div>
                {!collapsed && folder.count !== undefined && folder.count > 0 && (
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                    active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  )}>
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Section CUSTOM VIEW */}
          {!collapsed && (
            <div className="pt-4 px-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Custom View
                </span>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title="Buat custom view"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 font-medium italic">
                Belum ada custom view
              </p>
            </div>
          )}
        </nav>
      </div>

      {/* Explore Card & Collapse Button at Bottom */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        {!collapsed && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-2.5">
            <div>
              <p className="text-xs font-bold text-slate-900">
                Explore Inbox new look
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                Rasakan performa CRM terpusat dengan layout terpadu.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold py-1.5 transition shadow-2xs cursor-pointer"
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
          className="flex w-full items-center justify-center py-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
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

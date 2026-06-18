"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  MessageCircleMore,
  BookOpen,
  Package2,
  Wifi,
  Workflow,
  Users2,
  CalendarRange,
  Ticket,
  SendHorizontal,
  BarChart2,
  Settings2,
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  Building2,
  Plus
} from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Unified Inbox", icon: MessageSquare, badge: "2" },
  { href: "/customers", label: "Contacts / CRM", icon: Users2 },
  { href: "/ai-agent", label: "AI Assistant", icon: MessageCircleMore },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { href: "/products-services", label: "Products & Services", icon: Package2 },
  { href: "/booking", label: "Booking", icon: CalendarRange },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/automation", label: "Automation", icon: Workflow },
  { href: "/broadcast", label: "Broadcast / Campaign", icon: SendHorizontal },
  { href: "/channels", label: "Channels", icon: Wifi },
  { href: "/analytics", label: "Reports", icon: BarChart2 },
  { href: "/settings", label: "Team & Settings", icon: Settings2 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isInboxRoute = pathname.startsWith("/inbox");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [businessName, setBusinessName] = useState("Workspace Baru");
  const [userEmail, setUserEmail] = useState("admin@workspace.local");

  useEffect(() => {
    let mounted = true;
    const user = localStorage.getItem("balesin_user");

    if (user) {
      try {
        setUserEmail(JSON.parse(user).email || "admin@workspace.local");
      } catch (e) {}
    }

    const loadWorkspace = async () => {
      try {
        const response = await fetch("/api/dashboard-config", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load workspace");
        }

        const payload = (await response.json()) as {
          ok: boolean;
          data?: {
            workspace?: {
              name?: string;
            };
          };
        };

        if (mounted && payload.data?.workspace?.name?.trim()) {
          setBusinessName(payload.data.workspace.name);
        }
      } catch {}
    };

    void loadWorkspace();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("balesin_user");
    localStorage.removeItem("balesin_onboarded");
    await fetch("/api/session/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
  };

  const workspaceItems = [
    {
      label: businessName,
      onClick: () => {},
      icon: <Building2 className="h-4 w-4 text-[var(--color-brand)]" />,
    },
    {
      label: "Tambah Workspace",
      onClick: () => {
        router.push("/step-1");
      },
      icon: <Plus className="h-4 w-4" />,
    },
  ];

  const profileItems = [
    {
      label: "Profil Akun",
      onClick: () => {
        router.push("/settings");
      },
    },
    {
      label: "Keluar",
      onClick: handleLogout,
      icon: <LogOut className="h-4 w-4" />,
      danger: true,
    },
  ];

  return (
    <div className="relative h-screen bg-[var(--color-bg)] text-white flex overflow-hidden">
      {/* MOBILE SIDEBAR DRAWEROVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR LEFT */}
      <aside
        className={`fixed inset-y-0 left-0 z-45 w-64 border-r border-[var(--color-border)] bg-[var(--color-surface-strong)] transition-transform duration-300 md:translate-x-0 md:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)]">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brand)]">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <span className="font-heading font-bold text-lg">
                Balesin<span className="text-slate-400"> Desk</span>
              </span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded text-slate-400 hover:bg-[var(--color-surface-hover)] md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="px-4 py-4">
            <Dropdown
              trigger={
              <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 hover:bg-[var(--color-surface-hover)] transition duration-200">
                  <div className="flex items-center gap-2 max-w-[170px]">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--color-surface-hover)] text-[var(--color-brand)] border border-[var(--color-brand)]/20 text-xs font-bold font-heading">
                      {businessName.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-white truncate">
                      {businessName}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
              }
              items={workspaceItems}
              align="left"
              className="w-full"
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition duration-150 ${
                    isActive
                      ? "bg-[var(--color-surface)] border border-[var(--color-brand)]/25 text-[var(--color-brand)]"
                      : "text-slate-400 hover:bg-[var(--color-surface-hover)] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 ${isActive ? "text-[var(--color-brand)]" : "text-slate-400"}`} />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand)] text-[10px] font-bold text-slate-950">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer User Info */}
          <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)]">
            <Dropdown
              trigger={
                <div className="flex items-center gap-3 cursor-pointer hover:bg-[var(--color-surface-hover)] p-2 rounded-lg transition duration-200">
                  <div className="h-9 w-9 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-xs font-bold text-[var(--color-brand)]">
                    AD
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">Administrator</div>
                    <div className="text-[10px] text-slate-500 truncate">{userEmail}</div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
              }
              items={profileItems}
              align="right"
              className="w-full"
            />
          </div>
        </div>
      </aside>

      {/* RIGHT CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl flex items-center justify-between px-6 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded text-slate-400 hover:bg-[var(--color-surface-hover)] md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-sm font-semibold text-slate-300">
              Workspace: <span className="text-white">{businessName}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="relative p-2 rounded-lg text-slate-400 hover:bg-[var(--color-surface-hover)] hover:text-white transition duration-200">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--color-brand)]" />
            </button>

            {/* Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              Sistem aktif
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main
          className={`relative flex-1 ${
            isInboxRoute
              ? "flex min-h-0 flex-col overflow-y-auto p-3 lg:overflow-hidden lg:p-4"
              : "overflow-y-auto custom-scrollbar p-6"
          }`}
        >
          <div
            className={
              isInboxRoute
                ? "mx-auto flex h-full min-h-0 w-full max-w-7xl flex-1 flex-col"
                : "mx-auto max-w-7xl space-y-6"
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

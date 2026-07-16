"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Package2,
  Wifi,
  Workflow,
  Users2,
  CalendarRange,
  SendHorizontal,
  BarChart2,
  Settings2,
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  Building2,
  Plus,
  ChevronsLeft,
  ChevronsRight,
  Bot,
  Database,
  GitBranch,
  Settings,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { getTranslation } from "@/lib/translations";
import { DashboardAIAssistant } from "@/components/dashboard-ai-assistant";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Unified Inbox", icon: MessageSquare },
  { href: "/customers", label: "Contacts / CRM", icon: Users2 },
  { href: "/products-services", label: "Products & Services", icon: Package2 },
  { href: "/booking", label: "Booking", icon: CalendarRange },
  { href: "/broadcast", label: "Broadcast / Campaign", icon: SendHorizontal },
  { href: "/channels", label: "Channels", icon: Wifi },
  { href: "/analytics", label: "Reports", icon: BarChart2 },
  { href: "/settings", label: "Team & Settings", icon: Settings2 },
];

const AUTOMATION_SUBNAV = [
  { href: "/automation", label: "Conversations", icon: GitBranch, exact: true },
  { href: "/automation/ai-agent", label: "AI agents", icon: Bot, badge: "NEW" },
  { href: "/automation/knowledge-base", label: "Knowledge Base", icon: Database },
  { href: "/automation/chatbot-settings", label: "Chatbot settings", icon: Settings },
];

function getNavLabel(href: string, defaultLabel: string, t: any) {
  if (href === "/dashboard") return t.dashboard;
  if (href === "/inbox") return t.inbox;
  if (href === "/customers") return t.contacts;
  if (href === "/products-services") return t.products;
  if (href === "/booking") return t.booking;
  if (href === "/broadcast") return t.broadcast;
  if (href === "/channels") return t.channels;
  if (href === "/analytics") return t.reports;
  if (href === "/settings") return t.settings;
  return defaultLabel;
}

function getAutomationLabel(href: string, defaultLabel: string, t: any) {
  if (href === "/automation") return t.conversations;
  if (href === "/automation/ai-agent") return t.aiAgents;
  if (href === "/automation/knowledge-base") return t.knowledgeBase;
  if (href === "/automation/chatbot-settings") return t.chatbotSettings;
  return defaultLabel;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isInboxRoute = pathname.startsWith("/inbox");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [businessName, setBusinessName] = useState("Workspace Baru");
  const [userEmail, setUserEmail] = useState("admin@workspace.local");
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0);
  const [language, setLanguage] = useState("id");
  const t = getTranslation(language);

  const [userName, setUserName] = useState("Admin Johan Garage");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountEmail, setAccountEmail] = useState("admin@workspace.local");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountSuccessMsg, setAccountSuccessMsg] = useState("");
  const [accountErrorMsg, setAccountErrorMsg] = useState("");
  // Always initialize to false so server and client render the same HTML.
  // The real persisted value is loaded from localStorage after mount.
  const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const stored = localStorage.getItem("main_sidebar_collapsed");
    if (stored === "true") {
      setIsMainSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      setIsAiOpen(customEvent.detail?.isOpen ?? false);
    };
    window.addEventListener("balesin-ai-assistant-toggle", handler as EventListener);
    return () => window.removeEventListener("balesin-ai-assistant-toggle", handler as EventListener);
  }, []);

  const [tooltipState, setTooltipState] = useState<{
    label: string;
    top: number;
    left: number;
    visible: boolean;
  }>({ label: "", top: 0, left: 0, visible: false });

  const handleMouseEnter = (e: React.MouseEvent, label: string) => {
    if (!isMainSidebarCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipState({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12, // 12px gap to the right of the item
      visible: true,
    });
  };

  const handleMouseLeave = () => {
    setTooltipState((prev) => ({ ...prev, visible: false }));
  };

  const toggleMainSidebar = () => {
    handleMouseLeave();
    setIsMainSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("main_sidebar_collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    let mounted = true;
    const user = localStorage.getItem("balesin_user");

    if (user) {
      try {
        const parsed = JSON.parse(user);
        setUserEmail(parsed.email || "admin@workspace.local");
        setAccountEmail(parsed.email || "admin@workspace.local");
        setUserName(parsed.name || "Admin Johan Garage");
      } catch (e) {}
    }

    const loadWorkspace = async () => {
      try {
        const response = await fetch("/api/dashboard-config", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("balesin_user");
            localStorage.removeItem("balesin_onboarded");
            window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
            return;
          }
          throw new Error("Failed to load workspace");
        }

        const payload = (await response.json()) as {
          ok: boolean;
          data?: {
            workspace?: {
              name?: string;
              language?: string;
            };
          };
        };

        if (mounted && payload.data?.workspace) {
          if (payload.data.workspace.name?.trim()) {
            setBusinessName(payload.data.workspace.name);
          }
          if (payload.data.workspace.language) {
            setLanguage(payload.data.workspace.language);
          }
        }
      } catch {}
    };

    const loadUnreadCount = async () => {
      try {
        const res = await fetch("/api/dashboard-operations", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("balesin_user");
            localStorage.removeItem("balesin_onboarded");
            window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
            return;
          }
          return;
        }
        const payload = await res.json() as {
          ok: boolean;
          data?: { conversations?: Array<{ unreadCount?: number }> };
        };
        if (mounted && Array.isArray(payload.data?.conversations)) {
          const count = payload.data.conversations.filter(
            (c) => (c.unreadCount ?? 0) > 0
          ).length;
          setInboxUnreadCount(count);
        }
      } catch {}
    };

    void loadWorkspace();
    void loadUnreadCount();

    // Poll unread count every 15 seconds
    const interval = setInterval(() => {
      if (mounted) void loadUnreadCount();
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
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

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountSuccessMsg("");
    setAccountErrorMsg("");
    setIsSavingAccount(true);

    if (newPassword && newPassword !== confirmPassword) {
      setAccountErrorMsg("Konfirmasi password tidak cocok.");
      setIsSavingAccount(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const updatedUser = {
        email: accountEmail,
        name: userName,
        role: "Admin",
      };

      localStorage.setItem("balesin_user", JSON.stringify(updatedUser));
      setUserEmail(accountEmail);
      
      setAccountSuccessMsg("Pengaturan akun berhasil disimpan!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setAccountErrorMsg("Gagal menyimpan pengaturan akun.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const workspaceItems = [
    {
      label: businessName,
      onClick: () => {},
      icon: <Building2 className="h-4 w-4 text-[var(--color-brand)]" />,
    },
    {
      label: language === "id" ? "Tambah Workspace" : "Add Workspace",
      onClick: () => {
        localStorage.removeItem("balesin_onboarded");
        router.push("/step-1");
      },
      icon: <Plus className="h-4 w-4" />,
    },
  ];



  return (
    <div className={`relative h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex overflow-hidden transition-all duration-300 ${isAiOpen ? "md:pr-96" : ""}`}>
      {/* MOBILE SIDEBAR DRAWEROVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR LEFT */}
      <aside
        className={`fixed inset-y-0 left-0 z-45 border-r border-[var(--color-border)] bg-[var(--color-surface-strong)] transition-all duration-300 md:translate-x-0 md:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isMainSidebarCollapsed ? "md:w-20 w-64" : "w-64"}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`h-16 flex items-center border-b border-[var(--color-border)] ${isMainSidebarCollapsed ? "justify-center px-4" : "justify-between px-6"}`}>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brand)] shrink-0">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              {hasMounted && (
                <span className={`font-heading font-bold text-lg whitespace-nowrap ${isMainSidebarCollapsed ? "md:hidden" : ""}`}>
                  Balesin<span className="text-slate-400"> Desk</span>
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded text-slate-400 hover:bg-[var(--color-surface-hover)] md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="px-4 py-4 border-b border-[var(--color-border)]/50">
            <Dropdown
              trigger={
                hasMounted && isMainSidebarCollapsed ? (
                  <>
                    <div
                      onMouseEnter={(e) => handleMouseEnter(e, businessName)}
                      onMouseLeave={handleMouseLeave}
                      onClick={handleMouseLeave}
                      className="hidden md:flex h-10 w-10 mx-auto cursor-pointer items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition duration-200 text-[var(--color-brand)] font-black text-sm shadow-sm"
                    >
                      {businessName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex md:hidden items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 hover:bg-[var(--color-surface-hover)] transition duration-200 cursor-pointer">
                      <div className="flex items-center gap-2 max-w-[170px]">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--color-surface-hover)] text-[var(--color-brand)] border border-[var(--color-brand)]/20 text-xs font-bold font-heading">
                          {businessName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-[var(--color-text)] truncate">
                          {businessName}
                        </span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 hover:bg-[var(--color-surface-hover)] transition duration-200 cursor-pointer">
                    <div className="flex items-center gap-2 max-w-[170px]">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--color-surface-hover)] text-[var(--color-brand)] border border-[var(--color-brand)]/20 text-xs font-bold font-heading">
                        {businessName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-[var(--color-text)] truncate">
                        {businessName}
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                )
              }
              items={workspaceItems}
              header={
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Workspace</span>
                  <span className="text-xs font-bold text-[var(--color-text)] truncate">{businessName}</span>
                </div>
              }
              align={isMainSidebarCollapsed ? "left" : "left"}
              className="w-full"
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
            {/* Main nav items BEFORE automation (Dashboard, Inbox, Contacts, Products, Booking) */}
            {NAV_ITEMS.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href) && (item.href === "/dashboard" ? pathname === "/dashboard" : true);
              // For Unified Inbox: use live unread count
              const dynamicBadge = item.href === "/inbox"
                ? (inboxUnreadCount > 0 ? String(inboxUnreadCount) : undefined)
                : undefined;
              const translatedLabel = getNavLabel(item.href, item.label, t);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={(e) => handleMouseEnter(e, translatedLabel)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => {
                    setIsSidebarOpen(false);
                    handleMouseLeave();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition duration-150 ${
                    isActive
                      ? "bg-[var(--color-surface)] border border-[var(--color-brand)]/25 text-[var(--color-brand)]"
                      : "text-slate-400 hover:bg-[var(--color-surface-hover)] hover:text-white"
                  } ${isMainSidebarCollapsed ? "md:justify-center md:px-1" : ""}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 ${isActive ? "text-[var(--color-brand)]" : "text-slate-400"}`} />
                    <span className={isMainSidebarCollapsed ? "md:hidden" : ""}>
                      {translatedLabel}
                    </span>
                  </span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand)] text-[10px] font-bold text-slate-950 ${
                    dynamicBadge ? "" : "hidden"
                  } ${isMainSidebarCollapsed ? "md:hidden" : ""}`}>
                    {dynamicBadge}
                  </span>
                  {isMainSidebarCollapsed && dynamicBadge && (
                    <span className="hidden md:flex absolute top-1 right-1 h-4 w-4 items-center justify-center rounded-full bg-[var(--color-brand)] text-[8px] font-bold text-slate-950 shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                      {dynamicBadge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* AUTOMATION GROUP with sub-menu */}
            {(() => {
              const isAutomationActive = pathname.startsWith("/automation");
              const isExpanded = isAutomationActive;
              return (
                <div className="space-y-0.5">
                  {/* Automation parent link */}
                  <Link
                    href="/automation"
                    onMouseEnter={(e) => handleMouseEnter(e, t.automation)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => { setIsSidebarOpen(false); handleMouseLeave(); }}
                    className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition duration-150 ${
                      isAutomationActive
                        ? "bg-[var(--color-surface)] border border-[var(--color-brand)]/25 text-[var(--color-brand)]"
                        : "text-slate-400 hover:bg-[var(--color-surface-hover)] hover:text-white"
                    } ${isMainSidebarCollapsed ? "md:justify-center md:px-1" : ""}`}
                  >
                    <span className="flex items-center gap-3">
                      <Workflow className={`h-4.5 w-4.5 ${isAutomationActive ? "text-[var(--color-brand)]" : "text-slate-400"}`} />
                      <span className={isMainSidebarCollapsed ? "md:hidden" : ""}>
                        {t.automation}
                      </span>
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"} ${isMainSidebarCollapsed ? "md:hidden" : ""}`} />
                  </Link>

                  {/* Sub-items */}
                  {isExpanded && (
                    <div className={`ml-3 pl-3 border-l border-white/[0.06] space-y-0.5 py-1 ${isMainSidebarCollapsed ? "md:hidden" : ""}`}>
                      {AUTOMATION_SUBNAV.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = sub.exact
                          ? pathname === sub.href
                          : pathname.startsWith(sub.href);
                        const translatedSubLabel = getAutomationLabel(sub.href, sub.label, t);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition duration-150 ${
                              subActive
                                ? "text-[var(--color-brand)] bg-[var(--color-surface)]"
                                : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <SubIcon className="h-4 w-4" />
                              {translatedSubLabel}
                            </span>
                            {sub.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 uppercase tracking-wider">
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Remaining nav items (Broadcast, Channels, Reports, Settings) */}
            {NAV_ITEMS.slice(5).map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              const translatedLabel = getNavLabel(item.href, item.label, t);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={(e) => handleMouseEnter(e, translatedLabel)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => {
                    setIsSidebarOpen(false);
                    handleMouseLeave();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition duration-150 ${
                    isActive
                      ? "bg-[var(--color-surface)] border border-[var(--color-brand)]/25 text-[var(--color-brand)]"
                      : "text-slate-400 hover:bg-[var(--color-surface-hover)] hover:text-white"
                  } ${isMainSidebarCollapsed ? "md:justify-center md:px-1" : ""}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 ${isActive ? "text-[var(--color-brand)]" : "text-slate-400"}`} />
                    <span className={isMainSidebarCollapsed ? "md:hidden" : ""}>
                      {translatedLabel}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer User Info */}
          <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] flex flex-col gap-2.5">


            {/* Collapse toggle button */}
            <button
              onClick={toggleMainSidebar}
              className="hidden md:flex h-8 w-full items-center justify-center text-slate-500 hover:text-slate-300 transition border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] rounded-lg cursor-pointer"
              title={isMainSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isMainSidebarCollapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 z-30 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded text-slate-400 hover:bg-[var(--color-surface-hover)] md:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-sm font-semibold text-[var(--color-muted)] truncate max-w-[200px] sm:max-w-none">
              {t.workspace}: <span className="text-[var(--color-text)] font-bold">{businessName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition duration-200" title={`Notifikasi (${inboxUnreadCount} belum dibaca)`}>
              <Bell className="h-5 w-5" />
              {inboxUnreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--color-brand)]" />
              )}
            </button>

            {/* Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              {t.systemActive}
            </div>

            {/* Unified User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border)] transition duration-200 cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-bold text-xs border border-[var(--color-brand)]/20 uppercase">
                  {userEmail.slice(0, 2)}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--color-muted)] mr-1 hidden sm:inline" />
              </button>
              
              {isProfileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsProfileDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-[var(--color-border)]/50 mb-1">
                      <p className="text-[10px] text-[var(--color-muted)] font-semibold uppercase tracking-wider">Logged in as</p>
                      <p className="text-xs text-[var(--color-text)] truncate font-bold mt-0.5">{userEmail}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsAccountModalOpen(true);
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition cursor-pointer text-left"
                    >
                      <Settings className="h-4 w-4 text-[var(--color-muted)]" />
                      Pengaturan Akun
                    </button>
                    <div className="h-px bg-[var(--color-border)]/50 my-1.5" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Keluar / Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main
          className={`relative flex-1 ${
            isInboxRoute
              ? "flex min-h-0 flex-col overflow-y-auto p-3 lg:overflow-hidden lg:p-4"
              : "overflow-y-auto custom-scrollbar p-4 sm:p-6"
          }`}
        >
          <div
            className={
              isInboxRoute
                ? "flex h-full min-h-0 w-full flex-1 flex-col"
                : pathname.startsWith("/customers")
                ? "w-full space-y-6"
                : "mx-auto max-w-7xl space-y-6"
            }
          >
            {children}
          </div>
        </main>
      </div>

      {/* Floating fixed tooltip for collapsed sidebar items */}
      {hasMounted && (
        <div
          style={{
            position: "fixed",
            top: `${tooltipState.top}px`,
            left: `${tooltipState.left}px`,
            transform: "translateY(-50%)",
          }}
          className={`z-50 pointer-events-none px-3 py-2 bg-[var(--color-surface-hover)]/95 border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] rounded-lg shadow-xl whitespace-nowrap backdrop-blur-md transition-all duration-150 ease-out normal-case font-sans ${
            tooltipState.visible && isMainSidebarCollapsed
              ? "opacity-100 translate-x-0 scale-100"
              : "opacity-0 -translate-x-2 scale-95 pointer-events-none"
          }`}
        >
          {tooltipState.label}
        </div>
      )}

      {/* Floating AI Assistant Copilot */}
      <DashboardAIAssistant />

      {/* Global Account Settings Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setAccountSuccessMsg("");
          setAccountErrorMsg("");
        }}
        title="Pengaturan Akun"
        className="max-w-md"
      >
        <form onSubmit={handleSaveAccount} className="space-y-4 pt-2">
          {accountSuccessMsg && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 font-semibold">
              {accountSuccessMsg}
            </div>
          )}

          {accountErrorMsg && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-semibold">
              {accountErrorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Nama Lengkap
            </label>
            <Input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Admin Johan Garage"
              required
              className="bg-white/[0.03] border-white/[0.08] focus:border-cyan-400 text-xs py-2 px-3 text-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Alamat Email
            </label>
            <Input
              type="email"
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              placeholder="admin@workspace.local"
              required
              className="bg-white/[0.03] border-white/[0.08] focus:border-cyan-400 text-xs py-2 px-3 text-slate-200"
            />
          </div>

          <div className="h-px bg-white/5 my-2" />

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Password Baru (Opsional)
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white/[0.03] border-white/[0.08] focus:border-cyan-400 text-xs py-2 px-3 text-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Konfirmasi Password Baru
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white/[0.03] border-white/[0.08] focus:border-cyan-400 text-xs py-2 px-3 text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAccountModalOpen(false);
                setAccountSuccessMsg("");
                setAccountErrorMsg("");
              }}
              className="h-8 rounded-lg border-white/[0.08] bg-white/[0.04] text-[11px] hover:bg-white/[0.08]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSavingAccount}
              className="h-8 rounded-lg border-transparent bg-[#00d2ff] text-[#050814] text-[11px] font-semibold hover:bg-[#4de0ff]"
            >
              {isSavingAccount ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

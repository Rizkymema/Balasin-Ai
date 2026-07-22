"use client";

import { useMemo, useState, useEffect } from "react";
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
import {
  deriveDashboardNotifications,
} from "@/lib/notifications";
import type { DashboardOperationsData } from "@/types/operations";
import { DashboardAIAssistant } from "@/components/dashboard-ai-assistant";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Unified Inbox", icon: MessageSquare },
  { href: "/customers", label: "Contacts / CRM", icon: Users2 },
  // { href: "/products-services", label: "Products & Services", icon: Package2 },
  // { href: "/booking", label: "Booking", icon: CalendarRange },
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
  const isFlowBuilderRoute = pathname.startsWith(
    "/automation/conversations/",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [businessName, setBusinessName] = useState("Workspace Baru");
  const [userEmail, setUserEmail] = useState("admin@workspace.local");
  const [notificationOperations, setNotificationOperations] =
    useState<DashboardOperationsData | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [instantHandoffEnabled, setInstantHandoffEnabled] = useState(true);
  const [language, setLanguage] = useState("id");
  const t = getTranslation(language);

  const dashboardNotifications = useMemo(
    () =>
      notificationOperations
        ? deriveDashboardNotifications(notificationOperations, {
            includeHandoff: instantHandoffEnabled,
          })
        : [],
    [instantHandoffEnabled, notificationOperations],
  );
  const notificationCount = dashboardNotifications.length;
  const inboxUnreadCount = useMemo(
    () =>
      notificationOperations?.conversations.filter(
        (conversation) => conversation.unreadCount > 0,
      ).length ?? 0,
    [notificationOperations],
  );

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
            team?: {
              notifications?: {
                instantHandoff?: boolean;
              };
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
        if (mounted && payload.data?.team?.notifications) {
          setInstantHandoffEnabled(
            payload.data.team.notifications.instantHandoff !== false,
          );
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
          data?: DashboardOperationsData;
        };
        if (mounted && payload.data) {
          setNotificationOperations(payload.data);
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
    <div className={`relative h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex overflow-hidden transition-all duration-300 ${isAiOpen && !isFlowBuilderRoute ? "md:pr-96" : ""}`}>
      {/* MOBILE SIDEBAR DRAWEROVERLAY */}
      {isSidebarOpen && !isFlowBuilderRoute && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR LEFT */}
      {!isFlowBuilderRoute && (
      <aside
        className={`fixed inset-y-0 left-0 z-45 border-r border-[var(--color-border)] bg-[var(--color-surface-strong)] transition-all duration-300 md:translate-x-0 md:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isMainSidebarCollapsed ? "md:w-20 w-64" : "w-64"}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`h-14 flex items-center border-b border-[var(--color-border)] ${isMainSidebarCollapsed ? "justify-center px-4" : "justify-between px-6"}`}>
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
                  <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 hover:bg-[var(--color-surface-hover)] transition duration-200 cursor-pointer">
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
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto custom-scrollbar">
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
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition duration-150 ${
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
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition duration-150 ${
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
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition duration-150 ${
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
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition duration-150 ${
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
      )}

      {/* RIGHT CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOPBAR */}
        {!isFlowBuilderRoute && (
          <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 z-30 shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`p-2 -ml-2 rounded text-slate-400 hover:bg-[var(--color-surface-hover)] md:hidden shrink-0 ${isFlowBuilderRoute ? "hidden" : ""}`}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="text-sm font-semibold text-[var(--color-muted)] truncate max-w-[200px] sm:max-w-none">
                {t.workspace}: <span className="text-[var(--color-text)] font-bold">{businessName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen((current) => !current)}
                  className="relative rounded-lg p-2 text-[var(--color-muted)] transition duration-200 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                  title={`Notifikasi (${notificationCount} perlu ditindaklanjuti)`}
                  aria-label="Buka notifikasi"
                  aria-expanded={isNotificationOpen}
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[9px] font-bold text-slate-950">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsNotificationOpen(false)}
                    />
                    <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] shadow-2xl">
                      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
                        <div>
                          <p className="text-sm font-bold text-[var(--color-text)]">
                            Notifikasi
                          </p>
                          <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
                            Inbox dan aktivitas yang perlu ditindaklanjuti
                          </p>
                        </div>
                        <span className="rounded-full bg-[var(--color-brand)]/10 px-2 py-1 text-[10px] font-bold text-[var(--color-brand)]">
                          {notificationCount} aktif
                        </span>
                      </div>

                      <div className="max-h-[min(28rem,60vh)] overflow-y-auto p-2">
                        {dashboardNotifications.length === 0 ? (
                          <div className="px-4 py-10 text-center">
                            <Bell className="mx-auto h-7 w-7 text-[var(--color-muted)]/60" />
                            <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">
                              Tidak ada notifikasi baru
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-muted)]">
                              Pesan baru, handoff, booking, dan tiket akan muncul di sini.
                            </p>
                          </div>
                        ) : (
                          dashboardNotifications.map((notification) => (
                            <Link
                              key={notification.id}
                              href={notification.href}
                              onClick={() => setIsNotificationOpen(false)}
                              className="group flex gap-3 rounded-xl px-3 py-3 transition hover:bg-[var(--color-surface-hover)]"
                            >
                              <span
                                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.priority === "high" ? "bg-rose-400" : "bg-[var(--color-brand)]"}`}
                              />
                              <span className="min-w-0">
                                <span className="block text-xs font-bold text-[var(--color-text)] group-hover:text-[var(--color-brand)]">
                                  {notification.title}
                                </span>
                                <span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-[var(--color-muted)]">
                                  {notification.message}
                                </span>
                              </span>
                            </Link>
                          ))
                        )}
                      </div>

                      <div className="border-t border-[var(--color-border)] p-2">
                        <Link
                          href="/inbox"
                          onClick={() => setIsNotificationOpen(false)}
                          className="block rounded-lg px-3 py-2 text-center text-xs font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand)]/10"
                        >
                          Buka Unified Inbox
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

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
        )}

        {/* PAGE CONTENT CONTAINER */}
        <main
          className={`relative flex-1 ${
            isFlowBuilderRoute
              ? "flex min-h-0 flex-col overflow-hidden p-0"
              : isInboxRoute
              ? "flex min-h-0 flex-col overflow-y-auto p-3 lg:overflow-hidden lg:p-4"
              : "overflow-y-auto custom-scrollbar p-4 md:p-5"
          }`}
        >
          <div
            className={
              isFlowBuilderRoute
                ? "flex h-full min-h-0 w-full flex-1 flex-col"
                : isInboxRoute
                ? "flex h-full min-h-0 w-full flex-1 flex-col"
                : "w-full space-y-5"
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
      {!isFlowBuilderRoute && <DashboardAIAssistant />}

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

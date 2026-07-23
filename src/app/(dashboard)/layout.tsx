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
      left: rect.right + 12,
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
      icon: <Building2 className="h-4 w-4 text-blue-600" />,
      className: "bg-blue-50 text-blue-700 font-bold border border-blue-200",
    },
    {
      label: language === "id" ? "Tambah Workspace" : "Add Workspace",
      onClick: () => {
        localStorage.removeItem("balesin_onboarded");
        router.push("/step-1");
      },
      icon: <Plus className="h-4 w-4 text-slate-600" />,
    },
  ];

  return (
    <div className={`app-dashboard-shell relative flex h-screen overflow-hidden bg-slate-50 text-slate-900 transition-all duration-300 ${isAiOpen && !isFlowBuilderRoute ? "md:pr-96" : ""}`}>
      {/* MOBILE SIDEBAR OVERLAY */}
      {isSidebarOpen && !isFlowBuilderRoute && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR LEFT */}
      {!isFlowBuilderRoute && (
      <aside
        className={`app-dashboard-sidebar fixed inset-y-0 left-0 z-45 border-r border-slate-200 bg-white transition-all duration-300 md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isMainSidebarCollapsed ? "md:w-20 w-64" : "w-64"}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`h-14 flex items-center border-b border-slate-200 ${isMainSidebarCollapsed ? "justify-center px-4" : "justify-between px-6"}`}>
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2.5"
              onMouseEnter={(e) => handleMouseEnter(e, "Balesin Desk Dashboard")}
              onMouseLeave={handleMouseLeave}
              title={isMainSidebarCollapsed ? "Balesin Desk Dashboard" : undefined}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              {hasMounted && (
                <span className={`font-heading font-bold text-lg whitespace-nowrap text-slate-900 ${isMainSidebarCollapsed ? "md:hidden" : ""}`}>
                  Balesin<span className="text-blue-600 font-extrabold"> Desk</span>
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:hidden cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="px-3 py-3 border-b border-slate-200">
            <Dropdown
              trigger={
                hasMounted && isMainSidebarCollapsed ? (
                  <>
                    <div
                      onMouseEnter={(e) => handleMouseEnter(e, `Workspace: ${businessName}`)}
                      onMouseLeave={handleMouseLeave}
                      onClick={handleMouseLeave}
                      title={`Workspace: ${businessName}`}
                      className="hidden md:flex h-10 w-10 mx-auto cursor-pointer items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all duration-150 font-black text-xs shadow-2xs"
                    >
                      {businessName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex md:hidden items-center justify-between rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 transition-all duration-150 cursor-pointer shadow-2xs">
                      <div className="flex items-center gap-2.5 max-w-[170px]">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-extrabold font-heading shadow-2xs">
                          {businessName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {businessName}
                        </span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 px-3 py-2 transition-all duration-150 cursor-pointer shadow-2xs group">
                    <div className="flex items-center gap-2.5 max-w-[170px]">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-extrabold font-heading shadow-2xs">
                        {businessName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Workspace</span>
                        <span className="text-xs font-bold text-slate-900 truncate transition-colors">
                          {businessName}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </div>
                )
              }
              items={workspaceItems}
              header={
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Workspace Aktif</span>
                    <span className="text-xs font-bold text-slate-900 truncate">{businessName}</span>
                  </div>
                  <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
              }
              align="left"
              className="w-full"
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
            {/* Main nav items (Dashboard, Inbox, Contacts) */}
            {NAV_ITEMS.slice(0, 3).map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href) && (item.href === "/dashboard" ? pathname === "/dashboard" : true);
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
                  title={isMainSidebarCollapsed ? translatedLabel : undefined}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition duration-150 ${
                    isActive
                      ? "bg-blue-50 border border-blue-200 text-blue-700 font-bold shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                  } ${isMainSidebarCollapsed ? "md:justify-center md:px-1" : ""}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"}`} />
                    <span className={isMainSidebarCollapsed ? "md:hidden" : ""}>
                      {translatedLabel}
                    </span>
                  </span>
                  <span className={`flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold ${
                    dynamicBadge ? "" : "hidden"
                  } ${isMainSidebarCollapsed ? "md:hidden" : ""}`}>
                    {dynamicBadge}
                  </span>
                  {isMainSidebarCollapsed && dynamicBadge && (
                    <span className="hidden md:flex absolute top-1 right-1 h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[8px] font-bold shadow-2xs">
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
                <div className="space-y-1">
                  {/* Automation parent link */}
                  <Link
                    href="/automation"
                    onMouseEnter={(e) => handleMouseEnter(e, t.automation)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => { setIsSidebarOpen(false); handleMouseLeave(); }}
                    title={isMainSidebarCollapsed ? t.automation : undefined}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition duration-150 ${
                      isAutomationActive
                        ? "bg-blue-50 border border-blue-200 text-blue-700 font-bold shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                    } ${isMainSidebarCollapsed ? "md:justify-center md:px-1" : ""}`}
                  >
                    <span className="flex items-center gap-3">
                      <Workflow className={`h-4.5 w-4.5 ${isAutomationActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"}`} />
                      <span className={isMainSidebarCollapsed ? "md:hidden" : ""}>
                        {t.automation}
                      </span>
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"} ${isMainSidebarCollapsed ? "md:hidden" : ""}`} />
                  </Link>

                  {/* Sub-items */}
                  {isExpanded && (
                    <div className={`ml-3 pl-3 border-l border-slate-200 space-y-1 py-1 ${isMainSidebarCollapsed ? "md:hidden" : ""}`}>
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
                                ? "text-blue-700 bg-blue-50 font-bold border border-blue-200/60"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <SubIcon className="h-4 w-4" />
                              {translatedSubLabel}
                            </span>
                            {sub.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white uppercase tracking-wider">
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
            {NAV_ITEMS.slice(3).map((item) => {
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
                  title={isMainSidebarCollapsed ? translatedLabel : undefined}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition duration-150 ${
                    isActive
                      ? "bg-blue-50 border border-blue-200 text-blue-700 font-bold shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                  } ${isMainSidebarCollapsed ? "md:justify-center md:px-1" : ""}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"}`} />
                    <span className={isMainSidebarCollapsed ? "md:hidden" : ""}>
                      {translatedLabel}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer User Info */}
          <div className="p-3 border-t border-slate-200 bg-white flex flex-col gap-2.5">
            {/* Collapse toggle button */}
            <button
              onClick={toggleMainSidebar}
              className="hidden md:flex h-8 w-full items-center justify-center text-slate-500 hover:text-slate-800 transition border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer"
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
          <header className="app-dashboard-topbar z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden shrink-0 ${isFlowBuilderRoute ? "hidden" : ""}`}
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t.systemActive}
                </span>

                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 shadow-2xs">
                  <span className="text-slate-400">TZ:</span>
                  <span className="text-slate-800 font-bold">{language === "id" ? "Asia/Jakarta" : "UTC+7"}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen((current) => !current)}
                  className="relative rounded-xl p-2 text-slate-500 transition duration-150 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                  title={`Notifikasi (${notificationCount} perlu ditindaklanjuti)`}
                  aria-label="Buka notifikasi"
                  aria-expanded={isNotificationOpen}
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-blue-600 text-white px-1 text-[10px] font-extrabold shadow-xs">
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
                    <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Notifikasi
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Inbox dan aktivitas yang perlu ditindaklanjuti
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                          {notificationCount} aktif
                        </span>
                      </div>

                      <div className="max-h-[min(28rem,60vh)] overflow-y-auto p-2">
                        {dashboardNotifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell className="mx-auto h-7 w-7 text-slate-300" />
                            <p className="mt-2 text-xs font-bold text-slate-800">
                              Tidak ada notifikasi baru
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Pesan baru, handoff, booking, dan tiket akan muncul di sini.
                            </p>
                          </div>
                        ) : (
                          dashboardNotifications.map((notification) => (
                            <Link
                              key={notification.id}
                              href={notification.href}
                              onClick={() => setIsNotificationOpen(false)}
                              className="group flex gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50 border border-transparent hover:border-slate-200"
                            >
                              <span
                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.priority === "high" ? "bg-rose-500" : "bg-blue-600"}`}
                              />
                              <span className="min-w-0">
                                <span className="block text-xs font-bold text-slate-900 group-hover:text-blue-600">
                                  {notification.title}
                                </span>
                                <span className="mt-0.5 block line-clamp-2 text-[11px] leading-4 text-slate-500">
                                  {notification.message}
                                </span>
                              </span>
                            </Link>
                          ))
                        )}
                      </div>

                      <div className="border-t border-slate-100 p-2 bg-slate-50/50">
                        <Link
                          href="/inbox"
                          onClick={() => setIsNotificationOpen(false)}
                          className="block rounded-lg px-3 py-2 text-center text-xs font-bold text-blue-600 hover:bg-blue-50 transition"
                        >
                          Buka Unified Inbox
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Unified User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition duration-150 cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-extrabold text-xs shadow-2xs uppercase">
                    {userEmail.slice(0, 2)}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-1 hidden sm:inline" />
                </button>
                
                {isProfileDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsProfileDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-fade-in">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Logged in as</p>
                        <p className="text-xs text-slate-900 truncate font-bold mt-0.5">{userEmail}</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsAccountModalOpen(true);
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer text-left"
                      >
                        <Settings className="h-4 w-4 text-slate-400" />
                        Pengaturan Akun
                      </button>
                      <div className="h-px bg-slate-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left"
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
              ? "flex min-h-0 flex-col overflow-y-auto p-4 lg:overflow-hidden lg:p-6"
              : "overflow-y-auto custom-scrollbar p-5 sm:p-6 md:p-8"
          }`}
        >
          <div
            className={
              isFlowBuilderRoute
                ? "flex h-full min-h-0 w-full flex-1 flex-col"
                : isInboxRoute
                ? "flex h-full min-h-0 w-full flex-1 flex-col"
                : "w-full max-w-7xl mx-auto space-y-6"
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
          className={`z-50 pointer-events-none px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap transition-all duration-150 ease-out normal-case font-sans ${
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
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 font-bold">
              {accountSuccessMsg}
            </div>
          )}

          {accountErrorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-bold">
              {accountErrorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Nama Lengkap
            </label>
            <Input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Admin Johan Garage"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Alamat Email
            </label>
            <Input
              type="email"
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              placeholder="admin@workspace.local"
              required
            />
          </div>

          <div className="h-px bg-slate-100 my-2" />

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Password Baru (Opsional)
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Konfirmasi Password Baru
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAccountModalOpen(false);
                setAccountSuccessMsg("");
                setAccountErrorMsg("");
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isSavingAccount}
              variant="primary"
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

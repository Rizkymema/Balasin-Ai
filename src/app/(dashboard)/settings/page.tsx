"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  Bell,
  Building2,
  Check,
  Globe,
  KeyRound,
  Save,
  Settings,
  Trash2,
  UserPlus,
  Plus,
  Phone,
  Shield,
  Mail,
  Database,
  Inbox,
  ListChecks,
  History,
  UserCheck,
  ChevronRight,
  ChevronDown,
  Copy,
  PlusCircle,
  Link2,
  Sliders,
  Clock,
  Eye,
  FileCode,
  User,
  SlidersHorizontal,
  FolderSync
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { resolveDashboardPublicAppUrl } from "@/lib/runtime-url";
import type { TeamMember } from "@/types/dashboard-config";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { InboxSettings } from "./components/inbox-settings";
import { ChatbotTokens } from "./components/chatbot-tokens";
import { UserManagementTab } from "./components/user-management-tab";

// ── Agent Management – module-level constants ────────────────────────────────
const AGENT_TABS = [
  { id: "division", label: "Division" },
  { id: "allocation", label: "Agent Allocation" },
  { id: "broadcast", label: "Broadcast" },
  { id: "workload", label: "Workload" },
  { id: "idle_rule", label: "Idle Rule" },
  { id: "masking", label: "Contact Masking" },
];

const BROADCAST_ROLES = ["Admin", "Supervisor", "Sales", "Customer Service", "Agent"];

const MASKABLE_FIELDS = [
  { key: "phone", label: "Nomor Telepon", example: "+62812******90" },
  { key: "email", label: "Email", example: "r*****@gmail.com" },
  { key: "address", label: "Alamat", example: "Jl. *** No. **" },
  { key: "plate_number", label: "Nomor Kendaraan", example: "DB **** XY" },
  { key: "invoice_number", label: "Nomor Invoice", example: "INV-****-2026" },
  { key: "member_number", label: "Nomor Member", example: "MBR-****" },
];

function AgentToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
    </label>
  );
}

function toggleArrayField(field: string, arr: string[], setArr: (v: string[]) => void) {
  setArr(arr.includes(field) ? arr.filter((f) => f !== field) : [...arr, field]);
}

type ActiveSetting =
  | "profile"
  | "users"
  | "agents"
  | "sla"
  | "inbox"
  | "call"
  | "contacts"
  | "survey"
  | "ticket"
  | "logs"
  | "security"
  | "token_omni"
  | "token_bot";

export default function SettingsPage() {
  const { config, patchConfig, isLoading } = useDashboardConfig();
  const initialized = useRef(false);

  const [activeSetting, setActiveSetting] = useState<ActiveSetting>("profile");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [isApiDropdownOpen, setIsApiDropdownOpen] = useState(true);

  // VoIP Call Settings
  const [sipProvider, setSipProvider] = useState("twilio");
  const [sipServer, setSipServer] = useState("sip.balesin.ai");
  const [sipUsername, setSipUsername] = useState("sip_johan_garage");
  const [sipPassword, setSipPassword] = useState("••••••••••••••••");
  const [outboundCallerId, setOutboundCallerId] = useState("+6281445811835");
  const [isSavedCall, setIsSavedCall] = useState(false);
  const [recordCalls, setRecordCalls] = useState(true);
  const [logCallsToCrm, setLogCallsToCrm] = useState(true);

  // Chatbot Token Settings moved to chatbot-tokens.tsx

  // Ticket Automation
  const [autoCreateTicket, setAutoCreateTicket] = useState(true);
  const [ticketEscalationWarning, setTicketEscalationWarning] = useState(true);
  const [isSavedTicketAutomation, setIsSavedTicketAutomation] = useState(false);

  // Security Sessions
  const [activeSessions, setActiveSessions] = useState([
    { id: "s1", device: "Chrome / Windows 11", ip: "182.1.24.89 (IP Kantor)", lastActive: "Baru saja", isCurrent: true },
    { id: "s2", device: "Safari / iOS Mobile", ip: "36.72.105.14", lastActive: "2 jam yang lalu", isCurrent: false }
  ]);

  // Workspace Profile States
  const [workspaceName, setWorkspaceName] = useState(config.workspace.name);
  const [industry, setIndustry] = useState(config.workspace.industry);
  const [description, setDescription] = useState(config.workspace.description);
  const [address, setAddress] = useState(config.workspace.address);
  const [businessHours, setWorkspaceBusinessHours] = useState(config.workspace.businessHours);
  const [timezone, setTimezone] = useState(config.workspace.timezone);
  const [lang, setLang] = useState(config.workspace.language);
  const [supportEmail, setSupportEmail] = useState(config.workspace.supportEmail);
  const [isSavedWorkspace, setIsSavedWorkspace] = useState(false);

  // Runtime / API Chatbot States moved to chatbot-tokens.tsx

  // User Management States
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Operator">("Operator");
  const [members, setMembers] = useState<TeamMember[]>(config.team.members);

  // Notifications / Security Settings States
  const [notifyEmail, setNotifyEmail] = useState(config.team.notifications.emailDigest);
  const [notifyHandoff, setNotifyHandoff] = useState(config.team.notifications.instantHandoff);
  const [notifyWeekly, setNotifyWeekly] = useState(config.team.notifications.weeklyReport);
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  // Mock Omnichannel API Token Workspace States
  const [omniClientId, setOmniClientId] = useState("omni_client_johan_834927");
  const [omniClientSecret, setOmniClientSecret] = useState("omni_secret_••••••••••••••••••••••••");
  const [omniAccessToken, setOmniAccessToken] = useState("balesin_omni_tok_8492048f328a1c9e42d");
  const [omniRefreshToken, setOmniRefreshToken] = useState("balesin_omni_ref_39103c84d7281f9a03c");
  const [isSavedOmniToken, setIsSavedOmniToken] = useState(false);
  const [omniCopied, setOmniCopied] = useState(false);

  // Mock Agent Quota States (legacy)
  const [maxChatsPerAgent, setMaxChatsPerAgent] = useState(10);
  const [autoAssignmentMode, setAutoAssignmentMode] = useState("round_robin");
  const [isSavedAgentSettings, setIsSavedAgentSettings] = useState(false);

  // Agent Management – full state
  const [agentTab, setAgentTab] = useState("division");
  const [isSavedAgent, setIsSavedAgent] = useState(false);
  const [divisions, setDivisions] = useState([
    { id: "div_001", name: "Customer Service", description: "Menangani pertanyaan umum pelanggan.", agents: 5, supervisor: "Admin Senior", status: "Active" },
    { id: "div_002", name: "Mekanik", description: "Menangani pertanyaan teknis servis motor.", agents: 3, supervisor: "Kepala Mekanik", status: "Active" },
    { id: "div_003", name: "Sales", description: "Menangani penjualan produk dan sparepart.", agents: 4, supervisor: "Sales Lead", status: "Active" },
  ]);
  const [showDivModal, setShowDivModal] = useState(false);
  const [newDivName, setNewDivName] = useState("");
  const [newDivDesc, setNewDivDesc] = useState("");
  const [newDivSupervisor, setNewDivSupervisor] = useState("");
  const [canTakeover, setCanTakeover] = useState(true);
  const [canAssign, setCanAssign] = useState(true);
  const [autoAlloc, setAutoAlloc] = useState(false);
  const [allocMethod, setAllocMethod] = useState("Round Robin");
  const [customAlloc, setCustomAlloc] = useState(true);
  const [webhookAllocUrl, setWebhookAllocUrl] = useState("https://your-domain.com/webhooks/agent-allocation");
  const [webhookAllocSecret, setWebhookAllocSecret] = useState("sk_alloc_***************");
  const [showAllocSecret, setShowAllocSecret] = useState(false);
  const [allocTimeout, setAllocTimeout] = useState(5);
  const [allocRetry, setAllocRetry] = useState(3);
  const [allocFallback, setAllocFallback] = useState("Assign to any available agent");
  const [broadcastPerms, setBroadcastPerms] = useState<Record<string, { create: boolean; send: boolean; approve: boolean }>>(
    { Admin: { create: true, send: true, approve: false }, Supervisor: { create: true, send: true, approve: false }, Sales: { create: true, send: false, approve: true }, "Customer Service": { create: false, send: false, approve: true }, Agent: { create: false, send: false, approve: true } }
  );
  const [workloadEnabled, setWorkloadEnabled] = useState(true);
  const [workloadDefaultMax, setWorkloadDefaultMax] = useState(10);
  const [workloadDefaultPending, setWorkloadDefaultPending] = useState(20);
  const [overflowRule, setOverflowRule] = useState("Keep in queue");
  const [waitingMsg, setWaitingMsg] = useState("Mohon tunggu sebentar kak, semua admin sedang melayani pelanggan lain. Chat kakak sudah masuk antrean dan akan segera kami bantu.");
  const [workloadByDiv, setWorkloadByDiv] = useState([
    { division: "Customer Service", maxActive: 10, maxPending: 20 },
    { division: "Mekanik", maxActive: 5, maxPending: 10 },
    { division: "Sales", maxActive: 15, maxPending: 25 },
  ]);
  const [idleEnabled, setIdleEnabled] = useState(true);
  const [idleThreshold, setIdleThreshold] = useState(15);
  const [idleUnit, setIdleUnit] = useState("minutes");
  const [idleStatus, setIdleStatus] = useState("Away");
  const [autoOffline, setAutoOffline] = useState(true);
  const [notifySupervisor, setNotifySupervisor] = useState(true);
  const [maskEnabled, setMaskEnabled] = useState(true);
  const [maskedFields, setMaskedFields] = useState(["phone", "email", "plate_number", "invoice_number"]);
  const [fullViewRoles, setFullViewRoles] = useState(["Owner", "Admin", "Supervisor"]);

  // Mock SLA States
  const [firstResponseMinutes, setFirstResponseMinutes] = useState(5);
  const [followupResponseMinutes, setFollowupResponseMinutes] = useState(10);
  const [isSavedSla, setIsSavedSla] = useState(false);

  // Mock Contact Info custom fields
  const [customFields, setCustomFields] = useState([
    { id: "1", name: "License Plate (Plat Nomor)", type: "Text", required: true },
    { id: "2", name: "Motorcycle Model (Tipe Motor)", type: "Text", required: true },
    { id: "3", name: "Preferred Service Schedule", type: "Date", required: false }
  ]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("Text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Mock Survey CSAT States
  const [csatEnabled, setCsatEnabled] = useState(true);
  const [csatScale, setCsatScale] = useState("5");
  const [csatQuestion, setCsatQuestion] = useState("Bagaimana penilaian Anda terhadap kualitas servis dan respon agen Johan Garage hari ini?");
  const [isSavedSurvey, setIsSavedSurvey] = useState(false);

  // Mock Ticket Category States
  const [ticketCategories, setTicketCategories] = useState([
    { id: "c1", name: "Mesin & Transmisi", defaultPriority: "High" },
    { id: "c2", name: "Kelistrikan", defaultPriority: "Medium" },
    { id: "c3", name: "Servis Rutin / Oli", defaultPriority: "Low" }
  ]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryPriority, setNewCategoryPriority] = useState("Medium");

  // Mock Inbox States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotificationEnabled, setBrowserNotificationEnabled] = useState(true);
  const [autoTakeoverTimeout, setAutoTakeoverTimeout] = useState(30);
  const [isSavedInboxSettings, setIsSavedInboxSettings] = useState(false);

  // Mock Import Export logs
  const [logs, setLogs] = useState([
    { id: "l1", type: "Export Contacts", user: "Admin Johan", date: "2026-06-22 14:32", status: "Success", size: "145 KB" },
    { id: "l2", type: "Import Contacts CSV", user: "Admin Johan", date: "2026-06-20 09:15", status: "Success (154 baris)", size: "48 KB" },
    { id: "l3", type: "Export CSAT Survey", user: "Admin Johan", date: "2026-06-18 17:40", status: "Success", size: "12 KB" }
  ]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!isLoading && !initialized.current) {
      setWorkspaceName(config.workspace.name);
      setIndustry(config.workspace.industry);
      setDescription(config.workspace.description);
      setAddress(config.workspace.address);
      setWorkspaceBusinessHours(config.workspace.businessHours);
      setTimezone(config.workspace.timezone);
      setLang(config.workspace.language);
      setSupportEmail(config.workspace.supportEmail);
      setMembers(config.team.members);
      setNotifyEmail(config.team.notifications.emailDigest);
      setNotifyHandoff(config.team.notifications.instantHandoff);
      setNotifyWeekly(config.team.notifications.weeklyReport);
      initialized.current = true;
    }
  }, [config, isLoading]);

  const handleSaveWorkspace = async (event: FormEvent) => {
    event.preventDefault();

    await patchConfig((current) => ({
      ...current,
      workspace: {
        ...current.workspace,
        name: workspaceName,
        industry,
        description,
        address,
        businessHours: businessHours,
        timezone,
        language: lang,
        supportEmail,
      },
    }));

    setIsSavedWorkspace(true);
    setTimeout(() => setIsSavedWorkspace(false), 2500);
  };


  const handleInvite = (event: FormEvent) => {
    event.preventDefault();
    if (!inviteEmail) {
      return;
    }

    const nextMembers = [
      ...members,
      {
        id: Date.now().toString(),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        status: "pending" as const,
      },
    ];

    setMembers(nextMembers);
    patchConfig((current) => ({
      ...current,
      team: {
        ...current.team,
        members: nextMembers,
      },
    }));

    setInviteEmail("");
    setIsModalOpen(false);
  };

  const handleDeleteMember = (id: string) => {
    const nextMembers = members.filter((member) => member.id !== id);
    setMembers(nextMembers);
    patchConfig((current) => ({
      ...current,
      team: {
        ...current.team,
        members: nextMembers,
      },
    }));
  };

  const handleSaveNotify = (event: FormEvent) => {
    event.preventDefault();

    patchConfig((current) => ({
      ...current,
      team: {
        ...current.team,
        notifications: {
          emailDigest: notifyEmail,
          instantHandoff: notifyHandoff,
          weeklyReport: notifyWeekly,
        },
      },
    }));

    setIsSavedNotify(true);
    setTimeout(() => setIsSavedNotify(false), 2500);
  };

  const handleAddField = (e: FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    setCustomFields([
      ...customFields,
      { id: Date.now().toString(), name: newFieldName.trim(), type: newFieldType, required: newFieldRequired }
    ]);
    setNewFieldName("");
    setNewFieldRequired(false);
  };

  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setTicketCategories([
      ...ticketCategories,
      { id: Date.now().toString(), name: newCategoryName.trim(), defaultPriority: newCategoryPriority }
    ]);
    setNewCategoryName("");
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white">
          <Settings className="h-6 w-6 text-cyan-400" />
          Settings & Workspace Configuration
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Kelola konfigurasi sistem akun, manajemen agen, alur pesan, integrasi panggilan, database kontak, kuesioner, tiket, dan token API.
        </p>
      </div>

      {/* Main Settings Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        {/* Left Sidebar List of Settings Tabs */}
        <div className="space-y-6 lg:col-span-1">
          {/* Group 1: Sistem & Keamanan */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-2.5">
              Sistem & Keamanan
            </span>
            <div className="space-y-1 bg-white/[0.01] border border-white/6 rounded-xl p-1.5">
              {/* Workspace Profile */}
              <button
                onClick={() => setActiveSetting("profile")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                  activeSetting === "profile"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Workspace Profile</span>
              </button>

              {/* User Management */}
              <button
                onClick={() => setActiveSetting("users")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                  activeSetting === "users"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <User className="h-4 w-4" />
                <span>User Management</span>
              </button>

              {/* Agent Management */}
              <button
                onClick={() => setActiveSetting("agents")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                  activeSetting === "agents"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Agent Management</span>
              </button>

              {/* SLA Management */}
              <button
                onClick={() => setActiveSetting("sla")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                  activeSetting === "sla"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>SLA Management</span>
              </button>

              {/* Inbox */}
              <button
                onClick={() => setActiveSetting("inbox")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                  activeSetting === "inbox"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <Inbox className="h-4 w-4" />
                <span>Inbox</span>
              </button>

              {/* Security */}
              <button
                onClick={() => setActiveSetting("security")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                  activeSetting === "security"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>Security</span>
              </button>
            </div>
          </div>

          {/* Group 2: Fitur & Operasional */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-2.5">
              Fitur & Operasional
            </span>
            <div className="space-y-1 bg-white/[0.01] border border-white/6 rounded-xl p-1.5">
              {/* Call */}
              <button
                onClick={() => setActiveSetting("call")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                  activeSetting === "call"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-amber-400" />
                  <span>Call (Telepon)</span>
                </div>
                <Badge className="bg-cyan-500 text-slate-950 text-[8px] font-extrabold px-1.5 py-0.5 rounded">NEW</Badge>
              </button>

              {/* Contact Info */}
              <button
                onClick={() => setActiveSetting("contacts")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                  activeSetting === "contacts"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <Database className="h-4 w-4" />
                <span>Contact Info</span>
              </button>

              {/* Customer Survey */}
              <button
                onClick={() => setActiveSetting("survey")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                  activeSetting === "survey"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Customer survey</span>
              </button>

              {/* Ticket */}
              <button
                onClick={() => setActiveSetting("ticket")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                  activeSetting === "ticket"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <ListChecks className="h-4 w-4" />
                <span>Ticket</span>
              </button>

              {/* Import & export list */}
              <button
                onClick={() => setActiveSetting("logs")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                  activeSetting === "logs"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <History className="h-4 w-4" />
                <span>Import & export list</span>
              </button>
            </div>
          </div>

          {/* Group 3: Developer API Tokens Dropdown */}
          <div className="space-y-2">
            <button
              onClick={() => setIsApiDropdownOpen(!isApiDropdownOpen)}
              className="w-full flex items-center justify-between px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 text-left outline-none"
            >
              <span>API Token</span>
              <ChevronDown className={`h-3 w-3 transform transition ${isApiDropdownOpen ? "" : "-rotate-90"}`} />
            </button>
            {isApiDropdownOpen && (
              <div className="space-y-1 bg-white/[0.01] border border-white/6 rounded-xl p-1.5">
                {/* Omnichannel Token */}
                <button
                  onClick={() => setActiveSetting("token_omni")}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                    activeSetting === "token_omni"
                      ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                      : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                  }`}
                >
                  <Link2 className="h-4 w-4 text-cyan-400" />
                  <span>Omnichannel</span>
                </button>

                {/* Chatbot Token */}
                <button
                  onClick={() => setActiveSetting("token_bot")}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition ${
                    activeSetting === "token_bot"
                      ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                      : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                  }`}
                >
                  <FileCode className="h-4 w-4 text-emerald-400" />
                  <span>Chatbot</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Settings Detail Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* ============================================== */}
          {/* TAB 1: WORKSPACE PROFILE */}
          {/* ============================================== */}
          {activeSetting === "profile" && (
            <div className="space-y-6">
              {/* Workspace Profile Form */}
              <form onSubmit={handleSaveWorkspace} className="glass-panel max-w-3xl space-y-4 rounded-xl p-6 border-white/8">
                <div className="border-b border-white/8 pb-4 mb-4">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <Building2 className="h-4.5 w-4.5" />
                    Workspace Profile Settings
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Ubah identitas profil bengkel, deskripsi, alamat, dan jam operasional bisnis Anda.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Nama Workspace</label>
                    <Input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} className="h-10 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Industri</label>
                    <Input value={industry} onChange={(event) => setIndustry(event.target.value)} className="h-10 text-xs" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email Support</label>
                  <Input type="email" value={supportEmail} onChange={(event) => setSupportEmail(event.target.value)} className="h-10 text-xs" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Deskripsi Bisnis</label>
                  <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="text-xs" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Alamat Lengkap</label>
                  <Textarea rows={2} value={address} onChange={(event) => setAddress(event.target.value)} className="text-xs" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Jam Operasional</label>
                  <Input value={businessHours} onChange={(event) => setWorkspaceBusinessHours(event.target.value)} className="h-10 text-xs" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Zona Waktu</label>
                    <Select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                      <option value="Asia/Jakarta">WIB - Asia/Jakarta</option>
                      <option value="Asia/Makassar">WITA - Asia/Makassar</option>
                      <option value="Asia/Jayapura">WIT - Asia/Jayapura</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Bahasa Default Sistem</label>
                    <Select value={lang} onChange={(event) => setLang(event.target.value)}>
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English</option>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/8">
                  {isSavedWorkspace ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 animate-fade-in">
                      <Check className="h-4 w-4" /> Workspace Profile berhasil diperbarui!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" className="px-5">
                    <Save className="mr-1.5 h-4 w-4" /> Simpan Profil
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================== */}
          {/* TAB 1.5: USER MANAGEMENT */}
          {/* ============================================== */}
          {activeSetting === "users" && (
            <UserManagementTab />
          )}

          {/* ============================================== */}
          {/* TAB 2: AGENT MANAGEMENT */}
          {/* ============================================== */}
          {activeSetting === "agents" && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-cyan-400" />
                  Agent Management
                </h2>
                <p className="text-xs text-slate-400 mt-1">Atur divisi, alokasi chat, broadcast, workload, idle rule, dan contact masking untuk semua agen.</p>
              </div>

              {/* Inner Tabs */}
              <div className="space-y-5">
                {/* Tab Bar */}
                <div className="border-b border-white/10 overflow-x-auto">
                  <nav className="flex gap-1">
                    {AGENT_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setAgentTab(tab.id)}
                        className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                          agentTab === tab.id
                            ? "border-cyan-400 text-cyan-400"
                            : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* ─── Division ─── */}
                {agentTab === "division" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">Division</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Kelompokkan agen ke dalam divisi untuk memudahkan distribusi chat.</p>
                      </div>
                      <Button onClick={() => { setShowDivModal(true); }} className="gap-2 text-xs px-4 h-9">
                        <PlusCircle className="h-3.5 w-3.5" />
                        Create Division
                      </Button>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-sm text-slate-300">
                        <thead className="bg-white/[0.02] text-[10px] uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Division Name</th>
                            <th className="px-4 py-3 text-left font-semibold">Description</th>
                            <th className="px-4 py-3 text-left font-semibold">Agents</th>
                            <th className="px-4 py-3 text-left font-semibold">Supervisor</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                            <th className="px-4 py-3 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {divisions.map((div) => (
                            <tr key={div.id} className="hover:bg-white/[0.01]">
                              <td className="px-4 py-3 font-semibold text-white">{div.name}</td>
                              <td className="px-4 py-3 text-slate-400 text-xs max-w-[180px] truncate">{div.description}</td>
                              <td className="px-4 py-3">{div.agents} agents</td>
                              <td className="px-4 py-3 text-slate-400">{div.supervisor}</td>
                              <td className="px-4 py-3">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{div.status}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => setDivisions(divisions.filter((d) => d.id !== div.id))}
                                  className="text-slate-500 hover:text-red-400 transition p-1 rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {showDivModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-xl border border-white/10 bg-[var(--color-surface)] p-6 space-y-4 shadow-2xl">
                          <h4 className="text-base font-bold text-white">Create Division</h4>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300">Division Name</label>
                              <Input placeholder="Customer Service" value={newDivName} onChange={(e) => setNewDivName(e.target.value)} className="h-9 text-sm bg-black/20" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300">Description</label>
                              <Input placeholder="Deskripsi divisi..." value={newDivDesc} onChange={(e) => setNewDivDesc(e.target.value)} className="h-9 text-sm bg-black/20" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300">Supervisor</label>
                              <Input placeholder="Nama supervisor..." value={newDivSupervisor} onChange={(e) => setNewDivSupervisor(e.target.value)} className="h-9 text-sm bg-black/20" />
                            </div>
                          </div>
                          <div className="flex gap-3 justify-end pt-2">
                            <Button variant="secondary" onClick={() => setShowDivModal(false)} className="text-slate-400 bg-transparent border-transparent text-xs h-9">Cancel</Button>
                            <Button className="text-xs h-9" onClick={() => {
                              if (!newDivName) return;
                              setDivisions([...divisions, { id: "div_" + Date.now(), name: newDivName, description: newDivDesc, agents: 0, supervisor: newDivSupervisor, status: "Active" }]);
                              setNewDivName(""); setNewDivDesc(""); setNewDivSupervisor(""); setShowDivModal(false);
                            }}>Save Division</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                    {/* ─── Agent Allocation ─── */}
                    {agentTab === "allocation" && (
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-sm font-bold text-white">Agent Allocation</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Atur cara sistem mendistribusikan chat masuk ke agen yang tersedia.</p>
                        </div>
                        <div className="space-y-3">
                          {[
                            { label: "Allow agents to takeover unassigned chats", value: canTakeover, set: (v: boolean) => setCanTakeover(v) },
                            { label: "Allow agents to assign chat to another agent", value: canAssign, set: (v: boolean) => setCanAssign(v) },
                          ].map(({ label, value, set }) => (
                            <div key={label} className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/[0.02]">
                              <span className="text-sm text-slate-300">{label}</span>
                              <AgentToggle checked={value} onChange={set} />
                            </div>
                          ))}
                        </div>

                        <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02] space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-white">Auto Agent Allocation</div>
                              <div className="text-xs text-slate-500">Distribusikan chat otomatis ke agen online.</div>
                            </div>
                            <AgentToggle checked={autoAlloc} onChange={(v) => setAutoAlloc(v)} />
                          </div>
                          {autoAlloc && (
                            <div className="pt-2 border-t border-white/10">
                              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Allocation Method</label>
                              <select
                                className="h-9 w-full max-w-xs rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                value={allocMethod}
                                onChange={(e) => setAllocMethod(e.target.value)}
                              >
                                {["Round Robin", "Least Active Agent", "Least Workload", "Random Available Agent", "Priority Based"].map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02] space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-white">Custom Agent Allocation (Webhook)</div>
                              <div className="text-xs text-slate-500">Gunakan logika custom via webhook eksternal.</div>
                            </div>
                            <AgentToggle checked={customAlloc} onChange={(v) => setCustomAlloc(v)} />
                          </div>
                          {customAlloc && (
                            <div className="pt-2 border-t border-white/10 space-y-3">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300">Webhook URL</label>
                                <Input value={webhookAllocUrl} onChange={(e) => setWebhookAllocUrl(e.target.value)} className="h-9 text-xs bg-black/30 font-mono" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300">Webhook Secret</label>
                                <div className="relative max-w-sm">
                                  <Input type={showAllocSecret ? "text" : "password"} value={webhookAllocSecret} onChange={(e) => setWebhookAllocSecret(e.target.value)} className="h-9 text-xs bg-black/30 font-mono pr-10" />
                                  <button type="button" onClick={() => setShowAllocSecret(!showAllocSecret)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-slate-300">Timeout (seconds)</label>
                                  <Input type="number" value={allocTimeout} onChange={(e) => setAllocTimeout(Number(e.target.value))} className="h-9 text-xs bg-black/30" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-slate-300">Retry Attempt</label>
                                  <Input type="number" value={allocRetry} onChange={(e) => setAllocRetry(Number(e.target.value))} className="h-9 text-xs bg-black/30" />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300">Fallback Allocation</label>
                                <select
                                  className="h-9 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                  value={allocFallback}
                                  onChange={(e) => setAllocFallback(e.target.value)}
                                >
                                  {["Assign to any available agent", "Assign to default team", "Keep as unassigned", "Assign to supervisor"].map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <Button onClick={() => { setIsSavedAgent(true); setTimeout(() => setIsSavedAgent(false), 2500); }} className="gap-2 text-xs h-9">
                            {isSavedAgent ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                            {isSavedAgent ? "Tersimpan!" : "Save Settings"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* ─── Broadcast ─── */}
                    {agentTab === "broadcast" && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-bold text-white">Broadcast Permission</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Atur hak akses setiap role dalam membuat dan mengirim broadcast.</p>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-white/10">
                          <table className="w-full text-sm">
                            <thead className="bg-white/[0.02] text-[10px] uppercase text-slate-500">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold">Role</th>
                                <th className="px-4 py-3 text-center font-semibold">Create Broadcast</th>
                                <th className="px-4 py-3 text-center font-semibold">Send Broadcast</th>
                                <th className="px-4 py-3 text-center font-semibold">Need Approval</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.05]">
                              {BROADCAST_ROLES.map((role) => (
                                <tr key={role} className="hover:bg-white/[0.01]">
                                  <td className="px-4 py-3 font-semibold text-slate-200">{role}</td>
                                  {(["create", "send", "approve"] as const).map((field) => (
                                    <td key={field} className="px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={broadcastPerms[role][field]}
                                        onChange={() => setBroadcastPerms({ ...broadcastPerms, [role]: { ...broadcastPerms[role], [field]: !broadcastPerms[role][field] } })}
                                        className="h-4 w-4 accent-cyan-400 cursor-pointer"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <Button onClick={() => { setIsSavedAgent(true); setTimeout(() => setIsSavedAgent(false), 2500); }} className="gap-2 text-xs h-9">
                            {isSavedAgent ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                            {isSavedAgent ? "Tersimpan!" : "Save Settings"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* ─── Workload ─── */}
                    {agentTab === "workload" && (
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-sm font-bold text-white">Workload Management</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Batasi jumlah chat aktif per agen untuk mencegah overload.</p>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/[0.02]">
                          <div>
                            <div className="text-sm font-semibold text-white">Enable Workload Limit</div>
                            <div className="text-xs text-slate-500">Aktifkan pembatasan jumlah chat per agen.</div>
                          </div>
                          <AgentToggle checked={workloadEnabled} onChange={(v) => setWorkloadEnabled(v)} />
                        </div>
                        {workloadEnabled && (
                          <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300">Max Active Chats (Default)</label>
                                <div className="flex items-center gap-2">
                                  <Input type="number" value={workloadDefaultMax} onChange={(e) => setWorkloadDefaultMax(Number(e.target.value))} className="h-9 text-sm bg-black/20 max-w-[100px]" />
                                  <span className="text-xs text-slate-400">chats</span>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300">Max Pending Chats (Default)</label>
                                <div className="flex items-center gap-2">
                                  <Input type="number" value={workloadDefaultPending} onChange={(e) => setWorkloadDefaultPending(Number(e.target.value))} className="h-9 text-sm bg-black/20 max-w-[100px]" />
                                  <span className="text-xs text-slate-400">chats</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Workload Per Division</div>
                              <div className="overflow-x-auto rounded-lg border border-white/10">
                                <table className="w-full text-sm">
                                  <thead className="bg-white/[0.02] text-[10px] uppercase text-slate-500">
                                    <tr>
                                      <th className="px-4 py-2.5 text-left font-semibold">Division</th>
                                      <th className="px-4 py-2.5 text-left font-semibold">Max Active</th>
                                      <th className="px-4 py-2.5 text-left font-semibold">Max Pending</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/[0.05]">
                                    {workloadByDiv.map((row, idx) => (
                                      <tr key={idx}>
                                        <td className="px-4 py-2.5 font-medium text-slate-200">{row.division}</td>
                                        <td className="px-4 py-2.5">
                                          <Input type="number" value={row.maxActive} onChange={(e) => { const n = [...workloadByDiv]; n[idx] = { ...n[idx], maxActive: Number(e.target.value) }; setWorkloadByDiv(n); }} className="h-8 text-xs bg-black/30 max-w-[80px]" />
                                        </td>
                                        <td className="px-4 py-2.5">
                                          <Input type="number" value={row.maxPending} onChange={(e) => { const n = [...workloadByDiv]; n[idx] = { ...n[idx], maxPending: Number(e.target.value) }; setWorkloadByDiv(n); }} className="h-8 text-xs bg-black/30 max-w-[80px]" />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-slate-300 block">Overflow Rule</label>
                              <select
                                className="h-9 w-full max-w-xs rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                value={overflowRule}
                                onChange={(e) => setOverflowRule(e.target.value)}
                              >
                                {["Keep in queue", "Assign to supervisor", "Assign to overflow team", "Send waiting message to customer", "Trigger bot response"].map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              {overflowRule === "Send waiting message to customer" && (
                                <textarea
                                  value={waitingMsg}
                                  onChange={(e) => setWaitingMsg(e.target.value)}
                                  className="w-full mt-2 min-h-[80px] rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                />
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 pt-2">
                          <Button onClick={() => { setIsSavedAgent(true); setTimeout(() => setIsSavedAgent(false), 2500); }} className="gap-2 text-xs h-9">
                            {isSavedAgent ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                            {isSavedAgent ? "Tersimpan!" : "Save Settings"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* ─── Idle Rule ─── */}
                    {agentTab === "idle_rule" && (
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-sm font-bold text-white">Idle Rule</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Atur status agen otomatis jika tidak aktif dalam periode tertentu.</p>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/[0.02]">
                          <div>
                            <div className="text-sm font-semibold text-white">Enable Agent Idle Rule</div>
                            <div className="text-xs text-slate-500">Status agen berubah otomatis saat idle.</div>
                          </div>
                          <AgentToggle checked={idleEnabled} onChange={(v) => setIdleEnabled(v)} />
                        </div>
                        {idleEnabled && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300">Idle Time Threshold</label>
                                <div className="flex items-center gap-2">
                                  <Input type="number" value={idleThreshold} onChange={(e) => setIdleThreshold(Number(e.target.value))} className="h-9 text-sm bg-black/20 max-w-[80px]" />
                                  <select className="h-9 rounded-md border border-white/10 bg-black/20 px-2 text-sm text-white focus:outline-none" value={idleUnit} onChange={(e) => setIdleUnit(e.target.value)}>
                                    <option value="minutes">minutes</option>
                                    <option value="hours">hours</option>
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300">Idle Status</label>
                                <select className="h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white focus:outline-none" value={idleStatus} onChange={(e) => setIdleStatus(e.target.value)}>
                                  {["Away", "Busy", "Offline", "Inactive"].map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                            </div>
                            {[
                              { label: "Auto Offline setelah idle terlalu lama", value: autoOffline, set: (v: boolean) => setAutoOffline(v) },
                              { label: "Notify Supervisor saat agen idle", value: notifySupervisor, set: (v: boolean) => setNotifySupervisor(v) },
                            ].map(({ label, value, set }) => (
                              <div key={label} className="flex items-center justify-between p-3.5 rounded-lg border border-white/10 bg-white/[0.02]">
                                <span className="text-sm text-slate-300">{label}</span>
                                <AgentToggle checked={value} onChange={set} />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 pt-2">
                          <Button onClick={() => { setIsSavedAgent(true); setTimeout(() => setIsSavedAgent(false), 2500); }} className="gap-2 text-xs h-9">
                            {isSavedAgent ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                            {isSavedAgent ? "Tersimpan!" : "Save Settings"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* ─── Contact Masking ─── */}
                    {agentTab === "masking" && (
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-sm font-bold text-white">Contact Masking</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Sembunyikan data sensitif pelanggan dari layar agen untuk keamanan data.</p>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/[0.02]">
                          <div>
                            <div className="text-sm font-semibold text-white">Enable Contact Masking</div>
                            <div className="text-xs text-slate-500">Data pelanggan tertentu akan disembunyikan dari agen.</div>
                          </div>
                          <AgentToggle checked={maskEnabled} onChange={(v) => setMaskEnabled(v)} />
                        </div>
                        {maskEnabled && (
                          <div className="space-y-5">
                            <div>
                              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Fields to Mask</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {MASKABLE_FIELDS.map(({ key, label, example }) => (
                                  <div key={key} onClick={() => toggleArrayField(key, maskedFields, setMaskedFields)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${maskedFields.includes(key) ? "border-cyan-500/30 bg-cyan-950/20" : "border-white/10 bg-white/[0.01] hover:bg-white/[0.02]"}`}>
                                    <div>
                                      <div className="text-sm font-semibold text-slate-200">{label}</div>
                                      <div className="text-xs text-slate-500 font-mono">{example}</div>
                                    </div>
                                    <input type="checkbox" readOnly checked={maskedFields.includes(key)} className="h-4 w-4 accent-cyan-400" />
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Roles That Can View Full Data</div>
                              <div className="flex flex-wrap gap-2">
                                {["Owner", "Admin", "Supervisor", "Sales", "Agent"].map((role) => (
                                  <button
                                    key={role}
                                    onClick={() => toggleArrayField(role, fullViewRoles, setFullViewRoles)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${fullViewRoles.includes(role) ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "border-white/10 text-slate-400 hover:text-slate-200"}`}
                                  >
                                    {role}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="p-3 rounded-lg border border-white/10 bg-white/[0.01] text-xs">
                              <div className="font-semibold text-slate-300 mb-1">Agent View Preview</div>
                              <div className="space-y-1 text-slate-500 font-mono">
                                {MASKABLE_FIELDS.filter((f) => maskedFields.includes(f.key)).map((f) => (
                                  <div key={f.key}>{f.label}: <span className="text-slate-400">{f.example}</span></div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 pt-2">
                          <Button onClick={() => { setIsSavedAgent(true); setTimeout(() => setIsSavedAgent(false), 2500); }} className="gap-2 text-xs h-9">
                            {isSavedAgent ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                            {isSavedAgent ? "Tersimpan!" : "Save Settings"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
            </div>
          )}

          {/* ============================================== */}
          {/* TAB 3: SLA MANAGEMENT */}
          {/* ============================================== */}
          {activeSetting === "sla" && (
            <Card className="glass-panel p-6 max-w-3xl border-white/8">
              <div className="border-b border-white/8 pb-4 mb-5">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <Clock className="h-4.5 w-4.5" />
                  SLA Management
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Tempat untuk menyetel Service Level Agreement (target waktu respons agen) guna memastikan pesan pelanggan dibalas tepat waktu.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setIsSavedSla(true);
                setTimeout(() => setIsSavedSla(false), 2000);
              }} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Target First Response SLA (Menit)</label>
                    <Input
                      type="number"
                      value={firstResponseMinutes}
                      onChange={(e) => setFirstResponseMinutes(Number(e.target.value))}
                      className="h-10 text-xs"
                    />
                    <p className="text-[9px] text-slate-500">Maksimal jeda waktu balas untuk pesan pertama pelanggan baru.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Target Follow-up Response SLA (Menit)</label>
                    <Input
                      type="number"
                      value={followupResponseMinutes}
                      onChange={(e) => setFollowupResponseMinutes(Number(e.target.value))}
                      className="h-10 text-xs"
                    />
                    <p className="text-[9px] text-slate-500">Jeda waktu respons maksimal untuk pesan-pesan balasan berikutnya.</p>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-white/8 bg-white/[0.02] p-4 text-xs">
                  <span className="font-bold text-slate-200 uppercase tracking-wider block mb-2">Automasi Pelanggaran SLA</span>
                  <p className="text-slate-400 leading-relaxed mb-3">Jika agen tidak merespons obrolan dalam batas target SLA di atas, sistem akan otomatis melakukan tindakan berikut:</p>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-300">
                    <li>Mengirimkan alert bertanda merah di daftar Unified Inbox.</li>
                    <li>Memicu notifikasi handoff instan ke email/akun Admin utama.</li>
                    <li>Meningkatkan prioritas tiket keluhan pelanggan menjadi <strong className="text-red-400">High / Urgent</strong>.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between border-t border-white/8 pt-4">
                  {isSavedSla ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Check className="h-4 w-4" /> Pengaturan SLA disimpan!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit">Simpan SLA</Button>
                </div>
              </form>
            </Card>
          )}

          {/* ============================================== */}
          {/* TAB 4: INBOX */}
          {/* ============================================== */}
          {activeSetting === "inbox" && (
            <InboxSettings />
          )}

          {/* ============================================== */}
          {/* TAB 5: SECURITY */}
          {/* ============================================== */}
          {activeSetting === "security" && (
            <div className="max-w-3xl space-y-6">
              {/* Security Preferences Form */}
              <form onSubmit={handleSaveNotify} className="glass-panel space-y-5 rounded-xl p-6 border-white/8 bg-white/[0.01]">
                <div className="border-b border-white/8 pb-4 mb-4">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <Shield className="h-4.5 w-4.5" />
                    Security & Account Privacy
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Pengaturan privasi dan keamanan akun tingkat lanjut, seperti pembatasan IP akses atau metode autentikasi.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">IP Whitelist Restriksi (Akses Terbatas)</label>
                    <Input
                      placeholder="Masukkan alamat IP yang diizinkan (contoh: 192.168.1.1, satu per baris)"
                      className="h-10 text-xs"
                    />
                    <p className="text-[9px] text-slate-500">Membatasi akses Admin/Operator login dashboard hanya dari IP kantor Johan Garage yang terdaftar.</p>
                  </div>

                  <label className="flex items-start gap-3 text-xs leading-normal text-slate-300 cursor-pointer rounded-xl border border-white/8 bg-white/[0.03] p-4">
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(event) => setNotifyEmail(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                    />
                    <span>
                      <span className="block font-bold text-white mb-0.5">Autentikasi Dua Faktor (2FA)</span>
                      Mewajibkan kode OTP email untuk login akun baru untuk keamanan tambahan.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between border-t border-white/8 pt-4">
                  {isSavedNotify ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Check className="h-4 w-4" /> Setelan keamanan disimpan!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit">Simpan Setelan Keamanan</Button>
                </div>
              </form>

              {/* Active Sessions Card */}
              <div className="glass-panel space-y-4 rounded-xl p-6 border-white/8 bg-white/[0.01]">
                <div className="border-b border-white/8 pb-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Sesi Aktif & Log Akses</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pantau sesi browser yang sedang masuk ke akun Omnichannel Anda saat ini.</p>
                </div>
                <div className="divide-y divide-white/6">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between py-3 text-xs">
                      <div>
                        <span className="block font-semibold text-white">{session.device}</span>
                        <span className="text-[10px] text-slate-500">IP: {session.ip} • Aktif: {session.lastActive}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.isCurrent ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-[9px]">Sesi Ini</Badge>
                        ) : (
                          <button
                            onClick={() => setActiveSessions(activeSessions.filter(s => s.id !== session.id))}
                            className="text-[10px] font-bold text-red-400 hover:text-red-300"
                          >
                            Putuskan
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================== */}
          {/* TAB 6: CALL (NEW) */}
          {/* ============================================== */}
          {activeSetting === "call" && (
            <Card className="glass-panel p-6 max-w-3xl border-white/8 space-y-6">
              <div className="border-b border-white/8 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <Phone className="h-4.5 w-4.5 text-amber-400" />
                    SIP Cloud Call Center Configuration
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Fitur terbaru untuk melakukan pengaturan saluran panggilan suara atau telepon terintegrasi (VoIP).</p>
                </div>
                <Badge className="bg-cyan-500 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded">NEW FEATURE</Badge>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setIsSavedCall(true);
                setTimeout(() => setIsSavedCall(false), 2000);
              }} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">SIP Call Provider</label>
                    <Select value={sipProvider} onChange={(e) => setSipProvider(e.target.value)}>
                      <option value="twilio">Twilio Cloud Voice</option>
                      <option value="vonage">Vonage SIP Trunk</option>
                      <option value="3cx">3CX IP-PBX System</option>
                      <option value="custom">Custom SIP Server (Lokal)</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">SIP Server Hostname</label>
                    <Input
                      value={sipServer}
                      onChange={(e) => setSipServer(e.target.value)}
                      placeholder="sip.domain.com"
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">SIP Username</label>
                    <Input
                      value={sipUsername}
                      onChange={(e) => setSipUsername(e.target.value)}
                      className="h-10 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">SIP Auth Password</label>
                    <Input
                      type="password"
                      value={sipPassword}
                      onChange={(e) => setSipPassword(e.target.value)}
                      className="h-10 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Outbound Caller ID (Nomor Telepon VoIP)</label>
                    <Input
                      value={outboundCallerId}
                      onChange={(e) => setOutboundCallerId(e.target.value)}
                      placeholder="+628..."
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Aturan & Alur Panggilan</span>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={logCallsToCrm}
                        onChange={(e) => setLogCallsToCrm(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                      />
                      <span>
                        <span className="block font-bold text-white mb-0.5">Buat Kontak Baru Otomatis dari Telepon</span>
                        Jika penelepon tidak terdaftar di CRM, buat profil kontak database baru secara otomatis.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recordCalls}
                        onChange={(e) => setRecordCalls(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                      />
                      <span>
                        <span className="block font-bold text-white mb-0.5">Rekam Percakapan Panggilan</span>
                        Aktifkan rekaman suara otomatis untuk seluruh panggilan masuk/keluar guna kebutuhan evaluasi.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/8 pt-4">
                  {isSavedCall ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Check className="h-4 w-4" /> Kredensial SIP disimpan!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit">Hubungkan Saluran Telepon</Button>
                </div>
              </form>
            </Card>
          )}

          {/* ============================================== */}
          {/* TAB 7: CONTACT INFO */}
          {/* ============================================== */}
          {activeSetting === "contacts" && (
            <Card className="glass-panel p-6 max-w-3xl border-white/8">
              <div className="border-b border-white/8 pb-4 mb-5">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <Database className="h-4.5 w-4.5" />
                  Contact Info Custom Database Fields
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Pengaturan format dan parameter bidang data (fields) yang tersimpan pada menu database pelanggan.</p>
              </div>

              <div className="space-y-6">
                {/* Standard Fields (Non-deletable default) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bidang Data Standar (Sistem)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {["Nama Lengkap", "Nomor Telepon", "Email", "Preferred Channel", "Owner", "Company"].map((standard) => (
                      <div key={standard} className="flex items-center justify-between p-3 rounded-lg border border-white/6 bg-white/[0.005]">
                        <span className="font-semibold text-slate-400">{standard}</span>
                        <Badge className="bg-slate-800 text-slate-500 border-none text-[8px] font-extrabold">SYSTEM</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Existing Custom Fields */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bidang Data Kustom (CRM)</h4>
                  <div className="space-y-2">
                    {customFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-3 rounded-lg border border-white/6 bg-white/[0.01] text-xs">
                        <span className="font-semibold text-white">{field.name}</span>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-cyan-950 text-cyan-300 border-cyan-400/20">{field.type}</Badge>
                          {field.required ? (
                            <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/10 px-2 py-0.5 rounded font-bold">Wajib</span>
                          ) : (
                            <span className="text-[9px] bg-slate-500/10 text-slate-400 border border-slate-500/10 px-2 py-0.5 rounded">Opsional</span>
                          )}
                          <button
                            onClick={() => setCustomFields(customFields.filter(f => f.id !== field.id))}
                            className="text-slate-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add new custom field form */}
                <form onSubmit={handleAddField} className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">Tambah Bidang Data Baru</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-300">Nama Field</label>
                      <Input
                        placeholder="Contoh: Nomor Rangka"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        className="h-10 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-300">Tipe Data</label>
                      <Select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}>
                        <option value="Text">Teks Singkat</option>
                        <option value="Number">Angka (Numeric)</option>
                        <option value="Date">Tanggal (Date)</option>
                      </Select>
                    </div>
                    <div className="flex items-center h-10 pb-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newFieldRequired}
                          onChange={(e) => setNewFieldRequired(e.target.checked)}
                          className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                        />
                        Wajib Diisi (Required)
                      </label>
                    </div>
                  </div>
                  <Button type="submit" className="text-xs py-2 h-9">
                    <Plus className="mr-1.5 h-4 w-4" /> Tambah Bidang
                  </Button>
                </form>
              </div>
            </Card>
          )}

          {/* ============================================== */}
          {/* TAB 8: CUSTOMER SURVEY */}
          {/* ============================================== */}
          {activeSetting === "survey" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">
              {/* CSAT settings form */}
              <Card className="glass-panel p-6 lg:col-span-2 border-white/8 h-fit">
                <div className="border-b border-white/8 pb-4 mb-5">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <SlidersHorizontal className="h-4.5 w-4.5" />
                    Customer Satisfaction Survey (CSAT)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Untuk merancang dan mengaktifkan survei kepuasan pelanggan (CSAT) setelah sesi obrolan selesai ditangani.</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  setIsSavedSurvey(true);
                  setTimeout(() => setIsSavedSurvey(false), 2000);
                }} className="space-y-5">
                  <label className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={csatEnabled}
                      onChange={(e) => setCsatEnabled(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                    />
                    <span>
                      <span className="block font-bold text-white mb-0.5">Kirim CSAT Otomatis Setelah Chat Selesai</span>
                      Sistem akan mengirimkan kuesioner singkat saat agen menutup sesi percakapan obrolan secara resmi.
                    </span>
                  </label>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Skala Penilaian</label>
                    <Select value={csatScale} onChange={(e) => setCsatScale(e.target.value)}>
                      <option value="5">1 - 5 Bintang (Sangat Puas)</option>
                      <option value="10">1 - 10 Angka Penilaian</option>
                      <option value="yes_no">Yes / No (Suka / Tidak Suka)</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Teks Pertanyaan Survei</label>
                    <Textarea
                      value={csatQuestion}
                      onChange={(e) => setCsatQuestion(e.target.value)}
                      rows={3}
                      className="text-xs leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-white/8 pt-4">
                    {isSavedSurvey ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <Check className="h-4 w-4" /> Desain CSAT disimpan!
                      </span>
                    ) : (
                      <div />
                    )}
                    <Button type="submit">Simpan Kuesioner</Button>
                  </div>
                </form>
              </Card>

              {/* Interactive Live Preview */}
              <div className="lg:col-span-1 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-1">
                  Preview Tampilan Chat
                </span>
                <div className="border border-white/8 bg-[#020512] rounded-2xl p-4 min-h-[300px] flex flex-col justify-end relative overflow-hidden">
                  <div className="absolute top-3 left-4 right-4 flex items-center justify-between border-b border-white/6 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-300">Balesin Chat Preview</span>
                    </div>
                  </div>

                  {csatEnabled ? (
                    <div className="space-y-3 mt-10">
                      {/* Incoming Customer bubble */}
                      <div className="flex justify-end">
                        <div className="bg-cyan-600 text-white rounded-2xl rounded-tr-none px-3.5 py-2 text-[11px] max-w-[85%] shadow-sm">
                          Terima kasih atas bantuannya!
                        </div>
                      </div>

                      {/* Agent close notification */}
                      <div className="text-center">
                        <span className="inline-block bg-slate-900 border border-white/6 rounded-full px-3 py-0.5 text-[8px] text-slate-400 uppercase font-semibold">
                          Sesi ditutup oleh operator
                        </span>
                      </div>

                      {/* CSAT Survey Bubble */}
                      <div className="flex justify-start">
                        <div className="bg-white/4 border border-white/8 text-slate-200 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-[11px] max-w-[90%] shadow-lg space-y-3">
                          <p>{csatQuestion}</p>
                          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 border-t border-white/6">
                            {csatScale === "5" && (
                              [1, 2, 3, 4, 5].map(star => (
                                <button key={star} type="button" className="h-6 w-6 rounded bg-[#0a0e1c] border border-cyan-400/20 text-cyan-300 text-[10px] font-bold hover:bg-cyan-500 hover:text-slate-950 transition">
                                  ⭐ {star}
                                </button>
                              ))
                            )}
                            {csatScale === "10" && (
                              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <button key={num} type="button" className="h-5 w-5 rounded bg-[#0a0e1c] border border-cyan-400/20 text-cyan-300 text-[9px] font-bold hover:bg-cyan-500 hover:text-slate-950 transition">
                                  {num}
                                </button>
                              ))
                            )}
                            {csatScale === "yes_no" && (
                              <>
                                <button type="button" className="px-3 py-1 rounded bg-[#0a0e1c] border border-emerald-400/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500 hover:text-slate-950 transition">
                                  👍 Suka (Yes)
                                </button>
                                <button type="button" className="px-3 py-1 rounded bg-[#0a0e1c] border border-red-400/20 text-red-400 text-[10px] font-bold hover:bg-red-500 hover:text-slate-950 transition">
                                  👎 Tidak Suka (No)
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      Aktifkan kuesioner di sebelah untuk melihat simulasi.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================== */}
          {/* TAB 9: TICKET */}
          {/* ============================================== */}
          {activeSetting === "ticket" && (
            <Card className="glass-panel p-6 max-w-3xl border-white/8 space-y-6">
              <div className="border-b border-white/8 pb-4 mb-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <ListChecks className="h-4.5 w-4.5" />
                  Ticket Categories & Automations
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Pengaturan kategori, status, dan otomatisasi pembuatan tiket dari keluhan pelanggan.</p>
              </div>

              {/* Category list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Kategori Tiket Keluhan Aktif</h4>
                <div className="space-y-2">
                  {ticketCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-white/6 bg-white/[0.01] text-xs">
                      <span className="font-semibold text-white">{cat.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400">Priority Default: <strong>{cat.defaultPriority}</strong></span>
                        <button
                          onClick={() => setTicketCategories(ticketCategories.filter(c => c.id !== cat.id))}
                          className="text-slate-500 hover:text-red-450 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add category form */}
              <form onSubmit={handleAddCategory} className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">Tambah Kategori Keluhan Baru</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-300">Nama Kategori</label>
                    <Input
                      placeholder="Contoh: Kelistrikan Motor"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="h-10 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-300">Priority Level Default</label>
                    <Select value={newCategoryPriority} onChange={(e) => setNewCategoryPriority(e.target.value)}>
                      <option value="Low">Low (Rendah)</option>
                      <option value="Medium">Medium (Sedang)</option>
                      <option value="High">High (Tinggi)</option>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="text-xs py-2 h-9">
                  <Plus className="mr-1.5 h-4 w-4" /> Tambah Kategori
                </Button>
              </form>

              {/* Ticket Automation Settings */}
              <form onSubmit={(e) => {
                e.preventDefault();
                setIsSavedTicketAutomation(true);
                setTimeout(() => setIsSavedTicketAutomation(false), 2000);
              }} className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4 pt-4">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">Otomatisasi Tiket Keluhan</span>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCreateTicket}
                      onChange={(e) => setAutoCreateTicket(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                    />
                    <span>
                      <span className="block font-bold text-white mb-0.5">Buat Tiket Keluhan Otomatis Saat Handoff</span>
                      Sistem akan membuat tiket baru secara otomatis ketika chat dialihkan dari asisten AI ke operator manusia.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticketEscalationWarning}
                      onChange={(e) => setTicketEscalationWarning(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                    />
                    <span>
                      <span className="block font-bold text-white mb-0.5">Kirim Alert Peringatan SLA Eskalasi</span>
                      Ingatkan supervisor / admin utama jika ada tiket terbuka yang tidak ditangani lebih dari 2 jam.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between border-t border-white/8 pt-4">
                  {isSavedTicketAutomation ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Check className="h-4 w-4" /> Otomatisasi tiket disimpan!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" className="text-xs py-2 h-9">
                    Simpan Otomatisasi Tiket
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* ============================================== */}
          {/* TAB 10: IMPORT & EXPORT LIST */}
          {/* ============================================== */}
          {activeSetting === "logs" && (
            <Card className="glass-panel p-6 max-w-3xl border-white/8">
              <div className="border-b border-white/8 pb-4 mb-5 flex justify-between items-center">
                <div>
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <History className="h-4.5 w-4.5" />
                    Import & Export Activity Logs
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Menu log untuk memantau proses pengunggahan atau pengunduhan data massal yang dilakukan di dalam sistem.</p>
                </div>
                <Button className="bg-[#0a0e1c] border border-white/8 text-xs text-slate-300 hover:text-white h-9 px-3">
                  Unduh Templat Kontak CSV
                </Button>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-white/8 overflow-hidden bg-[#04091a]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/6 text-slate-300 uppercase tracking-wider text-[9px] font-bold">
                      <tr>
                        <th className="p-3">Nama Aktivitas</th>
                        <th className="p-3">Pelaksana</th>
                        <th className="p-3">Tanggal & Waktu</th>
                        <th className="p-3">Status Log</th>
                        <th className="p-3">Ukuran File</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/6 text-slate-400">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.01]">
                          <td className="p-3 font-semibold text-white">{log.type}</td>
                          <td className="p-3">{log.user}</td>
                          <td className="p-3">{log.date}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/10">
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3">{log.size}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* ============================================== */}
          {/* TAB 11: OMNICHANNEL API TOKEN */}
          {/* ============================================== */}
          {activeSetting === "token_omni" && (
            <Card className="glass-panel p-6 max-w-3xl border-white/8">
              <div className="flex items-center justify-between border-b border-white/8 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/30 p-3 text-cyan-300">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">Omnichannel API Tokens</h2>
                    <p className="text-xs text-slate-400">Halaman yang digunakan untuk membuat kode akses (Token dan Refresh token) guna mengizinkan aplikasi eksternal terhubung ke akun Omnichannel Anda.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-300">Client ID (Public ID)</label>
                    <Input value={omniClientId} readOnly className="h-10 text-xs font-mono bg-white/2 cursor-default" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-300">Client Secret Key</label>
                    <Input value={omniClientSecret} readOnly className="h-10 text-xs font-mono bg-white/2 cursor-default" />
                  </div>
                </div>

                <div className="rounded-lg border border-white/8 bg-[#020611] p-4 space-y-3">
                  <div>
                    <span className="block text-[9px] font-bold uppercase text-slate-500">Access Token</span>
                    <div className="flex items-center justify-between mt-1">
                      <code className="text-xs font-mono text-cyan-300">{omniAccessToken}</code>
                      <button onClick={async () => {
                        await navigator.clipboard.writeText(omniAccessToken);
                        setOmniCopied(true);
                        setTimeout(() => setOmniCopied(false), 2000);
                      }} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold transition">
                        {omniCopied ? "Disalin ✓" : "Salin Token"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[9px] font-bold uppercase text-slate-500">Refresh Token</span>
                    <code className="mt-1 block text-xs font-mono text-slate-400">{omniRefreshToken}</code>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/8 pt-4">
                  {isSavedOmniToken ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Check className="h-4 w-4" /> Token baru berhasil digenerasi!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button onClick={() => {
                    setIsSavedOmniToken(true);
                    setOmniAccessToken("balesin_omni_tok_" + Math.random().toString(36).substring(2, 18));
                    setOmniRefreshToken("balesin_omni_ref_" + Math.random().toString(36).substring(2, 18));
                    setTimeout(() => setIsSavedOmniToken(false), 2500);
                  }}>
                    Generasikan Token Baru
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* ============================================== */}
          {/* TAB 12: CHATBOT API TOKEN */}
          {/* ============================================== */}
          {activeSetting === "token_bot" && (
            <ChatbotTokens />
          )}
        </div>
      </div>

      {/* Invite member modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Undang Rekan Tim">
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Anggota</label>
            <Input
              type="email"
              placeholder="nama@perusahaan.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              className="h-10 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Peran / Role</label>
            <Select
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(event.target.value as "Admin" | "Operator")
              }
            >
              <option value="Operator">Operator (CS / Balas Chat)</option>
              <option value="Admin">Admin (Akses Penuh)</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="px-4"
            >
              Batal
            </Button>
            <Button type="submit" className="px-5">
              Undang Sekarang
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

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
import { getTranslation } from "@/lib/translations";
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
      <div className="h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none shadow-2xs" />
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
  | "token_bot";

export default function SettingsPage() {
  const { config, patchConfig, isLoading } = useDashboardConfig();
  const t = getTranslation(config.workspace.language);
  const initialized = useRef(false);

  const [activeSetting, setActiveSetting] = useState<ActiveSetting>("profile");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [origin, setOrigin] = useState("");

  // VoIP Call Settings
  const [sipProvider, setSipProvider] = useState("twilio");
  const [sipServer, setSipServer] = useState("sip.balesin.ai");
  const [sipUsername, setSipUsername] = useState("sip_johan_garage");
  const [sipPassword, setSipPassword] = useState("••••••••••••••••");
  const [outboundCallerId, setOutboundCallerId] = useState("+6281445811835");
  const [isSavedCall, setIsSavedCall] = useState(false);
  const [recordCalls, setRecordCalls] = useState(true);
  const [logCallsToCrm, setLogCallsToCrm] = useState(true);

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

  // User Management States
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Operator">("Operator");
  const [members, setMembers] = useState<TeamMember[]>(config.team.members);

  // Notifications / Security Settings States
  const [notifyEmail, setNotifyEmail] = useState(config.team.notifications.emailDigest);
  const [notifyHandoff, setNotifyHandoff] = useState(config.team.notifications.instantHandoff);
  const [notifyWeekly, setNotifyWeekly] = useState(config.team.notifications.weeklyReport);
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  // Agent Management – full state
  const [agentTab, setAgentTab] = useState("division");
  const [isSavedAgent, setIsSavedAgent] = useState(false);
  const [divisions, setDivisions] = useState([
    { id: "div_001", name: "Customer Service", description: "Menangani pertanyaan umum pelanggan.", agents: 5, supervisor: "Admin Senior", status: "Active" },
    { id: "div_002", name: "Technical Support", description: "Menangani pertanyaan teknis seputar layanan.", agents: 3, supervisor: "Kepala Technical", status: "Active" },
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
    { division: "Technical Support", maxActive: 5, maxPending: 10 },
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

  // SLA States
  const [firstResponseMinutes, setFirstResponseMinutes] = useState(5);
  const [followupResponseMinutes, setFollowupResponseMinutes] = useState(10);
  const [isSavedSla, setIsSavedSla] = useState(false);

  // Custom Fields
  const [customFields, setCustomFields] = useState([
    { id: "1", name: "Customer Code", type: "Text", required: true },
    { id: "2", name: "Product Category Interest", type: "Text", required: true },
    { id: "3", name: "Preferred Discussion Schedule", type: "Date", required: false }
  ]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("Text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Survey CSAT States
  const [csatEnabled, setCsatEnabled] = useState(true);
  const [csatScale, setCsatScale] = useState("5");
  const [csatQuestion, setCsatQuestion] = useState("Bagaimana penilaian Anda terhadap kualitas layanan dan respon agen kami hari ini?");
  const [isSavedSurvey, setIsSavedSurvey] = useState(false);

  // Ticket Categories
  const [ticketCategories, setTicketCategories] = useState([
    { id: "c1", name: "General Question", defaultPriority: "High" },
    { id: "c2", name: "Technical Inquiry", defaultPriority: "Medium" },
    { id: "c3", name: "Billing & Payment", defaultPriority: "Low" }
  ]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryPriority, setNewCategoryPriority] = useState("Medium");

  // Activity logs
  const [logs] = useState([
    { id: "l1", type: "Export Contacts", user: "Admin Utama", date: "2026-06-22 14:32", status: "Success", size: "145 KB" },
    { id: "l2", type: "Import Contacts CSV", user: "Admin Utama", date: "2026-06-20 09:15", status: "Success (154 baris)", size: "48 KB" },
    { id: "l3", type: "Export CSAT Survey", user: "Admin Utama", date: "2026-06-18 17:40", status: "Success", size: "12 KB" }
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
    if (!inviteEmail) return;

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
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-slate-900 tracking-tight">
          <Settings className="h-6 w-6 text-blue-600" />
          Settings & Workspace Configuration
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Kelola konfigurasi profil workspace, sistem akun, manajemen agen, alur pesan, integrasi panggilan, database kontak, kuesioner, tiket, dan token API.
        </p>
      </div>

      {/* Main Settings Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        {/* Left Sidebar List of Settings Tabs */}
        <div className="space-y-6 lg:col-span-1">
          {/* Group 1: Sistem & Keamanan */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-2">
              Sistem & Keamanan
            </span>
            <div className="space-y-1 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
              {[
                { id: "profile", label: "Workspace Profile", icon: Building2 },
                { id: "users", label: "User Management", icon: User },
                { id: "agents", label: "Agent Management", icon: UserCheck },
                { id: "sla", label: "SLA Management", icon: Clock },
                { id: "inbox", label: "Inbox", icon: Inbox },
                { id: "security", label: "Security", icon: Shield },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSetting(id as ActiveSetting)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                    activeSetting === id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${activeSetting === id ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Group 2: Fitur & Operasional */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-2">
              Fitur & Operasional
            </span>
            <div className="space-y-1 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
              <button
                onClick={() => setActiveSetting("call")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                  activeSetting === "call"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-amber-500" />
                  <span>Call (Telepon)</span>
                </div>
                <Badge variant="warning" className="text-[8px] font-extrabold px-1.5 py-0">NEW</Badge>
              </button>

              {[
                { id: "contacts", label: "Contact Info", icon: Database },
                { id: "survey", label: "Customer survey", icon: SlidersHorizontal },
                { id: "ticket", label: "Ticket", icon: ListChecks },
                { id: "logs", label: "Import & export list", icon: History },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSetting(id as ActiveSetting)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                    activeSetting === id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${activeSetting === id ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Group 3: AI Provider Key */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-2">
              AI Provider Key
            </span>
            <div className="space-y-1 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
              <button
                onClick={() => setActiveSetting("token_bot")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                  activeSetting === "token_bot"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FileCode className="h-4 w-4 text-blue-600" />
                <span>AI API Key & Token</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Settings Detail Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: WORKSPACE PROFILE */}
          {activeSetting === "profile" && (
            <Card className="p-6 md:p-8 border-slate-200 bg-white max-w-3xl shadow-2xs space-y-5">
              <form onSubmit={handleSaveWorkspace} className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-900">
                    <Building2 className="h-4.5 w-4.5 text-blue-600" />
                    {t.profileSettingsTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{t.profileSettingsDesc}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900">{t.workspaceName}</label>
                    <Input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} className="h-9 text-xs bg-slate-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900">{t.industry}</label>
                    <Input value={industry} onChange={(event) => setIndustry(event.target.value)} className="h-9 text-xs bg-slate-50" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">{t.emailSupport}</label>
                  <Input type="email" value={supportEmail} onChange={(event) => setSupportEmail(event.target.value)} className="h-9 text-xs bg-slate-50" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">{t.businessDesc}</label>
                  <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="text-xs bg-slate-50" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">{t.address}</label>
                  <Textarea rows={2} value={address} onChange={(event) => setAddress(event.target.value)} className="text-xs bg-slate-50" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">{t.businessHours}</label>
                  <Input value={businessHours} onChange={(event) => setWorkspaceBusinessHours(event.target.value)} className="h-9 text-xs bg-slate-50" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900">{t.timezone}</label>
                    <Select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                      <option value="Asia/Jakarta">WIB - Asia/Jakarta</option>
                      <option value="Asia/Makassar">WITA - Asia/Makassar</option>
                      <option value="Asia/Jayapura">WIT - Asia/Jayapura</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900">{t.defaultLang}</label>
                    <Select value={lang} onChange={(event) => setLang(event.target.value)}>
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English</option>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  {isSavedWorkspace ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <Check className="h-4 w-4" /> {t.successSaveProfile}
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" variant="primary" size="sm" className="px-5 font-bold">
                    <Save className="mr-1.5 h-4 w-4" /> {t.saveProfile}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeSetting === "users" && (
            <UserManagementTab />
          )}

          {/* TAB 3: AGENT MANAGEMENT */}
          {activeSetting === "agents" && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Agent Management
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Atur divisi, alokasi chat, broadcast, workload, idle rule, dan contact masking untuk semua agen.</p>
              </div>

              {/* Inner Tabs */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 overflow-x-auto">
                  <nav className="flex gap-1">
                    {AGENT_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setAgentTab(tab.id)}
                        className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition cursor-pointer ${
                          agentTab === tab.id
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Division Tab */}
                {agentTab === "division" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Division</h3>
                        <p className="text-xs text-slate-500">Kelompokkan agen ke dalam divisi untuk memudahkan distribusi chat.</p>
                      </div>
                      <Button onClick={() => setShowDivModal(true)} variant="primary" size="sm" className="gap-1.5">
                        <PlusCircle className="h-4 w-4" />
                        Create Division
                      </Button>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                      <table className="w-full text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold">Division Name</th>
                            <th className="px-4 py-3 text-left font-bold">Description</th>
                            <th className="px-4 py-3 text-left font-bold">Agents</th>
                            <th className="px-4 py-3 text-left font-bold">Supervisor</th>
                            <th className="px-4 py-3 text-left font-bold">Status</th>
                            <th className="px-4 py-3 text-right font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {divisions.map((div) => (
                            <tr key={div.id} className="hover:bg-slate-50/70 transition">
                              <td className="px-4 py-3 font-bold text-slate-900">{div.name}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs max-w-[180px] truncate font-medium">{div.description}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{div.agents} agents</td>
                              <td className="px-4 py-3 text-slate-500 font-medium">{div.supervisor}</td>
                              <td className="px-4 py-3">
                                <Badge variant="success" className="text-[10px]">{div.status}</Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => setDivisions(divisions.filter((d) => d.id !== div.id))}
                                  className="text-slate-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Allocation Tab */}
                {agentTab === "allocation" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Agent Allocation</h3>
                      <p className="text-xs text-slate-500">Atur cara sistem mendistribusikan chat masuk ke agen yang tersedia.</p>
                    </div>
                    <Card className="p-4 border-slate-200 bg-white shadow-2xs space-y-3">
                      {[
                        { label: "Allow agents to takeover unassigned chats", value: canTakeover, set: (v: boolean) => setCanTakeover(v) },
                        { label: "Allow agents to assign chat to another agent", value: canAssign, set: (v: boolean) => setCanAssign(v) },
                      ].map(({ label, value, set }) => (
                        <div key={label} className="flex items-center justify-between py-1">
                          <span className="text-xs font-bold text-slate-900">{label}</span>
                          <AgentToggle checked={value} onChange={set} />
                        </div>
                      ))}
                    </Card>

                    <Card className="p-5 border-slate-200 bg-white shadow-2xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900">Auto Agent Allocation</div>
                          <div className="text-[11px] text-slate-500 font-medium">Distribusikan chat otomatis ke agen online.</div>
                        </div>
                        <AgentToggle checked={autoAlloc} onChange={(v) => setAutoAlloc(v)} />
                      </div>
                      {autoAlloc && (
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <label className="text-xs font-bold text-slate-900">Allocation Method</label>
                          <select
                            className="h-9 w-full max-w-xs rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                            value={allocMethod}
                            onChange={(e) => setAllocMethod(e.target.value)}
                          >
                            {["Round Robin", "Least Active Agent", "Least Workload", "Random Available Agent", "Priority Based"].map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </Card>

                    <div className="pt-2">
                      <Button onClick={() => { setIsSavedAgent(true); setTimeout(() => setIsSavedAgent(false), 2500); }} variant="primary" size="sm" className="gap-1.5">
                        {isSavedAgent ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        {isSavedAgent ? "Tersimpan!" : "Save Settings"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SLA MANAGEMENT */}
          {activeSetting === "sla" && (
            <Card className="p-6 border-slate-200 bg-white max-w-3xl shadow-2xs">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <Clock className="h-4.5 w-4.5 text-blue-600" />
                  SLA Management
                </h3>
                <p className="text-xs text-slate-500 mt-1">Setel Service Level Agreement untuk memastikan pesan pelanggan dibalas tepat waktu.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setIsSavedSla(true);
                setTimeout(() => setIsSavedSla(false), 2000);
              }} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900">Target First Response SLA (Menit)</label>
                    <Input
                      type="number"
                      value={firstResponseMinutes}
                      onChange={(e) => setFirstResponseMinutes(Number(e.target.value))}
                      className="h-9 text-xs bg-slate-50"
                    />
                    <p className="text-[10px] text-slate-500 font-medium">Maksimal jeda waktu balas untuk pesan pertama pelanggan baru.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900">Target Follow-up Response SLA (Menit)</label>
                    <Input
                      type="number"
                      value={followupResponseMinutes}
                      onChange={(e) => setFollowupResponseMinutes(Number(e.target.value))}
                      className="h-9 text-xs bg-slate-50"
                    />
                    <p className="text-[10px] text-slate-500 font-medium">Jeda waktu respons maksimal untuk pesan-pesan berikutnya.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  {isSavedSla ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <Check className="h-4 w-4" /> Pengaturan SLA disimpan!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" variant="primary" size="sm">Simpan SLA</Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 5: INBOX */}
          {activeSetting === "inbox" && (
            <InboxSettings />
          )}

          {/* TAB 6: SECURITY */}
          {activeSetting === "security" && (
            <div className="max-w-3xl space-y-6">
              <Card className="p-6 border-slate-200 bg-white shadow-2xs space-y-4">
                <form onSubmit={handleSaveNotify} className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                      <Shield className="h-4.5 w-4.5 text-blue-600" />
                      Security & Account Privacy
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Pengaturan privasi dan keamanan akun tingkat lanjut.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-900">IP Whitelist Restriksi (Akses Terbatas)</label>
                      <Input
                        placeholder="Masukkan alamat IP yang diizinkan (contoh: 192.168.1.1, satu per baris)"
                        className="h-9 text-xs bg-slate-50"
                      />
                      <p className="text-[10px] text-slate-500 font-medium">Membatasi akses Admin/Operator login dashboard hanya dari IP kantor terdaftar.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    {isSavedNotify ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <Check className="h-4 w-4" /> Setelan keamanan disimpan!
                      </span>
                    ) : (
                      <div />
                    )}
                    <Button type="submit" variant="primary" size="sm">Simpan Setelan Keamanan</Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* TAB 7: CALL */}
          {activeSetting === "call" && (
            <Card className="p-6 border-slate-200 bg-white max-w-3xl shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                    <Phone className="h-4.5 w-4.5 text-amber-500" />
                    SIP Cloud Call Center Configuration
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Fitur pengaturan saluran panggilan suara atau telepon terintegrasi (VoIP).</p>
                </div>
                <Badge variant="warning" className="text-[9px]">NEW</Badge>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setIsSavedCall(true);
                setTimeout(() => setIsSavedCall(false), 2000);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900">SIP Call Provider</label>
                    <Select value={sipProvider} onChange={(e) => setSipProvider(e.target.value)}>
                      <option value="twilio">Twilio Cloud Voice</option>
                      <option value="vonage">Vonage SIP Trunk</option>
                      <option value="3cx">3CX IP-PBX System</option>
                      <option value="custom">Custom SIP Server (Lokal)</option>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900">SIP Server Hostname</label>
                    <Input
                      value={sipServer}
                      onChange={(e) => setSipServer(e.target.value)}
                      placeholder="sip.domain.com"
                      className="h-9 text-xs bg-slate-50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  {isSavedCall ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <Check className="h-4 w-4" /> Kredensial SIP disimpan!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" variant="primary" size="sm">Hubungkan Saluran Telepon</Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 8: CONTACT INFO */}
          {activeSetting === "contacts" && (
            <Card className="p-6 border-slate-200 bg-white max-w-3xl shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <Database className="h-4.5 w-4.5 text-blue-600" />
                  Contact Info Custom Database Fields
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Pengaturan format bidang data pelanggan.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Bidang Data Standar (Sistem)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {["Nama Lengkap", "Nomor Telepon", "Email", "Preferred Channel", "Owner", "Company"].map((standard) => (
                      <div key={standard} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                        <span className="font-semibold text-slate-800">{standard}</span>
                        <Badge variant="secondary" className="text-[8px]">SYSTEM</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 9: CUSTOMER SURVEY */}
          {activeSetting === "survey" && (
            <Card className="p-6 border-slate-200 bg-white max-w-3xl shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <SlidersHorizontal className="h-4.5 w-4.5 text-blue-600" />
                  Customer Satisfaction Survey (CSAT)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Aktifkan survei kepuasan pelanggan setelah sesi obrolan selesai.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setIsSavedSurvey(true);
                setTimeout(() => setIsSavedSurvey(false), 2000);
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Teks Pertanyaan Survei</label>
                  <Textarea
                    value={csatQuestion}
                    onChange={(e) => setCsatQuestion(e.target.value)}
                    rows={3}
                    className="text-xs bg-slate-50"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  {isSavedSurvey ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <Check className="h-4 w-4" /> CSAT disimpan!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" variant="primary" size="sm">Simpan Kuesioner</Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 10: TICKET */}
          {activeSetting === "ticket" && (
            <Card className="p-6 border-slate-200 bg-white max-w-3xl shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <ListChecks className="h-4.5 w-4.5 text-blue-600" />
                  Ticket Categories & Automations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Pengaturan kategori dan otomatisasi pembuatan tiket keluhan.</p>
              </div>

              <div className="space-y-2">
                {ticketCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900">
                    <span>{cat.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{cat.defaultPriority}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 11: LOGS */}
          {activeSetting === "logs" && (
            <Card className="p-6 border-slate-200 bg-white max-w-3xl shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <History className="h-4.5 w-4.5 text-blue-600" />
                  Import & Export Activity Logs
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Memantau proses pengungahan atau pengunduhan data massal.</p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-left">Aktivitas</th>
                      <th className="p-3 text-left">Pelaksana</th>
                      <th className="p-3 text-left">Waktu</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-bold text-slate-900">{log.type}</td>
                        <td className="p-3 font-medium text-slate-600">{log.user}</td>
                        <td className="p-3 font-medium text-slate-500">{log.date}</td>
                        <td className="p-3">
                          <Badge variant="success" className="text-[10px]">{log.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 12: CHATBOT API TOKEN */}
          {activeSetting === "token_bot" && (
            <ChatbotTokens />
          )}
        </div>
      </div>
    </div>
  );
}

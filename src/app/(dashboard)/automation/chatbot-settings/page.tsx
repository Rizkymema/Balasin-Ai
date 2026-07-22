"use client";

import { useEffect, useState, useRef } from "react";
import {
  Sliders,
  Clock,
  Plug,
  GitMerge,
  Loader2,
  Save,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Edit2,
  FlaskConical,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import type {
  ApiAuthType,
  ApiIntegration,
  ApiMethod,
  ApiStatus,
  ApiTestResult,
  AutomationAiConfig,
  AutomationCrmIntegration,
  AutomationIdleAction,
} from "@/types/dashboard-config";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatbotSettingsState {
  aiConfig: AutomationAiConfig;
  idleAction: AutomationIdleAction;
  apiIntegrations: ApiIntegration[];
  crmIntegration: AutomationCrmIntegration;
  spamGuard: boolean;
  sentimentGuard: boolean;
}

const DEFAULT_SETTINGS: ChatbotSettingsState = {
  aiConfig: {
    aiMessageThreshold: 10,
    listenTimeSeconds: 2,
    handoverEnabled: true,
    handoverTargetType: "Specific team",
    handoverTarget: "Customer Service",
    handoverMessage: "Baik kak, saya teruskan percakapan ini ke admin agar bisa dibantu lebih lanjut.",
  },
  idleAction: {
    enabled: true,
    idleTimeout: 48,
    idleTimeoutUnit: "hours",
    triggerTarget: "Customer inactive",
    actionType: "Send reminder message",
    idleMessage: "Halo kak, apakah masih membutuhkan bantuan? Jika tidak ada balasan, percakapan ini akan kami tutup otomatis.",
    autoClose: true,
  },
  apiIntegrations: [],
  crmIntegration: {
    enabled: true,
    provider: "Internal CRM",
    syncTrigger: "When lead intent is detected",
    contactMapping: [
      { customerField: "Customer Name", crmField: "CRM Contact Name" },
      { customerField: "Customer Phone", crmField: "CRM Phone Number" },
      { customerField: "Customer Email", crmField: "CRM Email" },
    ],
    duplicateHandling: "Update existing contact",
  },
  spamGuard: true,
  sentimentGuard: true,
};

const TABS = [
  { id: "ai_config", label: "AI Configuration", icon: Sliders },
  { id: "idle_action", label: "Idle Action", icon: Clock },
  { id: "api_integration", label: "Webhook / API Eksternal", icon: Plug },
  { id: "crm_integration", label: "CRM Integration", icon: GitMerge },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-brand)] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
    </label>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-2">
      <label className="text-sm font-semibold text-slate-300">{label}</label>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)] mb-4">{children}</h3>;
}

function TestBadge({ result }: { result: ApiTestResult }) {
  const map: Record<ApiTestResult, { color: string; icon: React.ReactNode }> = {
    "Success": { color: "text-emerald-400 bg-emerald-500/10", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    "Failed": { color: "text-red-400 bg-red-500/10", icon: <XCircle className="h-3.5 w-3.5" /> },
    "Timeout": { color: "text-amber-400 bg-amber-500/10", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    "Unauthorized": { color: "text-red-400 bg-red-500/10", icon: <XCircle className="h-3.5 w-3.5" /> },
    "Not tested": { color: "text-slate-400 bg-slate-500/10", icon: <FlaskConical className="h-3.5 w-3.5" /> },
  };
  const { color, icon } = map[result];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {icon}{result}
    </span>
  );
}

function limitToSingleApiIntegration(integrations: ApiIntegration[]) {
  return integrations.filter((integration) => Boolean(integration)).slice(0, 1);
}

// ─── AI Configuration Tab ─────────────────────────────────────────────────────
function AIConfigPanel({
  config,
  onChange,
  spamGuard,
  onChangeSpamGuard,
  sentimentGuard,
  onChangeSentimentGuard,
  onSave,
  isSaved,
}: {
  config: ChatbotSettingsState["aiConfig"];
  onChange: (v: ChatbotSettingsState["aiConfig"]) => void;
  spamGuard: boolean;
  onChangeSpamGuard: (v: boolean) => void;
  sentimentGuard: boolean;
  onChangeSentimentGuard: (v: boolean) => void;
  onSave: () => void;
  isSaved: boolean;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white">AI Configuration</h2>
        <p className="text-sm text-slate-400 mt-1">Atur parameter dasar perilaku AI saat membalas pesan pelanggan.</p>
      </div>

      <Card className="p-6 border-white/10 bg-white/[0.02] space-y-6">
        <SectionTitle>Message Threshold & Listen Time</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FieldLabel
              label="AI Message Threshold"
              hint="Batas maksimal jumlah pesan AI dalam satu sesi. Setelah batas ini, percakapan diteruskan ke human agent."
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={config.aiMessageThreshold}
                onChange={(e) => onChange({ ...config, aiMessageThreshold: Number(e.target.value) })}
                className="bg-black/20 max-w-[120px]"
              />
              <span className="text-sm text-slate-400">messages</span>
            </div>
          </div>
          <div>
            <FieldLabel
              label="Listen Time"
              hint="Waktu tunggu sebelum bot membalas, agar pesan pelanggan yang terpecah bisa terkumpul dulu."
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={60}
                value={config.listenTimeSeconds}
                onChange={(e) => onChange({ ...config, listenTimeSeconds: Number(e.target.value) })}
                className="bg-black/20 max-w-[120px]"
              />
              <span className="text-sm text-slate-400">seconds</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-white/10 bg-white/[0.02] space-y-6">
        <div className="flex items-center justify-between">
          <SectionTitle>Human Agent Handover</SectionTitle>
          <Toggle checked={config.handoverEnabled} onChange={(v) => onChange({ ...config, handoverEnabled: v })} />
        </div>

        {config.handoverEnabled && (
          <div className="space-y-5 pt-2 border-t border-[var(--color-border)]">
            <div>
              <FieldLabel label="Handover Target Type" />
              <select
                className="flex h-10 w-full max-w-xs rounded-md border border-[var(--color-border)] bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                value={config.handoverTargetType}
                onChange={(e) => onChange({ ...config, handoverTargetType: e.target.value as AutomationAiConfig["handoverTargetType"] })}
              >
                <option value="Any available agent">Any available agent</option>
                <option value="Specific team">Specific team</option>
                <option value="Specific agent">Specific agent</option>
              </select>
            </div>

            {config.handoverTargetType !== "Any available agent" && (
              <div>
                <FieldLabel label={config.handoverTargetType === "Specific team" ? "Team Name" : "Agent Name"} />
                <Input
                  placeholder={config.handoverTargetType === "Specific team" ? "Mekanik, Customer Service, ..." : "Nama agent..."}
                  value={config.handoverTarget}
                  onChange={(e) => onChange({ ...config, handoverTarget: e.target.value })}
                  className="bg-black/20 max-w-xs"
                />
              </div>
            )}

            <div>
              <FieldLabel
                label="Handover Message"
                hint="Pesan yang dikirim ke pelanggan sebelum percakapan dialihkan ke admin."
              />
              <Textarea
                value={config.handoverMessage}
                onChange={(e) => onChange({ ...config, handoverMessage: e.target.value })}
                className="min-h-[90px] bg-black/20"
              />
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 border-white/10 bg-white/[0.02] space-y-6">
        <SectionTitle>Guardrails & Pelindung Otomatis</SectionTitle>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-semibold text-white">Spam Guard</div>
              <div className="text-xs text-slate-500">Secara otomatis menyaring dan mengabaikan pesan masuk yang terdeteksi sebagai spam.</div>
            </div>
            <Toggle checked={spamGuard} onChange={onChangeSpamGuard} />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[var(--color-border)] pt-4">
            <div>
              <div className="text-sm font-semibold text-white">Sentiment Guard (AI Moderation)</div>
              <div className="text-xs text-slate-500">Secara otomatis mendeteksi dan menghapus komentar negatif (makian, penipuan, hoaks) menggunakan AI.</div>
            </div>
            <Toggle checked={sentimentGuard} onChange={onChangeSentimentGuard} />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} className="gap-2">
          {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaved ? "Tersimpan!" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

// ─── Idle Action Tab ──────────────────────────────────────────────────────────
function IdleActionPanel({
  config,
  onChange,
  onSave,
  isSaved,
}: {
  config: ChatbotSettingsState["idleAction"];
  onChange: (v: ChatbotSettingsState["idleAction"]) => void;
  onSave: () => void;
  isSaved: boolean;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white">Idle Action</h2>
        <p className="text-sm text-slate-400 mt-1">Atur tindakan otomatis ketika percakapan tidak aktif dalam periode tertentu.</p>
      </div>

      <Card className="p-6 border-white/10 bg-white/[0.02] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Enable Idle Action</div>
            <div className="text-xs text-slate-500">Aktifkan tindakan otomatis saat percakapan tidak aktif.</div>
          </div>
          <Toggle checked={config.enabled} onChange={(v) => onChange({ ...config, enabled: v })} />
        </div>

        {config.enabled && (
          <div className="space-y-5 pt-4 border-t border-[var(--color-border)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <FieldLabel label="Idle Timeout" />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={config.idleTimeout}
                    onChange={(e) => onChange({ ...config, idleTimeout: Number(e.target.value) })}
                    className="bg-black/20"
                  />
                  <select
                    className="h-10 rounded-md border border-[var(--color-border)] bg-black/20 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
                    value={config.idleTimeoutUnit}
                    onChange={(e) => onChange({ ...config, idleTimeoutUnit: e.target.value as "hours" | "days" })}
                  >
                    <option value="hours">hours</option>
                    <option value="days">days</option>
                  </select>
                </div>
              </div>
              <div>
                <FieldLabel label="Trigger Target" />
                <select
                  className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
                  value={config.triggerTarget}
                  onChange={(e) => onChange({ ...config, triggerTarget: e.target.value as AutomationIdleAction["triggerTarget"] })}
                >
                  <option value="Customer inactive">Customer inactive</option>
                  <option value="Agent inactive">Agent inactive</option>
                  <option value="Both customer and agent inactive">Both customer and agent inactive</option>
                </select>
              </div>
              <div>
                <FieldLabel label="Action Type" />
                <select
                  className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
                  value={config.actionType}
                  onChange={(e) => onChange({ ...config, actionType: e.target.value as AutomationIdleAction["actionType"] })}
                >
                  <option value="Send reminder message">Send reminder message</option>
                  <option value="Mark as resolved">Mark as resolved</option>
                  <option value="Close conversation">Close conversation</option>
                  <option value="Assign to agent">Assign to agent</option>
                  <option value="Add label">Add label</option>
                  <option value="Trigger webhook">Trigger webhook</option>
                </select>
              </div>
            </div>

            <div>
              <FieldLabel
                label="Idle Message"
                hint="Pesan otomatis yang dikirim ke pelanggan saat percakapan idle."
              />
              <Textarea
                value={config.idleMessage}
                onChange={(e) => onChange({ ...config, idleMessage: e.target.value })}
                className="min-h-[90px] bg-black/20"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--color-border)] bg-white/[0.01]">
              <div>
                <div className="text-sm font-semibold text-white">Auto Close Conversation</div>
                <div className="text-xs text-slate-500">Tutup percakapan otomatis setelah timeout jika tidak ada respons.</div>
              </div>
              <Toggle checked={config.autoClose} onChange={(v) => onChange({ ...config, autoClose: v })} />
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} className="gap-2">
          {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaved ? "Tersimpan!" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

// ─── API Integration Tab ──────────────────────────────────────────────────────
function ApiModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: ApiIntegration;
  onClose: () => void;
  onSave: (data: Omit<ApiIntegration, "id" | "lastTest">) => void;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [method, setMethod] = useState<ApiMethod>(initialData?.method ?? "GET");
  const [endpoint, setEndpoint] = useState(initialData?.endpoint ?? "");
  const [authType, setAuthType] = useState<ApiAuthType>(initialData?.authType ?? "No Auth");
  const [authToken, setAuthToken] = useState(initialData?.authToken ?? "");
  const [showToken, setShowToken] = useState(false);
  const [headers, setHeaders] = useState(initialData?.headers ?? "");
  const [requestBody, setRequestBody] = useState(initialData?.requestBody ?? "");
  const [responseMapping, setResponseMapping] = useState(initialData?.responseMapping ?? "");
  const [status, setStatus] = useState<ApiStatus>(initialData?.status ?? "Draft");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4 sticky top-0 bg-[var(--color-surface)] z-10 rounded-t-xl">
          <h2 className="font-bold text-white">{initialData ? "Edit API Utama" : "Setup API Utama"}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel label="API Name" />
              <Input placeholder="Check Service Status" value={name} onChange={(e) => setName(e.target.value)} className="bg-black/20" />
            </div>
            <div className="space-y-2">
              <FieldLabel label="HTTP Method" />
              <select
                className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-black/20 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                value={method}
                onChange={(e) => setMethod(e.target.value as ApiMethod)}
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel label="Endpoint URL" />
            <Input placeholder="https://api.example.com/endpoint" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="bg-black/20 font-mono text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel label="Authentication Type" />
              <select
                className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-black/20 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                value={authType}
                onChange={(e) => setAuthType(e.target.value as ApiAuthType)}
              >
                {["No Auth", "Bearer Token", "API Key", "Basic Auth", "Custom Header"].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {authType !== "No Auth" && (
              <div className="space-y-2">
                <FieldLabel label="Auth Token / Key" />
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="sk_live_..."
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    className="bg-black/20 pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel label="Headers (JSON)" hint='Opsional. Contoh: {"Content-Type": "application/json"}' />
            <Textarea placeholder='{"Content-Type": "application/json"}' value={headers} onChange={(e) => setHeaders(e.target.value)} className="min-h-[80px] bg-black/20 font-mono text-sm" />
          </div>

          {method !== "GET" && (
            <div className="space-y-2">
              <FieldLabel label="Request Body (JSON)" hint='Gunakan {{variable}} untuk data dinamis dari percakapan.' />
              <Textarea placeholder='{"phone": "{{customer.phone}}"}' value={requestBody} onChange={(e) => setRequestBody(e.target.value)} className="min-h-[80px] bg-black/20 font-mono text-sm" />
            </div>
          )}

          <div className="space-y-2">
            <FieldLabel label="Response Mapping" hint="Petakan field dari response API ke variabel chatbot." />
            <Textarea placeholder={"serviceStatus = response.status\nmechanicName = response.mechanic"} value={responseMapping} onChange={(e) => setResponseMapping(e.target.value)} className="min-h-[80px] bg-black/20 font-mono text-sm" />
          </div>

          <div className="space-y-2">
            <FieldLabel label="Status" />
            <select
              className="flex h-10 w-40 rounded-md border border-[var(--color-border)] bg-black/20 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApiStatus)}
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-4 bg-[var(--color-surface)] rounded-b-xl">
          <Button variant="secondary" onClick={onClose} className="text-slate-400 bg-transparent border-transparent hover:text-white">Cancel</Button>
          <Button onClick={() => onSave({ name, method, endpoint, authType, authToken, headers, requestBody, responseMapping, status })} className="gap-2">
            <Save className="h-4 w-4" />
            Simpan API
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApiIntegrationPanel({
  integrations,
  onChange,
  onSave,
  isSaved,
}: {
  integrations: ApiIntegration[];
  onChange: (v: ApiIntegration[]) => void;
  onSave: () => Promise<void>;
  isSaved: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiIntegration | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testError, setTestError] = useState("");
  const primaryIntegration = integrations[0] ?? null;

  const handleSave = (data: Omit<ApiIntegration, "id" | "lastTest">) => {
    const nextIntegration = editingApi
      ? { ...editingApi, ...data }
      : { ...data, id: "api_" + Date.now(), lastTest: "Not tested" as const };
    onChange([nextIntegration]);
    setIsModalOpen(false);
    setEditingApi(null);
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestError("");
    try {
      await onSave();
      const response = await fetch("/api/automation/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: id }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Tes koneksi API gagal.");
      }
      onChange(
        integrations.map((integration) =>
          integration.id === id
            ? { ...integration, lastTest: payload.data.result as ApiTestResult }
            : integration,
        ),
      );
      if (payload.data.result !== "Success") {
        setTestError(
          `API merespons HTTP ${payload.data.status || 0}: ${payload.data.response || "tanpa respons"}`,
        );
      }
    } catch (error) {
      onChange(
        integrations.map((integration) =>
          integration.id === id
            ? { ...integration, lastTest: "Failed" as const }
            : integration,
        ),
      );
      setTestError(
        error instanceof Error ? error.message : "Tes koneksi API gagal.",
      );
    } finally {
      setTestingId(null);
    }
  };

  const methodColors: Record<ApiMethod, string> = {
    GET: "text-emerald-400 bg-emerald-500/10",
    POST: "text-blue-400 bg-blue-500/10",
    PUT: "text-amber-400 bg-amber-500/10",
    PATCH: "text-purple-400 bg-purple-500/10",
    DELETE: "text-red-400 bg-red-500/10",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Webhook / API Bisnis Eksternal</h2>
          <p className="text-sm text-slate-400 mt-1">Gunakan untuk memanggil API bisnis Anda sendiri (seperti cek stok, status transaksi, database layanan) saat percakapan berlangsung. <strong>Bukan untuk API Key AI (OpenAI/Gemini).</strong></p>
        </div>
        <Button onClick={() => { setEditingApi(primaryIntegration); setIsModalOpen(true); }} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          {primaryIntegration ? "Ubah API Utama" : "Setup API Utama"}
        </Button>
      </div>

      <Card className="border-white/10 bg-white/[0.02] p-4 text-sm text-slate-300">
        Ini adalah konfigurasi Webhook bisnis eksternal. Jika Anda ingin mengatur API Key AI (OpenAI/Gemini/OpenRouter), silakan atur di menu <strong>Settings &gt; AI API Key &amp; Token</strong>.
      </Card>

      {!primaryIntegration ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] py-14 text-center">
          <Plug className="h-10 w-10 text-slate-600 mb-3" />
          <p className="text-sm text-slate-300">Belum ada API utama yang terhubung.</p>
          <p className="mt-1 text-xs text-slate-500">Sistem hanya mengizinkan satu integrasi API untuk fitur chatbot.</p>
        </div>
      ) : (
        <Card className="border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-semibold text-white">{primaryIntegration.name}</h3>
                <span className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${methodColors[primaryIntegration.method]}`}>
                  {primaryIntegration.method}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  primaryIntegration.status === "Active"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : primaryIntegration.status === "Draft"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-slate-500/10 text-slate-400"
                }`}>
                  {primaryIntegration.status}
                </span>
                <TestBadge result={primaryIntegration.lastTest} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Endpoint</div>
                  <div className="mt-1 break-all font-mono text-xs text-slate-300">{primaryIntegration.endpoint}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Authentication</div>
                  <div className="mt-1 text-sm text-slate-300">{primaryIntegration.authType}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleTest(primaryIntegration.id)}
                disabled={testingId === primaryIntegration.id}
                className="rounded-lg border border-[var(--color-border)] p-2 text-slate-400 transition hover:bg-white/10 hover:text-[var(--color-brand)] disabled:opacity-50"
                title="Test API"
              >
                {testingId === primaryIntegration.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
              </button>
              <button
                onClick={() => { setEditingApi(primaryIntegration); setIsModalOpen(true); }}
                className="rounded-lg border border-[var(--color-border)] p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onChange([])}
                className="rounded-lg border border-[var(--color-border)] p-2 text-slate-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {testError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {testError}
        </div>
      )}

      {isModalOpen && (
        <ApiModal
          initialData={editingApi ?? undefined}
          onClose={() => { setIsModalOpen(false); setEditingApi(null); }}
          onSave={handleSave}
        />
      )}

      <div className="flex items-center gap-3">
        <Button onClick={onSave} className="gap-2">
          {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaved ? "Tersimpan!" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

// ─── CRM Integration Tab ──────────────────────────────────────────────────────
function CRMIntegrationPanel({
  config,
  onChange,
  onSave,
  isSaved,
}: {
  config: ChatbotSettingsState["crmIntegration"];
  onChange: (v: ChatbotSettingsState["crmIntegration"]) => void;
  onSave: () => void;
  isSaved: boolean;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white">CRM Integration</h2>
        <p className="text-sm text-slate-400 mt-1">Sinkronkan data pelanggan dari percakapan chatbot ke sistem CRM secara otomatis.</p>
      </div>

      <Card className="p-6 border-white/10 bg-white/[0.02] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Enable CRM Integration</div>
            <div className="text-xs text-slate-500">Aktifkan sinkronisasi otomatis data pelanggan ke CRM.</div>
          </div>
          <Toggle checked={config.enabled} onChange={(v) => onChange({ ...config, enabled: v })} />
        </div>

        {config.enabled && (
          <div className="space-y-5 pt-4 border-t border-[var(--color-border)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel label="CRM Provider" />
                <select
                  className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-black/20 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                  value={config.provider}
                  onChange={(e) => onChange({ ...config, provider: e.target.value })}
                >
                  {["Internal CRM", "Mekari CRM", "HubSpot", "Zoho CRM", "Salesforce", "Custom CRM API"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel label="Sync Trigger" />
                <select
                  className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-black/20 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                  value={config.syncTrigger}
                  onChange={(e) => onChange({ ...config, syncTrigger: e.target.value })}
                >
                  {[
                    "When new conversation starts",
                    "When customer shares phone number",
                    "When customer selects booking menu",
                    "When conversation is handed over",
                    "When conversation is closed",
                    "When lead intent is detected",
                  ].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel label="Duplicate Handling" />
              <select
                className="flex h-10 w-60 rounded-md border border-[var(--color-border)] bg-black/20 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                value={config.duplicateHandling}
                onChange={(e) => onChange({ ...config, duplicateHandling: e.target.value })}
              >
                {[
                  "Update existing contact",
                  "Create new contact anyway",
                  "Merge with existing contact",
                  "Skip duplicate contact",
                ].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <SectionTitle>Contact Mapping</SectionTitle>
              <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.02] text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Customer Field</th>
                      <th className="px-4 py-2.5 text-center text-slate-600">→</th>
                      <th className="px-4 py-2.5 text-left font-semibold">CRM Field</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {config.contactMapping.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="px-4 py-2.5">
                          <Input
                            value={row.customerField}
                            onChange={(e) => {
                              const next = [...config.contactMapping];
                              next[idx] = { ...next[idx], customerField: e.target.value };
                              onChange({ ...config, contactMapping: next });
                            }}
                            className="bg-black/20 h-8 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-center text-slate-500">→</td>
                        <td className="px-4 py-2.5">
                          <Input
                            value={row.crmField}
                            onChange={(e) => {
                              const next = [...config.contactMapping];
                              next[idx] = { ...next[idx], crmField: e.target.value };
                              onChange({ ...config, contactMapping: next });
                            }}
                            className="bg-black/20 h-8 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => onChange({ ...config, contactMapping: config.contactMapping.filter((_, i) => i !== idx) })}
                            className="text-slate-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => onChange({ ...config, contactMapping: [...config.contactMapping, { customerField: "", crmField: "" }] })}
                    className="flex items-center gap-1.5 text-xs text-[var(--color-brand)] hover:opacity-80 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add mapping
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} className="gap-2">
          {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaved ? "Tersimpan!" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChatbotSettingsPage() {
  const { config, patchConfig, isLoading } = useDashboardConfig();
  const [activeTab, setActiveTab] = useState("ai_config");
  const [settings, setSettings] = useState<ChatbotSettingsState>(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !config || isInitializedRef.current) return;
    isInitializedRef.current = true;
    setSettings({
      aiConfig: { ...config.automation.aiConfig },
      idleAction: { ...config.automation.idleAction },
      apiIntegrations: limitToSingleApiIntegration(
        config.automation.apiIntegrations.map((item) => ({ ...item })),
      ),
      crmIntegration: {
        ...config.automation.crmIntegration,
        contactMapping: config.automation.crmIntegration.contactMapping.map((item) => ({
          ...item,
        })),
      },
      spamGuard: config.automation.spamGuard !== false,
      sentimentGuard: config.automation.sentimentGuard !== false,
    });
  }, [config, isLoading]);

  const handleSave = async () => {
    await patchConfig((current) => ({
      ...current,
      automation: {
        ...current.automation,
        aiConfig: settings.aiConfig,
        idleAction: settings.idleAction,
        apiIntegrations: limitToSingleApiIntegration(settings.apiIntegrations),
        crmIntegration: settings.crmIntegration,
        spamGuard: settings.spamGuard,
        sentimentGuard: settings.sentimentGuard,
      },
    }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-white">Chatbot Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Konfigurasi teknis perilaku bot, batas respons AI, idle session, integrasi API, dan sinkronisasi CRM.
        </p>
      </div>

      {/* Inner Tabs */}
      <div className="border-b border-[var(--color-border)]">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-150 ${
                  isActive
                    ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "ai_config" && (
          <AIConfigPanel
            config={settings.aiConfig}
            onChange={(v) => setSettings({ ...settings, aiConfig: v })}
            spamGuard={settings.spamGuard}
            onChangeSpamGuard={(v) => setSettings({ ...settings, spamGuard: v })}
            sentimentGuard={settings.sentimentGuard}
            onChangeSentimentGuard={(v) => setSettings({ ...settings, sentimentGuard: v })}
            onSave={handleSave}
            isSaved={isSaved}
          />
        )}
        {activeTab === "idle_action" && (
          <IdleActionPanel
            config={settings.idleAction}
            onChange={(v) => setSettings({ ...settings, idleAction: v })}
            onSave={handleSave}
            isSaved={isSaved}
          />
        )}
        {activeTab === "api_integration" && (
          <ApiIntegrationPanel
            integrations={settings.apiIntegrations}
            onChange={(v) => setSettings({ ...settings, apiIntegrations: limitToSingleApiIntegration(v) })}
            onSave={handleSave}
            isSaved={isSaved}
          />
        )}
        {activeTab === "crm_integration" && (
          <CRMIntegrationPanel
            config={settings.crmIntegration}
            onChange={(v) => setSettings({ ...settings, crmIntegration: v })}
            onSave={handleSave}
            isSaved={isSaved}
          />
        )}
      </div>
    </div>
  );
}

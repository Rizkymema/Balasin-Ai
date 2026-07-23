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
import { Badge } from "@/components/ui/badge";

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
      <div className="h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none shadow-2xs" />
    </label>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="text-xs font-bold text-slate-900">{label}</label>
      {hint && <p className="text-[11px] text-slate-500 font-medium">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">{children}</h3>;
}

function TestBadge({ result }: { result: ApiTestResult }) {
  if (result === "Success") return <Badge variant="success">Success</Badge>;
  if (result === "Failed" || result === "Unauthorized") return <Badge variant="destructive">{result}</Badge>;
  if (result === "Timeout") return <Badge variant="warning">Timeout</Badge>;
  return <Badge variant="secondary">Not tested</Badge>;
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
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">AI Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">Atur parameter dasar perilaku AI saat membalas pesan pelanggan.</p>
      </div>

      <Card className="p-5 border-slate-200 bg-white shadow-2xs space-y-5">
        <SectionTitle>Message Threshold & Listen Time</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FieldLabel
              label="AI Message Threshold"
              hint="Batas maksimal jumlah pesan AI dalam satu sesi. Setelah batas ini, percakapan diteruskan ke human agent."
            />
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                min={1}
                max={100}
                value={config.aiMessageThreshold}
                onChange={(e) => onChange({ ...config, aiMessageThreshold: Number(e.target.value) })}
                className="bg-slate-50 max-w-[120px] text-xs font-bold"
              />
              <span className="text-xs text-slate-500 font-semibold">messages</span>
            </div>
          </div>
          <div>
            <FieldLabel
              label="Listen Time"
              hint="Waktu tunggu sebelum bot membalas, agar pesan pelanggan yang terpecah bisa terkumpul dulu."
            />
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                min={0}
                max={60}
                value={config.listenTimeSeconds}
                onChange={(e) => onChange({ ...config, listenTimeSeconds: Number(e.target.value) })}
                className="bg-slate-50 max-w-[120px] text-xs font-bold"
              />
              <span className="text-xs text-slate-500 font-semibold">seconds</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 border-slate-200 bg-white shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <SectionTitle>Human Agent Handover</SectionTitle>
          <Toggle checked={config.handoverEnabled} onChange={(v) => onChange({ ...config, handoverEnabled: v })} />
        </div>

        {config.handoverEnabled && (
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div>
              <FieldLabel label="Handover Target Type" />
              <select
                className="flex h-9 w-full max-w-xs rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
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
                  className="bg-slate-50 max-w-xs text-xs"
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
                className="min-h-[80px] bg-slate-50 text-xs"
              />
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5 border-slate-200 bg-white shadow-2xs space-y-4">
        <SectionTitle>Guardrails & Pelindung Otomatis</SectionTitle>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-bold text-slate-900">Spam Guard</div>
              <div className="text-[11px] text-slate-500">Secara otomatis menyaring dan mengabaikan pesan masuk yang terdeteksi sebagai spam.</div>
            </div>
            <Toggle checked={spamGuard} onChange={onChangeSpamGuard} />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-slate-100 pt-3">
            <div>
              <div className="text-xs font-bold text-slate-900">Sentiment Guard (AI Moderation)</div>
              <div className="text-[11px] text-slate-500">Secara otomatis mendeteksi dan menghapus komentar negatif menggunakan AI.</div>
            </div>
            <Toggle checked={sentimentGuard} onChange={onChangeSentimentGuard} />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} variant="primary" size="sm" className="gap-1.5">
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
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Idle Action</h2>
        <p className="text-xs text-slate-500 mt-0.5">Atur tindakan otomatis ketika percakapan tidak aktif dalam periode tertentu.</p>
      </div>

      <Card className="p-5 border-slate-200 bg-white shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900">Enable Idle Action</div>
            <div className="text-[11px] text-slate-500">Aktifkan tindakan otomatis saat percakapan tidak aktif.</div>
          </div>
          <Toggle checked={config.enabled} onChange={(v) => onChange({ ...config, enabled: v })} />
        </div>

        {config.enabled && (
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FieldLabel label="Idle Timeout" />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={config.idleTimeout}
                    onChange={(e) => onChange({ ...config, idleTimeout: Number(e.target.value) })}
                    className="bg-slate-50 text-xs"
                  />
                  <select
                    className="h-9 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
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
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
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
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
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
                className="min-h-[80px] bg-slate-50 text-xs"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div>
                <div className="text-xs font-bold text-slate-900">Auto Close Conversation</div>
                <div className="text-[11px] text-slate-500">Tutup percakapan otomatis setelah timeout jika tidak ada respons.</div>
              </div>
              <Toggle checked={config.autoClose} onChange={(v) => onChange({ ...config, autoClose: v })} />
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} variant="primary" size="sm" className="gap-1.5">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-base font-bold text-slate-900">{initialData ? "Edit API Utama" : "Setup API Utama"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <FieldLabel label="API Name" />
              <Input placeholder="Check Service Status" value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-50 text-xs" />
            </div>
            <div className="space-y-1">
              <FieldLabel label="HTTP Method" />
              <select
                className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                value={method}
                onChange={(e) => setMethod(e.target.value as ApiMethod)}
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <FieldLabel label="Endpoint URL" />
            <Input placeholder="https://api.example.com/endpoint" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="bg-slate-50 font-mono text-xs" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <FieldLabel label="Authentication Type" />
              <select
                className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                value={authType}
                onChange={(e) => setAuthType(e.target.value as ApiAuthType)}
              >
                {["No Auth", "Bearer Token", "API Key", "Basic Auth", "Custom Header"].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {authType !== "No Auth" && (
              <div className="space-y-1">
                <FieldLabel label="Auth Token / Key" />
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="sk_live_..."
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    className="bg-slate-50 pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 cursor-pointer"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <FieldLabel label="Headers (JSON)" hint='Opsional. Contoh: {"Content-Type": "application/json"}' />
            <Textarea placeholder='{"Content-Type": "application/json"}' value={headers} onChange={(e) => setHeaders(e.target.value)} className="min-h-[70px] bg-slate-50 font-mono text-xs" />
          </div>

          {method !== "GET" && (
            <div className="space-y-1">
              <FieldLabel label="Request Body (JSON)" hint='Gunakan {{variable}} untuk data dinamis dari percakapan.' />
              <Textarea placeholder='{"phone": "{{customer.phone}}"}' value={requestBody} onChange={(e) => setRequestBody(e.target.value)} className="min-h-[70px] bg-slate-50 font-mono text-xs" />
            </div>
          )}

          <div className="space-y-1">
            <FieldLabel label="Response Mapping" hint="Petakan field dari response API ke variabel chatbot." />
            <Textarea placeholder={"serviceStatus = response.status\nmechanicName = response.mechanic"} value={responseMapping} onChange={(e) => setResponseMapping(e.target.value)} className="min-h-[70px] bg-slate-50 font-mono text-xs" />
          </div>

          <div className="space-y-1">
            <FieldLabel label="Status" />
            <select
              className="flex h-9 w-40 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApiStatus)}
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 bg-slate-50/50 rounded-b-2xl">
          <Button variant="secondary" onClick={onClose} size="sm">Cancel</Button>
          <Button onClick={() => onSave({ name, method, endpoint, authType, authToken, headers, requestBody, responseMapping, status })} variant="primary" size="sm" className="gap-1.5">
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
      testingId && setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Webhook / API Bisnis Eksternal</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gunakan untuk memanggil API bisnis Anda sendiri saat percakapan berlangsung. <strong>Bukan untuk API Key AI (OpenAI/Gemini).</strong></p>
        </div>
        <Button onClick={() => { setEditingApi(primaryIntegration); setIsModalOpen(true); }} variant="primary" size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          {primaryIntegration ? "Ubah API Utama" : "Setup API Utama"}
        </Button>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs font-medium text-slate-700">
        Ini adalah konfigurasi Webhook bisnis eksternal. Jika Anda ingin mengatur API Key AI (OpenAI/Gemini/OpenRouter), silakan atur di menu <strong>Settings &gt; AI API Key &amp; Token</strong>.
      </div>

      {!primaryIntegration ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center shadow-2xs">
          <Plug className="h-8 w-8 text-slate-400 mb-2" />
          <p className="text-xs font-bold text-slate-900">Belum ada API utama yang terhubung.</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Sistem hanya mengizinkan satu integrasi API untuk fitur chatbot.</p>
        </div>
      ) : (
        <Card className="border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-sm font-bold text-slate-900">{primaryIntegration.name}</h3>
                <Badge variant="default" className="text-[10px]">
                  {primaryIntegration.method}
                </Badge>
                <Badge variant={primaryIntegration.status === "Active" ? "success" : "secondary"} className="text-[10px]">
                  {primaryIntegration.status}
                </Badge>
                <TestBadge result={primaryIntegration.lastTest} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Endpoint</div>
                  <div className="mt-0.5 break-all font-mono text-xs font-semibold text-slate-800">{primaryIntegration.endpoint}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authentication</div>
                  <div className="mt-0.5 text-xs font-semibold text-slate-800">{primaryIntegration.authType}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleTest(primaryIntegration.id)}
                disabled={testingId === primaryIntegration.id}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer disabled:opacity-50"
                title="Test API"
              >
                {testingId === primaryIntegration.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
              </button>
              <button
                onClick={() => { setEditingApi(primaryIntegration); setIsModalOpen(true); }}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onChange([])}
                className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {testError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
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
        <Button onClick={onSave} variant="primary" size="sm" className="gap-1.5">
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
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">CRM Integration</h2>
        <p className="text-xs text-slate-500 mt-0.5">Sinkronkan data pelanggan dari percakapan chatbot ke sistem CRM secara otomatis.</p>
      </div>

      <Card className="p-5 border-slate-200 bg-white shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900">Enable CRM Integration</div>
            <div className="text-[11px] text-slate-500">Aktifkan sinkronisasi otomatis data pelanggan ke CRM.</div>
          </div>
          <Toggle checked={config.enabled} onChange={(v) => onChange({ ...config, enabled: v })} />
        </div>

        {config.enabled && (
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel label="CRM Provider" />
                <select
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
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
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
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
                className="flex h-9 w-60 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
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
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Customer Field</th>
                      <th className="px-4 py-2.5 text-center text-slate-400">→</th>
                      <th className="px-4 py-2.5 text-left">CRM Field</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {config.contactMapping.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2">
                          <Input
                            value={row.customerField}
                            onChange={(e) => {
                              const next = [...config.contactMapping];
                              next[idx] = { ...next[idx], customerField: e.target.value };
                              onChange({ ...config, contactMapping: next });
                            }}
                            className="bg-slate-50 h-8 text-xs font-medium"
                          />
                        </td>
                        <td className="px-4 py-2 text-center text-slate-400 font-bold">→</td>
                        <td className="px-4 py-2">
                          <Input
                            value={row.crmField}
                            onChange={(e) => {
                              const next = [...config.contactMapping];
                              next[idx] = { ...next[idx], crmField: e.target.value };
                              onChange({ ...config, contactMapping: next });
                            }}
                            className="bg-slate-50 h-8 text-xs font-medium"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => onChange({ ...config, contactMapping: config.contactMapping.filter((_, i) => i !== idx) })}
                            className="text-slate-400 hover:text-red-600 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => onChange({ ...config, contactMapping: [...config.contactMapping, { customerField: "", crmField: "" }] })}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer"
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
        <Button onClick={onSave} variant="primary" size="sm" className="gap-1.5">
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Chatbot Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi teknis perilaku bot, batas respons AI, idle session, integrasi API, dan sinkronisasi CRM.
        </p>
      </div>

      {/* Inner Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
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

"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Save,
  Send,
  Zap,
  Bot,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  UserCheck,
  CornerDownRight,
  HelpCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  AIAgent,
  ConversationFlow,
  ConversationFlowTrigger,
} from "@/types/dashboard-config";

type CreateConversationModalProps = {
  initialData?: ConversationFlow;
  availableAgents?: AIAgent[];
  onClose: () => void;
  onSave: (
    flow: Omit<ConversationFlow, "id" | "botResponse" | "lastUpdate">,
  ) => void;
};

type FlowNodeType =
  | "trigger"
  | "agent"
  | "message"
  | "menu"
  | "fallback"
  | "handoff";

export function CreateConversationModal({
  initialData,
  availableAgents = [],
  onClose,
  onSave,
}: CreateConversationModalProps) {
  const [activeTab, setActiveTab] = useState<"form" | "visual">("visual");
  const [selectedNode, setSelectedNode] = useState<FlowNodeType>("trigger");

  const [name, setName] = useState(initialData?.name ?? "");
  const [channel, setChannel] = useState(
    initialData?.channel ?? "WhatsApp - Johan Garage",
  );
  const [trigger, setTrigger] = useState(
    initialData?.trigger ?? "Pesan Pertama Masuk",
  );
  const [triggerKeywords, setTriggerKeywords] = useState(
    initialData?.triggerKeywords?.join(", ") ?? "",
  );
  const [initialMessage, setInitialMessage] = useState(
    initialData?.initialMessage ?? "",
  );
  const [interactiveMenu, setInteractiveMenu] = useState<
    { id: string; label: string; response: string }[]
  >(initialData?.interactiveMenu ?? []);
  const [fallbackMessage, setFallbackMessage] = useState(
    initialData?.fallbackMessage ?? "",
  );
  const [aiAgentId, setAiAgentId] = useState(initialData?.aiAgentId ?? "");
  const [handoffEnabled, setHandoffEnabled] = useState(
    initialData?.humanAgentHandoff.enabled ?? false,
  );
  const [handoffCondition, setHandoffCondition] = useState(
    initialData?.humanAgentHandoff.condition ?? "",
  );

  const normalizedTriggerMap: Record<string, ConversationFlowTrigger> = {
    "Pesan Pertama Masuk": "first_incoming_message",
    "Pesan pertama masuk": "first_incoming_message",
    "Di luar jam kerja": "outside_office_hours",
    "Keyword tertentu": "keyword_match",
    "Tidak ada balasan dari agent": "customer_asks_admin",
  };

  const addMenuItem = () => {
    setInteractiveMenu([
      ...interactiveMenu,
      { id: "btn_" + Date.now(), label: "", response: "" },
    ]);
  };

  const removeMenuItem = (id: string) => {
    setInteractiveMenu(interactiveMenu.filter((item) => item.id !== id));
  };

  const updateMenuItem = (
    id: string,
    field: "label" | "response",
    value: string,
  ) => {
    setInteractiveMenu(
      interactiveMenu.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSave = (status: "Published" | "Draft") => {
    onSave({
      name,
      channel,
      trigger,
      normalizedTrigger:
        normalizedTriggerMap[trigger] ?? "first_incoming_message",
      triggerKeywords: triggerKeywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      initialMessage,
      interactiveMenu,
      fallbackMessage,
      aiAgentId: aiAgentId || undefined,
      humanAgentHandoff: {
        enabled: handoffEnabled,
        condition: handoffCondition,
      },
      status,
    });
  };

  // Render Inspector Sidebar content based on selectedNode
  const renderInspector = () => {
    switch (selectedNode) {
      case "trigger":
        return (
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Zap className="h-4 w-4 text-emerald-400" />
                Trigger Settings
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Atur saluran masuk dan kondisi pemicu alur chat.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Saluran Masuk (Channel)
              </label>
              <select
                className="flex h-9 w-full rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="WhatsApp - Johan Garage">
                  WhatsApp - Johan Garage
                </option>
                <option value="Instagram DM">Instagram DM</option>
                <option value="Website Chat Widget">Website Chat Widget</option>
                <option value="Telegram">Telegram</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Pemicu Alur (Trigger)
              </label>
              <select
                className="flex h-9 w-full rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
              >
                <option value="Pesan Pertama Masuk">Pesan Pertama Masuk</option>
                <option value="Di luar jam kerja">Di luar jam kerja</option>
                <option value="Keyword tertentu">Keyword tertentu</option>
                <option value="Tidak ada balasan dari agent">
                  Tidak ada balasan dari agent
                </option>
              </select>
            </div>

            {trigger === "Keyword tertentu" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Kata Kunci Pemicu
                </label>
                <Input
                  placeholder="servis, booking, harga, sparepart"
                  value={triggerKeywords}
                  onChange={(e) => setTriggerKeywords(e.target.value)}
                  className="h-9 bg-black/40 text-xs"
                />
                <p className="text-[10px] text-slate-500">
                  Pisahkan beberapa kata kunci dengan tanda koma.
                </p>
              </div>
            )}
          </div>
        );
      case "agent":
        return (
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Bot className="h-4 w-4 text-purple-400" />
                AI Agent Settings
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Pilih agen AI yang akan memproses respon dinamis.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Pilih AI Agent
              </label>
              <select
                className="flex h-9 w-full rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                value={aiAgentId}
                onChange={(e) => setAiAgentId(e.target.value)}
              >
                <option value="">Pilih otomatis berdasarkan channel</option>
                {availableAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      case "message":
        return (
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                Initial Message Settings
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Pesan sambutan atau pembuka alur percakapan.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Konten Pesan Awal
              </label>
              <Textarea
                placeholder="Halo! Selamat datang di Johan Garage. Ada yang bisa kami bantu?"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="min-h-[160px] bg-black/40 text-xs leading-relaxed"
              />
            </div>
          </div>
        );
      case "menu":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Interactive Menu
                </h3>
                <p className="mt-1 text-[11px] text-slate-400">
                  Menu tombol interaksi cepat untuk user.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={addMenuItem}
                className="h-7 gap-1 border-white/10 bg-transparent px-2.5 text-[10px] hover:border-white/20"
              >
                <Plus className="h-3 w-3" />
                Add Menu
              </Button>
            </div>

            {interactiveMenu.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-slate-500">
                Belum ada menu. Pelanggan hanya akan menerima pesan pembuka
                awal.
              </div>
            ) : (
              <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
                {interactiveMenu.map((item, idx) => (
                  <div
                    key={item.id}
                    className="relative space-y-2.5 rounded-xl border border-white/5 bg-black/30 p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold tracking-wider text-cyan-400 uppercase">
                        Pilihan {idx + 1}
                      </span>
                      <button
                        onClick={() => removeMenuItem(item.id)}
                        className="text-slate-500 transition hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Label Tombol (contoh: Tanya Harga)"
                        value={item.label}
                        onChange={(e) =>
                          updateMenuItem(item.id, "label", e.target.value)
                        }
                        className="h-8 border-white/5 bg-black/20 text-xs"
                      />
                      <Textarea
                        placeholder="Balasan otomatis jika tombol diklik..."
                        value={item.response}
                        onChange={(e) =>
                          updateMenuItem(item.id, "response", e.target.value)
                        }
                        className="min-h-[50px] border-white/5 bg-black/20 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "fallback":
        return (
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                Fallback Settings
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Pesan pengaman jika bot gagal mengenali maksud user.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Pesan Gagal Paham (Fallback)
              </label>
              <Textarea
                placeholder="Maaf kak, saya belum memahami pertanyaannya. Silakan hubungi admin."
                value={fallbackMessage}
                onChange={(e) => setFallbackMessage(e.target.value)}
                className="min-h-[140px] bg-black/40 text-xs leading-relaxed"
              />
            </div>
          </div>
        );
      case "handoff":
        return (
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <UserCheck className="h-4 w-4 text-rose-400" />
                Handoff Settings
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Pengalihan otomatis percakapan ke admin manusia.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-4">
              <div>
                <h4 className="text-xs font-bold text-white">
                  Forward to Human
                </h4>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Alihkan ke tim admin
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={handoffEnabled}
                  onChange={(e) => setHandoffEnabled(e.target.checked)}
                />
                <div className="h-5 w-9 rounded-full bg-slate-800 peer-checked:bg-cyan-500 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-slate-400 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-white"></div>
              </label>
            </div>

            {handoffEnabled && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-300">
                  Kondisi Pengalihan
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  value={handoffCondition}
                  onChange={(e) => setHandoffCondition(e.target.value)}
                >
                  <option value="">Pilih kondisi...</option>
                  <option value="Saat pelanggan memilih opsi Bicara dengan Admin">
                    Saat pelanggan memilih opsi Bicara dengan Admin
                  </option>
                  <option value="Saat bot tidak memahami pertanyaan">
                    Saat bot tidak memahami pertanyaan
                  </option>
                  <option value="Saat pelanggan mengirim keyword mendesak">
                    Saat pelanggan mengirim keyword mendesak
                  </option>
                </select>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div
        className={`relative my-4 flex w-full flex-col rounded-2xl border border-white/10 bg-[var(--color-surface)] shadow-2xl transition-all duration-300 ${
          activeTab === "visual" ? "h-[88vh] max-w-6xl" : "max-w-3xl"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-white/5 bg-[var(--color-surface)] px-6 py-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-white">
              {initialData ? "Edit Conversation" : "Create Conversation"}
            </h2>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                type="text"
                placeholder="Conversation Name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-6 min-w-[200px] border-b border-white/10 bg-transparent px-1 text-xs font-semibold text-slate-300 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/5 bg-[var(--color-surface)] px-6">
          <button
            onClick={() => setActiveTab("visual")}
            className={`border-b-2 px-4 py-3 text-xs font-bold tracking-wider uppercase transition ${
              activeTab === "visual"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Visual Puzzle Flow
          </button>
          <button
            onClick={() => setActiveTab("form")}
            className={`border-b-2 px-4 py-3 text-xs font-bold tracking-wider uppercase transition ${
              activeTab === "form"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Standard Form
          </button>
        </div>

        {/* Body content */}
        <div
          className={`custom-scrollbar flex-1 overflow-y-auto p-6 ${activeTab === "visual" ? "h-full bg-[#0a0f18]/30" : "max-h-[66vh]"}`}
        >
          {activeTab === "visual" ? (
            <div className="grid h-full min-h-[460px] grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Pane: Interactive Puzzle Canvas */}
              <div className="custom-scrollbar relative flex flex-col gap-4 overflow-y-auto rounded-2xl border border-white/5 bg-black/40 p-5 lg:col-span-7">
                {/* Dot Grid Background */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, #fff 1.5px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                <div className="relative z-10 space-y-4">
                  {/* Node 1: Trigger Block */}
                  <div
                    onClick={() => setSelectedNode("trigger")}
                    className={`cursor-pointer rounded-xl border bg-slate-900/60 p-4 backdrop-blur-md transition-all hover:scale-[1.01] ${
                      selectedNode === "trigger"
                        ? "border-emerald-500 shadow-lg ring-2 shadow-emerald-500/10 ring-emerald-500/20"
                        : "border-white/5 hover:border-emerald-500/40"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black tracking-wider text-emerald-400 uppercase">
                        <Zap className="h-3 w-3" />
                        Trigger
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {channel}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">
                      {trigger || "Pesan Pertama Masuk"}
                    </p>
                    {trigger === "Keyword tertentu" && triggerKeywords && (
                      <p className="mt-1 truncate text-[10px] text-slate-400">
                        Keywords: {triggerKeywords}
                      </p>
                    )}
                  </div>

                  {/* Connector Arrow 1 */}
                  <div className="flex justify-center text-slate-600">
                    <ArrowRight className="h-5 w-5 rotate-90" />
                  </div>

                  {/* Node 2: AI Agent Block */}
                  <div
                    onClick={() => setSelectedNode("agent")}
                    className={`cursor-pointer rounded-xl border bg-slate-900/60 p-4 backdrop-blur-md transition-all hover:scale-[1.01] ${
                      selectedNode === "agent"
                        ? "border-purple-500 shadow-lg ring-2 shadow-purple-500/10 ring-purple-500/20"
                        : "border-white/5 hover:border-purple-500/40"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-black tracking-wider text-purple-400 uppercase">
                        <Bot className="h-3 w-3" />
                        AI Agent
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">
                      {aiAgentId
                        ? availableAgents.find((a) => a.id === aiAgentId)
                            ?.name || "Selected Agent"
                        : "Otomatis (Pilih Berdasarkan Channel)"}
                    </p>
                  </div>

                  {/* Connector Arrow 2 */}
                  <div className="flex justify-center text-slate-600">
                    <ArrowRight className="h-5 w-5 rotate-90" />
                  </div>

                  {/* Node 3: Initial Message Block */}
                  <div
                    onClick={() => setSelectedNode("message")}
                    className={`cursor-pointer rounded-xl border bg-slate-900/60 p-4 backdrop-blur-md transition-all hover:scale-[1.01] ${
                      selectedNode === "message"
                        ? "border-cyan-500 shadow-lg ring-2 shadow-cyan-500/10 ring-cyan-500/20"
                        : "border-white/5 hover:border-cyan-500/40"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black tracking-wider text-cyan-400 uppercase">
                        <MessageSquare className="h-3 w-3" />
                        Initial Message
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-300 italic">
                      &ldquo;
                      {initialMessage ||
                        "Halo! Selamat datang di Johan Garage. Ada yang bisa kami bantu?"}
                      &rdquo;
                    </p>
                  </div>

                  {/* Connector Arrow 3 */}
                  <div className="flex justify-center text-slate-600">
                    <ArrowRight className="h-5 w-5 rotate-90" />
                  </div>

                  {/* Branching Layout: Interactive Menu Options & Fallbacks */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Node 4: Interactive Menu */}
                    <div
                      onClick={() => setSelectedNode("menu")}
                      className={`flex cursor-pointer flex-col justify-between rounded-xl border bg-slate-900/60 p-4 backdrop-blur-md transition-all hover:scale-[1.01] ${
                        selectedNode === "menu"
                          ? "border-cyan-400 shadow-lg ring-2 shadow-cyan-400/10 ring-cyan-400/20"
                          : "border-white/5 hover:border-cyan-400/40"
                      }`}
                    >
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black tracking-wider text-cyan-300 uppercase">
                            Buttons Menu
                          </span>
                        </div>

                        {interactiveMenu.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">
                            Tanpa menu tombol (Direct text).
                          </p>
                        ) : (
                          <div className="mt-1 space-y-2">
                            {interactiveMenu.map((item, index) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/30 p-2 text-xs"
                              >
                                <CornerDownRight className="h-3 w-3 shrink-0 text-cyan-400" />
                                <span className="max-w-[80px] truncate font-bold text-slate-300">
                                  {item.label || `Btn ${index + 1}`}
                                </span>
                                <span className="truncate text-[10px] text-slate-500">
                                  {item.response
                                    ? "↳ Balasan diatur"
                                    : "↳ Balasan kosong"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                        <span className="text-[10px] text-slate-500">
                          {interactiveMenu.length} Pilihan menu
                        </span>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            addMenuItem();
                            setSelectedNode("menu");
                          }}
                          className="h-6 gap-1 border-white/10 bg-transparent px-2 text-[9px] font-extrabold hover:border-white/20"
                        >
                          <Plus className="h-2.5 w-2.5" /> Add
                        </Button>
                      </div>
                    </div>

                    {/* Right Side Branches: Fallback & Handoff */}
                    <div className="space-y-4">
                      {/* Node 5: Fallback Message Block */}
                      <div
                        onClick={() => setSelectedNode("fallback")}
                        className={`cursor-pointer rounded-xl border bg-slate-900/60 p-4 backdrop-blur-md transition-all hover:scale-[1.01] ${
                          selectedNode === "fallback"
                            ? "border-amber-500 shadow-lg ring-2 shadow-amber-500/10 ring-amber-500/20"
                            : "border-white/5 hover:border-amber-500/40"
                        }`}
                      >
                        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-400 uppercase">
                          <AlertCircle className="h-2.5 w-2.5" />
                          Fallback
                        </span>
                        <p className="truncate text-[11px] leading-relaxed text-slate-400">
                          {fallbackMessage ||
                            "Maaf kak, saya belum memahami..."}
                        </p>
                      </div>

                      {/* Node 6: Forward to Human Block */}
                      <div
                        onClick={() => setSelectedNode("handoff")}
                        className={`cursor-pointer rounded-xl border bg-slate-900/60 p-4 backdrop-blur-md transition-all hover:scale-[1.01] ${
                          selectedNode === "handoff"
                            ? "border-rose-500 shadow-lg ring-2 shadow-rose-500/10 ring-rose-500/20"
                            : "border-white/5 hover:border-rose-500/40"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] font-black tracking-wider text-rose-400 uppercase">
                            <UserCheck className="h-2.5 w-2.5" />
                            Forward Handoff
                          </span>
                          <span
                            className={`h-2 w-2 rounded-full ${handoffEnabled ? "animate-pulse bg-emerald-400" : "bg-slate-600"}`}
                          />
                        </div>
                        <p className="text-[11px] font-bold text-slate-300">
                          {handoffEnabled
                            ? "Aktif (Handoff Admin)"
                            : "Tidak Aktif"}
                        </p>
                        {handoffEnabled && handoffCondition && (
                          <p className="mt-1 truncate text-[9px] text-slate-500">
                            Kondisi: {handoffCondition}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Pane: Inspector/Editor Panel */}
              <div className="custom-scrollbar flex max-h-[72vh] flex-col justify-between overflow-y-auto rounded-2xl border border-white/5 bg-white/2 p-5 lg:col-span-5">
                <div className="flex-1">{renderInspector()}</div>

                <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    Klik komponen puzzle untuk mengedit
                  </span>
                  <span className="rounded border border-white/5 bg-black/30 px-2 py-0.5 font-mono text-cyan-400 capitalize">
                    {selectedNode}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Standard Form Layout
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Conversation Name
                  </label>
                  <Input
                    placeholder="Contoh: Greeting Johan Garage"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-white/10 bg-black/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Channel
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option value="WhatsApp - Johan Garage">
                      WhatsApp - Johan Garage
                    </option>
                    <option value="Instagram DM">Instagram DM</option>
                    <option value="Website Chat Widget">
                      Website Chat Widget
                    </option>
                    <option value="Telegram">Telegram</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Trigger
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                >
                  <option value="Pesan Pertama Masuk">
                    Pesan Pertama Masuk
                  </option>
                  <option value="Di luar jam kerja">Di luar jam kerja</option>
                  <option value="Keyword tertentu">Keyword tertentu</option>
                  <option value="Tidak ada balasan dari agent">
                    Tidak ada balasan dari agent
                  </option>
                </select>
              </div>

              {trigger === "Keyword tertentu" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Trigger Keywords
                  </label>
                  <Input
                    placeholder="servis, booking, harga, sparepart"
                    value={triggerKeywords}
                    onChange={(e) => setTriggerKeywords(e.target.value)}
                    className="border-white/10 bg-black/20"
                  />
                  <p className="text-xs text-slate-500">
                    Pisahkan keyword dengan koma.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  AI Agent
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  value={aiAgentId}
                  onChange={(e) => setAiAgentId(e.target.value)}
                >
                  <option value="">Pilih otomatis berdasarkan channel</option>
                  {availableAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Initial Message
                </label>
                <Textarea
                  placeholder="Halo! Selamat datang di Johan Garage. Ada yang bisa kami bantu?"
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  className="min-h-[100px] border-white/10 bg-black/20"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-300">
                    Interactive Menu (Buttons/List)
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addMenuItem}
                    className="h-8 gap-2 border-white/10 bg-transparent px-3 py-1.5 text-xs hover:border-white/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Menu
                  </Button>
                </div>

                {interactiveMenu.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-sm text-slate-500">
                    Belum ada menu. Pelanggan hanya akan menerima pesan awal.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interactiveMenu.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-lg border border-white/5 bg-white/[0.01] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-400">
                            Menu {idx + 1}
                          </span>
                          <button
                            onClick={() => removeMenuItem(item.id)}
                            className="text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Label (contoh: Cek Servis)"
                            value={item.label}
                            onChange={(e) =>
                              updateMenuItem(item.id, "label", e.target.value)
                            }
                            className="h-9 border-white/10 bg-black/40 text-sm"
                          />
                          <Textarea
                            placeholder="Balasan ketika menu dipilih..."
                            value={item.response}
                            onChange={(e) =>
                              updateMenuItem(
                                item.id,
                                "response",
                                e.target.value,
                              )
                            }
                            className="min-h-[60px] border-white/10 bg-black/40 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Fallback Message
                </label>
                <p className="mb-1 text-xs text-slate-500">
                  Pesan ini dikirim jika bot tidak memahami input user.
                </p>
                <Textarea
                  placeholder="Maaf kak, saya belum memahami pertanyaannya. Silakan pilih menu yang tersedia atau hubungi admin."
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  className="min-h-[80px] border-white/10 bg-black/20"
                />
              </div>

              <div className="space-y-4 rounded-lg border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Forward to Human Agent
                    </h4>
                    <p className="text-xs text-slate-500">
                      Alihkan ke admin jika kondisi tertentu terpenuhi
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={handoffEnabled}
                      onChange={(e) => setHandoffEnabled(e.target.checked)}
                    />
                    <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-cyan-500 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                {handoffEnabled && (
                  <div className="space-y-2 border-t border-white/10 pt-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Kondisi Handoff
                    </label>
                    <select
                      className="flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      value={handoffCondition}
                      onChange={(e) => setHandoffCondition(e.target.value)}
                    >
                      <option value="">Pilih kondisi...</option>
                      <option value="Saat pelanggan memilih opsi Bicara dengan Admin">
                        Saat pelanggan memilih opsi Bicara dengan Admin
                      </option>
                      <option value="Saat bot tidak memahami pertanyaan">
                        Saat bot tidak memahami pertanyaan
                      </option>
                      <option value="Saat pelanggan mengirim keyword mendesak">
                        Saat pelanggan mengirim keyword mendesak
                      </option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between rounded-b-2xl border-t border-white/5 bg-[var(--color-surface)] px-6 py-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="border-transparent bg-transparent text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => handleSave("Draft")}
              className="gap-2 border-white/10 bg-transparent text-xs transition hover:border-white/20 hover:bg-white/5"
            >
              <Save className="h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSave("Draft")}
              className="gap-2 bg-cyan-500 text-xs font-semibold text-black transition hover:bg-cyan-600"
            >
              <Send className="h-4 w-4" />
              Continue to Builder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

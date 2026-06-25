"use client";

import { useState } from "react";
import { X, Plus, Trash2, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ConversationFlow } from "@/types/dashboard-config";

type CreateConversationModalProps = {
  initialData?: ConversationFlow;
  onClose: () => void;
  onSave: (flow: Omit<ConversationFlow, "id" | "botResponse" | "lastUpdate">) => void;
};

export function CreateConversationModal({ initialData, onClose, onSave }: CreateConversationModalProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [channel, setChannel] = useState(initialData?.channel ?? "WhatsApp - Johan Garage");
  const [trigger, setTrigger] = useState(initialData?.trigger ?? "Pesan Pertama Masuk");
  const [initialMessage, setInitialMessage] = useState(initialData?.initialMessage ?? "");
  const [interactiveMenu, setInteractiveMenu] = useState<{ id: string; label: string; response: string }[]>(
    initialData?.interactiveMenu ?? []
  );
  const [fallbackMessage, setFallbackMessage] = useState(initialData?.fallbackMessage ?? "");
  const [handoffEnabled, setHandoffEnabled] = useState(initialData?.humanAgentHandoff.enabled ?? false);
  const [handoffCondition, setHandoffCondition] = useState(initialData?.humanAgentHandoff.condition ?? "");

  const addMenuItem = () => {
    setInteractiveMenu([
      ...interactiveMenu,
      { id: "btn_" + Date.now(), label: "", response: "" }
    ]);
  };

  const removeMenuItem = (id: string) => {
    setInteractiveMenu(interactiveMenu.filter(item => item.id !== id));
  };

  const updateMenuItem = (id: string, field: "label" | "response", value: string) => {
    setInteractiveMenu(
      interactiveMenu.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = (status: "Published" | "Draft") => {
    onSave({
      name,
      channel,
      trigger,
      initialMessage,
      interactiveMenu,
      fallbackMessage,
      humanAgentHandoff: { enabled: handoffEnabled, condition: handoffCondition },
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4 sticky top-0 bg-[var(--color-surface)] z-10 rounded-t-xl">
          <h2 className="font-heading text-lg font-bold text-white">
            {initialData ? "Edit Conversation" : "Create Conversation"}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Conversation Name</label>
              <Input
                placeholder="Contoh: Greeting Johan Garage"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Channel</label>
              <select
                className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="WhatsApp - Johan Garage">WhatsApp - Johan Garage</option>
                <option value="Instagram DM">Instagram DM</option>
                <option value="Website Chat Widget">Website Chat Widget</option>
                <option value="Telegram">Telegram</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Trigger</label>
            <select
              className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
            >
              <option value="Pesan Pertama Masuk">Pesan Pertama Masuk</option>
              <option value="Di luar jam kerja">Di luar jam kerja</option>
              <option value="Keyword tertentu">Keyword tertentu</option>
              <option value="Tidak ada balasan dari agent">Tidak ada balasan dari agent</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Initial Message</label>
            <Textarea
              placeholder="Halo! Selamat datang di Johan Garage. Ada yang bisa kami bantu?"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              className="min-h-[100px] bg-black/20"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-300">Interactive Menu (Buttons/List)</label>
              <Button type="button" variant="secondary" onClick={addMenuItem} className="h-8 px-3 py-1.5 gap-2 bg-transparent text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Menu
              </Button>
            </div>
            
            {interactiveMenu.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-center text-sm text-slate-500">
                Belum ada menu. Pelanggan hanya akan menerima pesan awal.
              </div>
            ) : (
              <div className="space-y-3">
                {interactiveMenu.map((item, idx) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-white/5 bg-white/[0.01] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-brand)]">Menu {idx + 1}</span>
                      <button onClick={() => removeMenuItem(item.id)} className="text-slate-500 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Label (contoh: Cek Servis)"
                        value={item.label}
                        onChange={(e) => updateMenuItem(item.id, "label", e.target.value)}
                        className="bg-black/40 h-9 text-sm"
                      />
                      <Textarea
                        placeholder="Balasan ketika menu dipilih..."
                        value={item.response}
                        onChange={(e) => updateMenuItem(item.id, "response", e.target.value)}
                        className="min-h-[60px] bg-black/40 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Fallback Message</label>
            <p className="text-xs text-slate-500 mb-1">Pesan ini dikirim jika bot tidak memahami input user.</p>
            <Textarea
              placeholder="Maaf kak, saya belum memahami pertanyaannya. Silakan pilih menu yang tersedia atau hubungi admin."
              value={fallbackMessage}
              onChange={(e) => setFallbackMessage(e.target.value)}
              className="min-h-[80px] bg-black/20"
            />
          </div>

          <div className="rounded-lg border border-[var(--color-border)] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Forward to Human Agent</h4>
                <p className="text-xs text-slate-500">Alihkan ke admin jika kondisi tertentu terpenuhi</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={handoffEnabled}
                  onChange={(e) => setHandoffEnabled(e.target.checked)}
                />
                <div className="h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-brand)] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
              </label>
            </div>
            
            {handoffEnabled && (
              <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                <label className="text-xs font-semibold text-slate-300">Kondisi Handoff</label>
                <select
                  className="flex h-9 w-full rounded-md border border-[var(--color-border)] bg-black/20 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
                  value={handoffCondition}
                  onChange={(e) => setHandoffCondition(e.target.value)}
                >
                  <option value="">Pilih kondisi...</option>
                  <option value="Saat pelanggan memilih Bicara dengan Admin">Saat pelanggan memilih opsi Bicara dengan Admin</option>
                  <option value="Saat bot tidak memahami pertanyaan">Saat bot tidak memahami pertanyaan</option>
                  <option value="Saat pelanggan mengirim keyword mendesak">Saat pelanggan mengirim keyword mendesak</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-4 bg-[var(--color-surface)] rounded-b-xl">
          <Button variant="secondary" onClick={onClose} className="text-slate-400 hover:text-white bg-transparent border-transparent">
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => handleSave("Draft")} className="gap-2 bg-transparent">
              <Save className="h-4 w-4" />
              Save as Draft
            </Button>
            <Button onClick={() => handleSave("Published")} className="gap-2">
              <Send className="h-4 w-4" />
              Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

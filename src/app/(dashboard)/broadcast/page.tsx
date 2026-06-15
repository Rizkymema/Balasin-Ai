"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Megaphone, SendHorizontal, Users2, WandSparkles } from "lucide-react";

import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import type { BroadcastRecord, BroadcastStatus } from "@/types/operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BroadcastPage() {
  const { data, patchData } = useDashboardOperations();
  const [selectedId, setSelectedId] = useState<string>(data.broadcasts[0]?.id ?? "");

  const selectedBroadcast =
    data.broadcasts.find((item) => item.id === selectedId) ?? data.broadcasts[0];

  const stats = useMemo(
    () => [
      {
        label: "Draft",
        value: `${data.broadcasts.filter((item) => item.status === "draft").length}`,
      },
      {
        label: "Scheduled",
        value: `${data.broadcasts.filter((item) => item.status === "scheduled").length}`,
      },
      {
        label: "Sent",
        value: `${data.broadcasts.filter((item) => item.status === "sent").length}`,
      },
      {
        label: "Total sent count",
        value: `${data.broadcasts.reduce((total, item) => total + item.sentCount, 0)}`,
      },
    ],
    [data.broadcasts],
  );

  const updateBroadcast = (updates: Partial<BroadcastRecord>) => {
    if (!selectedBroadcast) {
      return;
    }

    patchData((current) => ({
      ...current,
      broadcasts: current.broadcasts.map((item) =>
        item.id === selectedBroadcast.id ? { ...item, ...updates } : item,
      ),
    }));
  };

  const addDraftCampaign = () => {
    const nextCampaign: BroadcastRecord = {
      id: `broadcast-${Date.now()}`,
      name: "Campaign baru",
      channel: "WhatsApp",
      audience: "Segment baru",
      template: "Halo kak, ini pesan broadcast baru dari dashboard.",
      status: "draft",
      scheduledAt: "Belum dijadwalkan",
      sentCount: 0,
    };

    patchData((current) => ({
      ...current,
      broadcasts: [nextCampaign, ...current.broadcasts],
    }));

    setSelectedId(nextCampaign.id);
  };

  const sendNow = () => {
    if (!selectedBroadcast) {
      return;
    }

    updateBroadcast({
      status: "sent",
      scheduledAt: "Dikirim sekarang",
      sentCount: selectedBroadcast.sentCount + 24,
    });
  };

  if (!selectedBroadcast) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/8 bg-gradient-to-r from-white/[0.04] to-transparent p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge>Broadcast</Badge>
            <h1 className="mt-3 text-3xl font-bold text-white">
              Broadcast campaign sekarang siap diatur langsung dari dashboard.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Modul ini disiapkan untuk follow-up WA, IG DM, dan reminder terjadwal. Nanti
              tinggal dihubungkan ke worker queue agar pengiriman berjalan otomatis.
            </p>
          </div>

          <Button onClick={addDraftCampaign} className="rounded-xl px-5 py-3 text-xs">
            Campaign baru
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="glass-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Campaign list</h2>
              <p className="text-xs text-slate-400">
                Draft, scheduled, dan sent campaign yang nanti bisa dikirim oleh automation.
              </p>
            </div>
            <Badge>{data.broadcasts.length} campaign</Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.broadcasts.map((item) => (
                <TableRow
                  key={item.id}
                  className={item.id === selectedBroadcast.id ? "bg-white/[0.04]" : undefined}
                >
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="text-left text-white"
                    >
                      {item.name}
                    </button>
                  </TableCell>
                  <TableCell>{item.channel}</TableCell>
                  <TableCell>{item.audience}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{item.sentCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="glass-panel p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-3 text-cyan-300">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Campaign detail</h2>
              <p className="text-xs text-slate-400">
                Konten, audience, jadwal, dan status campaign.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nama campaign</label>
              <Input
                value={selectedBroadcast.name}
                onChange={(event) => updateBroadcast({ name: event.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Channel</label>
                <Select
                  value={selectedBroadcast.channel}
                  onChange={(event) =>
                    updateBroadcast({
                      channel: event.target.value as BroadcastRecord["channel"],
                    })
                  }
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram DM">Instagram DM</option>
                  <option value="Website Chat">Website Chat</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Status</label>
                <Select
                  value={selectedBroadcast.status}
                  onChange={(event) =>
                    updateBroadcast({
                      status: event.target.value as BroadcastStatus,
                    })
                  }
                >
                  <option value="draft">draft</option>
                  <option value="scheduled">scheduled</option>
                  <option value="sent">sent</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Audience / segment</label>
              <Input
                value={selectedBroadcast.audience}
                onChange={(event) =>
                  updateBroadcast({ audience: event.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Jadwal</label>
              <Input
                value={selectedBroadcast.scheduledAt}
                onChange={(event) =>
                  updateBroadcast({ scheduledAt: event.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Template pesan</label>
              <Textarea
                rows={5}
                value={selectedBroadcast.template}
                onChange={(event) =>
                  updateBroadcast({ template: event.target.value })
                }
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={sendNow} className="rounded-xl px-5 py-3 text-xs">
                Kirim sekarang
              </Button>
              <Button
                variant="secondary"
                onClick={() => updateBroadcast({ status: "scheduled" })}
                className="rounded-xl px-5 py-3 text-xs"
              >
                Jadwalkan campaign
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <Users2 className="h-5 w-5 text-cyan-300" />
            <h3 className="text-base font-semibold text-white">Audience aware</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Segment audience bisa nanti dihubungkan ke lead status, tag customer,
            booking pending, atau list khusus dari backend.
          </p>
        </Card>

        <Card className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-amber-300" />
            <h3 className="text-base font-semibold text-white">Queue ready</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Status `scheduled` dipertahankan sederhana supaya nanti worker n8n atau backend
            bisa mengambil campaign berdasarkan jadwal tanpa ubah model UI.
          </p>
        </Card>

        <Card className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <WandSparkles className="h-5 w-5 text-emerald-300" />
            <h3 className="text-base font-semibold text-white">AI-assisted copy</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Tahap selanjutnya bisa ditambahkan generator template berbasis AI yang tetap
            membaca knowledge, produk, dan aturan safety dari dashboard.
          </p>
        </Card>
      </div>

      <Card className="glass-panel p-5">
        <div className="flex items-start gap-3">
          <SendHorizontal className="mt-0.5 h-5 w-5 text-cyan-300" />
          <p className="text-sm leading-7 text-slate-300">
            Saat ini halaman ini masih dashboard-first. Langkah berikutnya tinggal menghubungkan
            `send now`, `scheduled`, dan audit log ke queue pengiriman real.
          </p>
        </div>
      </Card>
    </div>
  );
}

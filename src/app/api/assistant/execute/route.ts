import { NextResponse } from "next/server";
import { getDashboardOperationsRecord } from "@/server/repositories/dashboard-repository";
import { sendInboxReply } from "@/server/services/operations-service";
import { upsertJsonRowAsync } from "@/server/db";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import type { ChannelKind, ConversationRecord } from "@/types/operations";

export const dynamic = "force-dynamic";

interface TargetCustomer {
  id: string;
  name: string;
  recipientId: string;
  channel: ChannelKind;
}

export async function POST(request: Request) {
  const { response: sessionResponse } = await requireApiSession();
  if (sessionResponse) {
    return sessionResponse;
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      targets?: TargetCustomer[];
      messageTemplate?: string;
      data?: Record<string, any>;
    };

    const action = body.action;

    if (!action) {
      return jsonError("Action tidak boleh kosong.", 400);
    }

    // --- AKSI: SEND FOLLOW UP ---
    if (action === "send_followup") {
      const targets = body.targets ?? [];
      const template = body.messageTemplate ?? "";

      if (targets.length === 0) {
        return jsonError("Daftar target tidak boleh kosong.", 400);
      }

      if (!template.trim()) {
        return jsonError("Template pesan tidak boleh kosong.", 400);
      }

      const operations = await getDashboardOperationsRecord();
      const results: Array<{ id: string; name: string; success: boolean; error?: string }> = [];

      for (const target of targets) {
        try {
          const customMessage = template.replace(/{name}/g, target.name);

          let conversation = operations.conversations.find(
            (c) =>
              c.customerId === target.id ||
              c.phone === target.recipientId ||
              c.username === target.recipientId
          );

          let conversationId = conversation?.id;

          if (!conversationId) {
            conversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const newConversation: ConversationRecord = {
              id: conversationId,
              customerId: target.id,
              name: target.name,
              channel: target.channel,
              lastMessage: customMessage,
              timestamp: new Date().toISOString(),
              unreadCount: 0,
              status: "ai_active",
              messages: [],
              tags: ["Follow-up AI"],
              notes: "Dimulai oleh Asisten AI Copilot setelah persetujuan admin.",
              summary: "Follow-up awal oleh AI Copilot.",
              phone: target.channel === "WhatsApp" ? target.recipientId : undefined,
              username: target.channel === "Instagram DM" ? target.recipientId : undefined,
              assignedTo: "AI Agent",
              responseTimeSeconds: 0,
              lastIntent: "follow_up",
              sentiment: "neutral",
              aiConfidence: 100,
              riskLevel: "low",
              ticketId: null,
              automation: {
                activeFlowId: null,
                activeFlowName: null,
                activeAgentId: null,
                activeAgentName: null,
                aiReplyCount: 0,
                lastInboundAt: null,
                lastOutboundAt: new Date().toISOString(),
                lastHumanReplyAt: null,
                idleCheckAt: null,
                handoffReason: null,
                lastEvent: null,
                logs: [],
              },
            };

            await upsertJsonRowAsync("conversations", newConversation);
          }

          await sendInboxReply({
            conversationId,
            message: customMessage,
          });

          results.push({
            id: target.id,
            name: target.name,
            success: true,
          });
        } catch (err) {
          results.push({
            id: target.id,
            name: target.name,
            success: false,
            error: err instanceof Error ? err.message : "Gagal mengirim pesan.",
          });
        }
      }

      const failedCount = results.filter((r) => !r.success).length;
      if (failedCount === targets.length) {
        return jsonError("Gagal mengirimkan follow-up ke seluruh target.", 500, { results });
      }

      return jsonOk({
        ok: true,
        message: `Berhasil mengirimkan ${targets.length - failedCount} dari ${targets.length} pesan follow-up.`,
        results,
      });
    }

    // --- AKSI: CREATE BOOKING ---
    if (action === "create_booking") {
      const data = body.data ?? {};
      if (!data.customer || !data.service || !data.date || !data.slot) {
        return jsonError("Data booking tidak lengkap (customer, service, date, slot wajib diisi).", 400);
      }

      const newBooking = {
        id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        customerId: data.customerId || `cust-${Date.now()}`,
        customer: data.customer,
        service: data.service,
        date: data.date,
        slot: data.slot,
        channel: data.channel || "Website Chat",
        status: "New",
        technician: "Montir Utama",
        branch: "Johan Garage Pusat",
        note: data.note || "Dibuat otomatis oleh AI Copilot.",
      };

      await upsertJsonRowAsync("bookings", newBooking);
      return jsonOk({
        ok: true,
        message: `Jadwal booking untuk ${data.customer} pada ${data.date} (slot ${data.slot}) berhasil dibuat!`,
        booking: newBooking,
      });
    }

    // --- AKSI: CREATE TICKET ---
    if (action === "create_ticket") {
      const data = body.data ?? {};
      if (!data.customerName || !data.issueType) {
        return jsonError("Data tiket tidak lengkap (customerName dan issueType wajib diisi).", 400);
      }

      const newTicket = {
        id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        conversationId: `conv-${Date.now()}`,
        customerId: data.customerId || `cust-${Date.now()}`,
        customerName: data.customerName,
        channel: data.channel || "Website Chat",
        issueType: data.issueType,
        priority: data.priority || "medium",
        status: "open",
        assignedTo: "Admin Desk",
        summary: data.summary || `Tiket keluhan: ${data.issueType}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolutionNote: "",
      };

      await upsertJsonRowAsync("tickets", newTicket);
      return jsonOk({
        ok: true,
        message: `Tiket keluhan [${newTicket.priority}] untuk ${data.customerName} berhasil dibuat!`,
        ticket: newTicket,
      });
    }

    // --- AKSI: CREATE CONTACT ---
    if (action === "create_contact") {
      const data = body.data ?? {};
      if (!data.name) {
        return jsonError("Nama kontak wajib diisi.", 400);
      }

      const newCustomer = {
        id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: data.name,
        channel: data.channel || "WhatsApp",
        leadStatus: "New Lead",
        tags: ["AI Created"],
        lastContact: new Date().toISOString(),
        assignedTo: "AI Agent",
        totalConversation: 0,
        revenueHint: "Rp0",
        note: data.note || "Daftar kontak baru dibuat oleh AI Copilot.",
        phone: data.phone || "",
        email: data.email || "",
        username: data.username || "",
        segment: "New Customer",
        activeTicketCount: 0,
      };

      await upsertJsonRowAsync("customers", newCustomer);
      return jsonOk({
        ok: true,
        message: `Kontak pelanggan baru ${data.name} berhasil ditambahkan!`,
        customer: newCustomer,
      });
    }

    // --- AKSI: CREATE PRODUCT ---
    if (action === "create_product") {
      const data = body.data ?? {};
      if (!data.name || !data.price || !data.stock) {
        return jsonError("Data produk tidak lengkap (name, price, dan stock wajib diisi).", 400);
      }

      const newProduct = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: data.name,
        sku: `SKU-${Date.now().toString().slice(-6)}`,
        category: data.category || "Suku Cadang",
        brand: data.brand || "Johan Garage",
        price: data.price.startsWith("Rp") ? data.price : `Rp${data.price}`,
        stock: String(data.stock),
        compatibility: data.compatibility || "Semua Tipe Motor",
        description: data.description || "Ditambahkan otomatis oleh AI Copilot.",
        status: "active",
        source: "postgresql",
        updatedAt: new Date().toISOString(),
      };

      await upsertJsonRowAsync("products", newProduct);
      return jsonOk({
        ok: true,
        message: `Produk baru ${data.name} seharga ${newProduct.price} (stok: ${data.stock}) berhasil ditambahkan ke inventaris!`,
        product: newProduct,
      });
    }

    return jsonError("Action tidak didukung.", 400);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Terjadi kesalahan internal saat eksekusi aksi.",
      500
    );
  }
}

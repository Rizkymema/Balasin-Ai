import { getDashboardConfigRecord, getDashboardOperationsRecord } from "@/server/repositories/dashboard-repository";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import type { DashboardConfig } from "@/types/dashboard-config";
import { resolveAppUrl } from "@/lib/app-url";
import { assertSafeExternalUrl } from "@/server/security/safe-fetch";
import {
  getKnowledgeChunks,
  type KnowledgeChunk,
} from "@/server/repositories/dashboard-repository";

type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

const SEARCH_STOP_WORDS = new Set([
  "yang",
  "dan",
  "atau",
  "untuk",
  "dengan",
  "saya",
  "kami",
  "anda",
  "kak",
  "min",
  "di",
  "ke",
  "dari",
  "ada",
  "apa",
  "itu",
  "ini",
  "the",
  "is",
  "are",
  "of",
  "a",
  "an",
]);

const SEARCH_TOKEN_ALIAS_MAP: Record<string, string> = {
  brp: "berapa",
  brapa: "berapa",
  hrg: "harga",
  biaya: "harga",
  tarif: "harga",
  ongkos: "harga",
  price: "harga",
  pricelist: "harga",
  pricing: "harga",
  svc: "servis",
  srvis: "servis",
  service: "servis",
  services: "servis",
  servicing: "servis",
  perawatan: "servis",
  repair: "servis",
  lokasi: "alamat",
  maps: "alamat",
  map: "alamat",
  gmaps: "alamat",
  operasional: "jam",
  jadwal: "jam",
  jm: "jam",
  open: "buka",
  close: "tutup",
  closed: "tutup",
  reservasi: "booking",
  pemesanan: "booking",
};

function normalizeSearchText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((token) => SEARCH_TOKEN_ALIAS_MAP[token] ?? token)
    .join(" ");
}

function tokenizeSearchText(text: string) {
  return normalizeSearchText(text)
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !SEARCH_STOP_WORDS.has(token));
}

function scoreText(query: string, text: string): number {
  const q = normalizeSearchText(query);
  const t = normalizeSearchText(text);
  if (!q || !t) return 0;
  if (t.includes(q) || q.includes(t)) return 0.95;

  const qTokens = Array.from(new Set(tokenizeSearchText(q)));
  const tTokens = Array.from(new Set(tokenizeSearchText(t)));
  if (qTokens.length === 0 || tTokens.length === 0) return 0;

  const matches = qTokens.filter((token) =>
    tTokens.some(
      (candidateToken) =>
        candidateToken === token ||
        (token.length >= 4 &&
          candidateToken.length >= 4 &&
          (candidateToken.includes(token) || token.includes(candidateToken))),
    ),
  );
  const overlap = matches.length / qTokens.length;
  const phraseBonus =
    matches.length >= 2 && t.includes(qTokens.slice(0, 3).join(" ")) ? 0.15 : 0;

  return Math.min(1, overlap + phraseBonus);
}

function searchFaqs(query: string, faqs: DashboardConfig["knowledgeBase"]["faqs"]) {
  return faqs
    .map(faq => {
      const qScore = scoreText(query, faq.question || "");
      const aScore = scoreText(query, faq.answer || "");
      const score = Math.max(qScore * 1.15, (qScore + aScore) / 2);
      return { faq, score };
    })
    .filter(item => item.score >= 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.faq);
}

function isInactiveKnowledgeChunk(chunk: KnowledgeChunk) {
  const content = normalizeSearchText(chunk.content);
  return (
    content.includes("status nonaktif") ||
    content.includes("status non active") ||
    content.includes("status inactive") ||
    content.includes("status non aktif")
  );
}

function parseStructuredKnowledgeChunk(content: string) {
  const result = {
    category: "",
    triggers: [] as string[],
    guidance: "",
  };

  for (const part of content.split("|").map((item) => item.trim()).filter(Boolean)) {
    const colonIndex = part.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }

    const key = normalizeSearchText(part.slice(0, colonIndex));
    const value = part.slice(colonIndex + 1).trim();
    if (!value) {
      continue;
    }

    if (key === "kategori") {
      result.category = value;
      continue;
    }

    if (key === "kata kunci" || key === "trigger" || key === "kata kunci trigger") {
      result.triggers = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      continue;
    }

    if (key === "panduan jawaban ai" || key === "jawaban ai" || key === "panduan") {
      result.guidance = value;
    }
  }

  return result;
}

function extractTriggersFromContent(content: string) {
  const match = content.match(/(?:Kata Kunci \/ Trigger|Kata Kunci|Trigger)\s*:\s*([^|]+)/i);
  return match
    ? match[1]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function scoreTriggers(query: string, triggers: string[]) {
  const normalizedQuery = normalizeSearchText(query);
  return triggers.reduce((bestScore, trigger) => {
    const normalizedTrigger = normalizeSearchText(trigger);
    if (!normalizedTrigger) {
      return bestScore;
    }

    if (
      normalizedQuery === normalizedTrigger ||
      normalizedQuery.includes(normalizedTrigger)
    ) {
      return Math.max(bestScore, 1);
    }

    return Math.max(bestScore, scoreText(query, trigger));
  }, 0);
}

function searchChunks(query: string, chunks: KnowledgeChunk[]) {
  return chunks
    .map(chunk => {
      const metadata = chunk.metadata ?? {};
      const structured = parseStructuredKnowledgeChunk(chunk.content);
      const triggers =
        structured.triggers.length > 0
          ? structured.triggers
          : extractTriggersFromContent(chunk.content);
      const score = Math.max(
        scoreText(query, chunk.content || ""),
        scoreText(query, structured.category),
        scoreText(query, structured.guidance),
        scoreTriggers(query, triggers),
        scoreText(query, metadata.question || ""),
        scoreText(query, metadata.answer || ""),
        scoreText(query, metadata.sourceName || ""),
      );
      return { chunk, score };
    })
    .filter(item => item.score >= 0.15 && !isInactiveKnowledgeChunk(item.chunk))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(item => item.chunk);
}

function formatChunkForPrompt(chunk: KnowledgeChunk, index: number) {
  const metadata = chunk.metadata ?? {};
  const structured = parseStructuredKnowledgeChunk(chunk.content);
  const sourceParts = [
    metadata.sourceName,
    structured.category ? `kategori=${structured.category}` : "",
    metadata.sourceType ? `tipe=${metadata.sourceType}` : "",
    metadata.sourceUrl ? `url=${metadata.sourceUrl}` : "",
  ].filter(Boolean);
  const rawContent = structured.guidance || metadata.answer || chunk.content;
  const content =
    rawContent.length > 1200
      ? `${rawContent.slice(0, 1197).trim()}...`
      : rawContent.trim();

  return [
    `Kutipan ${index + 1}: ${sourceParts.join(" | ") || "Knowledge Base"}`,
    structured.triggers.length > 0
      ? `Kata kunci: ${structured.triggers.join(", ")}`
      : "",
    metadata.question ? `Pertanyaan terkait: ${metadata.question}` : "",
    metadata.answer ? `Jawaban terkait: ${metadata.answer}` : "",
    `Konten: ${content}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function resolveProviderEndpoint(config: DashboardConfig) {
  const customBaseUrl = config.aiProvider.baseUrl.trim();
  if (customBaseUrl) {
    if (/\/(chat\/completions|responses)$/i.test(customBaseUrl)) {
      return customBaseUrl;
    }
    return `${customBaseUrl.replace(/\/+$/, "")}/chat/completions`;
  }

  switch (config.aiProvider.provider) {
    case "openrouter":
      return "https://openrouter.ai/api/v1/chat/completions";
    case "openai":
      return "https://api.openai.com/v1/chat/completions";
    case "gemini": {
      const model = config.aiProvider.model.trim() || "gemini-pro";
      const apiKey = config.aiProvider.apiKey.trim();
      return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    }
    case "anthropic":
      return "https://api.anthropic.com/v1/messages";
    default:
      return "https://api.openai.com/v1/chat/completions";
  }
}

function extractAiResponseText(payload: unknown, provider?: string) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  if (provider === "anthropic") {
    const anthropic = payload as { content?: Array<{ type?: string; text?: string }> };
    const text = anthropic.content
      ?.filter((item) => item.type === "text")
      .map((item) => item.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n");
    return text?.trim() ?? "";
  }

  if (provider === "gemini") {
    const gemini = payload as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = gemini.candidates?.[0]?.content?.parts
      ?.map((p) => p.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n");
    return text?.trim() ?? "";
  }

  const response = payload as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
    output_text?: string;
  };

  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .filter((item) => item.type === "text")
      .map((item) => item.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

export async function POST(request: Request) {
  const { response: sessionResponse } = await requireApiSession();
  if (sessionResponse) {
    return sessionResponse;
  }

  try {
    const body = (await request.json()) as {
      message?: string;
      history?: ChatHistoryItem[];
    };

    if (!body.message?.trim()) {
      return jsonError("Pesan wajib diisi.", 400);
    }

    const config = await getDashboardConfigRecord();
    const ops = await getDashboardOperationsRecord();

    if (!config.aiProvider.apiKey.trim()) {
      // Fallback response if AI provider is not configured
      return jsonOk({
        ok: true,
        reply: "Asisten AI belum aktif karena API Key belum diisi di menu Chatbot Settings. Silakan hubungkan API Key Anda terlebih dahulu untuk mulai bertanya.",
      });
    }

    // Find unbooked customers
    const bookedCustomerIds = new Set(ops.bookings.map(b => b.customerId));
    const bookedCustomerNames = new Set(ops.bookings.map(b => b.customer.trim().toLowerCase()));
    
    const unbookedCustomers = ops.customers.filter(c => {
      const idMatch = bookedCustomerIds.has(c.id);
      const nameMatch = bookedCustomerNames.has(c.name.trim().toLowerCase());
      return !idMatch && !nameMatch;
    });

    // Build workspace context
    const connectedChannels: string[] = [];
    if (config.channels.whatsapp.enabled) connectedChannels.push(`WhatsApp (${config.channels.whatsapp.status})`);
    if (config.channels.instagram.enabled) connectedChannels.push(`Instagram DM (${config.channels.instagram.status})`);
    if (config.channels.webchat.enabled) connectedChannels.push("Webchat");

    // Search FAQs and document chunks based on user query
    const queryMessage = body.message || "";
    const matchedFaqs = searchFaqs(queryMessage, config.knowledgeBase.faqs || []);
    let matchedChunks: KnowledgeChunk[] = [];
    try {
      const chunks = await getKnowledgeChunks();
      matchedChunks = searchChunks(queryMessage, chunks);
    } catch (e) {
      console.error("Failed to search knowledge chunks:", e);
    }

    const workspaceName = config.workspace.name || "bisnis ini";
    const hasKnowledgeMatches = matchedFaqs.length > 0 || matchedChunks.length > 0;
    const customInstructions = config.aiAgent.replyInstructions.trim();
    const customInstructionsSection = customInstructions
      ? `\n=== CUSTOM INSTRUCTIONS CHATBOT ===\nInstruksi berikut wajib dipatuhi selama tidak bertentangan dengan data sistem dan keamanan:\n${customInstructions}\n`
      : "";

    const systemPrompt = `
Anda adalah Balesin Desk AI Copilot, asisten cerdas internal untuk admin dan staf ${workspaceName}.
Tugas Anda adalah membantu admin dalam menjawab pertanyaan, menganalisis data, memberikan petunjuk cara kerja sistem, atau merangkum data operasional ${workspaceName} secara akurat.
${customInstructionsSection}

Berikut adalah DATA SISTEM TERBARU:
=== INFORMASI WORKSPACE & CHANNEL ===
Nama Workspace: ${config.workspace.name}
Industri: ${config.workspace.industry}
Jam Kerja: ${config.workspace.businessHours}
Alamat: ${config.workspace.address}
Email Support: ${config.workspace.supportEmail}
Bahasa: ${config.workspace.language}
Channel Aktif: ${connectedChannels.join(", ") || "Tidak ada"}

=== DATA KNOWLEDGE BASE ===
Jumlah FAQ: ${config.knowledgeBase.faqs.length} FAQ aktif.
Jumlah Dokumen Synced: ${config.knowledgeBase.documents.length} dokumen.
Website Synced: ${config.knowledgeBase.websiteUrls.join(", ") || "Tidak ada"}
Google Sheets Synced: ${config.knowledgeBase.googleSheetUrls.join(", ") || "Tidak ada"}

=== DOKUMEN & FAQ RELEVAN (KNOWLEDGE RETRIEVAL) ===
Ditemukan beberapa data Q&A atau kutipan dokumen yang relevan dengan pertanyaan Anda:
--- FAQ RELEVAN ---
${matchedFaqs.map((f, idx) => `Q${idx+1}: ${f.question}\nA${idx+1}: ${f.answer}`).join("\n\n") || "Tidak ada FAQ yang langsung cocok."}

--- KUTIPAN DOKUMEN RELEVAN ---
${matchedChunks.map((chunk, idx) => formatChunkForPrompt(chunk, idx)).join("\n\n") || "Tidak ada kutipan dokumen yang langsung cocok."}

PRIORITAS JAWABAN KNOWLEDGE BASE:
${hasKnowledgeMatches
  ? "Ada data Knowledge Base yang cocok. Anda WAJIB menjadikan FAQ/Kutipan relevan di atas sebagai sumber utama jawaban. Jangan mengganti jawabannya dengan asumsi umum, data produk, data layanan, atau data operasional lain jika bertentangan dengan Knowledge Base."
  : "Tidak ada data Knowledge Base yang cocok langsung. Jika pertanyaan membutuhkan data bisnis spesifik, akui bahwa datanya belum tersedia dan arahkan admin untuk menambahkannya ke Knowledge Base."}

=== DATA OPERASIONAL LAINNYA ===
Jumlah Kontak Pelanggan: ${ops.customers.length} kontak.
Jumlah Tiket Support: ${ops.tickets.length} tiket.
Jumlah Booking Servis: ${ops.bookings.length} booking.
Jumlah Produk: ${ops.products.length} produk.
Jumlah Layanan/Jasa: ${ops.services.length} jasa.
Jumlah Percakapan Aktif: ${ops.conversations.length} percakapan.

=== DAFTAR DETAIL TIKET ===
${ops.tickets.map((t, idx) => `${idx + 1}. [${t.status}] ${t.issueType} (Pelanggan: ${t.customerName}, Prioritas: ${t.priority})`).join("\n") || "Tidak ada tiket"}

=== DAFTAR DETAIL BOOKING ===
${ops.bookings.map((b, idx) => `${idx + 1}. [${b.status}] Tanggal ${b.date} slot ${b.slot} untuk ${b.customer} (Catatan: ${b.note || "-"})`).join("\n") || "Tidak ada booking"}

=== DAFTAR LAYANAN/JASA & PRODUK ===
Produk: ${ops.products.map(p => `${p.name} (Harga: Rp${p.price}, Stok: ${p.stock})`).join(", ") || "Tidak ada produk"}
Jasa: ${ops.services.map(s => `${s.name} (Harga: Rp${s.priceStart} - Rp${s.priceEnd}, Durasi: ${s.duration})`).join(", ") || "Tidak ada jasa"}

=== DAFTAR PELANGGAN YANG BELUM BOOKING ===
${unbookedCustomers.map((c, idx) => `${idx + 1}. Nama: ${c.name}, ID: ${c.id}, Channel: ${c.channel}, Kontak: ${c.phone || c.username || "-"}`).join("\n") || "Semua pelanggan sudah memiliki booking"}

Tugas Anda:
1. Jika ada FAQ/Kutipan Knowledge Base relevan, jawab langsung berdasarkan data tersebut dan sebutkan sumber ringkasnya bila membantu admin.
2. Jika admin menanyakan petunjuk cara kerja sistem (misalnya: cara menyambungkan WhatsApp, cara menambah FAQ, atau cara mengaktifkan filter komentar negatif), berikan instruksi langkah-demi-langkah berdasarkan menu yang ada di sidebar (Dashboard, Unified Inbox, Contacts, Products & Services, Booking, Broadcast, Channels, Reports, Team & Settings, Automation).
3. Berikan saran analisis atau ringkasan jika diminta (misal: "Berapa banyak tiket yang berstatus Open?", "Buatkan rangkuman booking untuk besok").
4. Jawablah dengan ringkas, jelas, dan terstruktur (gunakan poin-poin jika perlu). Gunakan bahasa Indonesia secara sopan.
5. Jika admin meminta Anda untuk mem-follow-up pelanggan yang belum booking, menyusun reservasi/booking, membuat tiket komplain/keluhan, menambah kontak pelanggan baru, atau menambah produk baru, Anda HARUS menyusun proposal aksi.
Format proposal aksi harus diletakkan di akhir jawaban Anda dengan menggunakan penanda tepat seperti ini:

---AI-ACTION-PROPOSAL---
{
  "type": "send_followup",
  "title": "Follow-up Pelanggan Belum Booking",
  "targets": [
    {
      "id": "customer_id",
      "name": "customer_name",
      "recipientId": "phone_or_username",
      "channel": "WhatsApp_or_Instagram_DM"
    }
  ],
  "messageTemplate": "Halo {name}, kami dari ${workspaceName} melihat Anda belum melakukan booking servis bulan ini. Ingin kami daftarkan booking?"
}
---END-AI-ACTION-PROPOSAL---

ATAU (untuk membuat booking):
---AI-ACTION-PROPOSAL---
{
  "type": "create_booking",
  "title": "Buat Booking Servis Baru",
  "data": {
    "customer": "Nama Pelanggan",
    "service": "Nama Jasa/Layanan (misal: Ganti Oli Mesin)",
    "date": "YYYY-MM-DD (format tahun-bulan-hari)",
    "slot": "Jam slot (misal: 10:00 atau 14:00)",
    "note": "Catatan opsional dari AI"
  }
}
---END-AI-ACTION-PROPOSAL---

ATAU (untuk membuat tiket keluhan):
---AI-ACTION-PROPOSAL---
{
  "type": "create_ticket",
  "title": "Buat Tiket Keluhan Baru",
  "data": {
    "customerName": "Nama Pelanggan",
    "issueType": "Tipe masalah/keluhan (misal: Oli Rem Bocor)",
    "priority": "low" or "medium" or "high",
    "summary": "Ringkasan penjelasan detail keluhan"
  }
}
---END-AI-ACTION-PROPOSAL---

ATAU (untuk menambah kontak pelanggan baru):
---AI-ACTION-PROPOSAL---
{
  "type": "create_contact",
  "title": "Tambah Kontak Baru",
  "data": {
    "name": "Nama Lengkap Pelanggan",
    "phone": "Nomor WA (jika ada)",
    "email": "Email (jika ada)",
    "username": "Username Instagram (jika ada)",
    "channel": "WhatsApp" or "Instagram DM" or "Website Chat"
  }
}
---END-AI-ACTION-PROPOSAL---

ATAU (untuk menambah produk baru):
---AI-ACTION-PROPOSAL---
{
  "type": "create_product",
  "title": "Tambah Produk Baru",
  "data": {
    "name": "Nama Produk Baru",
    "price": "Harga (misal: Rp150.000)",
    "stock": "Jumlah stok (angka)",
    "description": "Deskripsi produk singkat"
  }
}
---END-AI-ACTION-PROPOSAL---

Pastikan data yang dimasukkan ke dalam proposal seakurat mungkin berdasarkan keluhan atau obrolan admin. Jangan mengarang data target untuk follow-up jika tidak ada di daftar "DAFTAR PELANGGAN YANG BELUM BOOKING".
`;

    const provider = config.aiProvider.provider;
    const apiKey = config.aiProvider.apiKey.trim();
    const endpoint = resolveProviderEndpoint(config);
    assertSafeExternalUrl(endpoint);
    const history = body.history || [];

    let response: Response;

    if (provider === "gemini") {
      const contents = [
        ...history.map((h) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: body.message.trim() }] },
      ];

      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.35, maxOutputTokens: 1024 },
        }),
      });
    } else if (provider === "anthropic") {
      const messages = [
        ...history.map((h) => ({
          role: h.role === "user" ? ("user" as const) : ("assistant" as const),
          content: h.content,
        })),
        { role: "user" as const, content: body.message.trim() },
      ];

      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.aiProvider.model.trim() || "claude-3-haiku-20240307",
          max_tokens: 1024,
          system: systemPrompt,
          messages,
          temperature: 0.35,
        }),
      });
    } else {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
      if (provider === "openrouter") {
        headers["HTTP-Referer"] = resolveAppUrl();
        headers["X-Title"] = config.workspace.name || "Balesin Desk";
      }

      const messages = [
        { role: "system", content: systemPrompt },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: body.message.trim() },
      ];

      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: config.aiProvider.model.trim() || "gpt-3.5-turbo",
          temperature: 0.35,
          messages,
        }),
      });
    }

    if (!response.ok) {
      await response.text().catch(() => "");
      return jsonError("Provider API gagal memproses request.", response.status);
    }

    const payload = (await response.json()) as unknown;
    const reply = extractAiResponseText(payload, provider);

    return jsonOk({
      ok: true,
      reply,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Terjadi kesalahan internal pada asisten AI.",
      500,
    );
  }
}

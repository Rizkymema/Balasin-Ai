import { getKnowledgeChunks } from "@/server/repositories/dashboard-repository";
import type { DashboardConfig, FAQItem } from "@/types/dashboard-config";
import type { ConversationStatus } from "@/types/operations";

export type ReplyDecision = {
  intent: string;
  confidence: number;
  needsHuman: boolean;
  status: ConversationStatus;
  summary: string;
  reply?: string;
  grounded: boolean;
  source?: "workspace" | "faq" | "document" | "fallback";
};

const LOCATION_KEYWORDS = [
  "alamat",
  "lokasi",
  "di mana",
  "dimana",
  "maps",
  "map",
  "gmaps",
];

const HOURS_KEYWORDS = [
  "jam",
  "buka",
  "tutup",
  "operasional",
  "open",
  "close",
];

const PRICE_KEYWORDS = ["harga", "berapa", "biaya", "tarif", "ongkos", "estimasi"];
const GREETING_KEYWORDS = [
  "halo",
  "hallo",
  "helo",
  "hello",
  "hi",
  "hai",
  "hii",
  "hy",
  "hey",
  "pagi",
  "siang",
  "sore",
  "malam",
  "assalamualaikum",
  "aslm",
  "hlo",
];

const BOOKING_KEYWORDS = ["booking", "book", "servis besok", "service besok", "jadwal"];
const COMPLAINT_KEYWORDS = ["refund", "komplain", "keluhan", "kecewa", "marah", "complain"];
const SPAM_KEYWORDS = ["judol", "link di bio"];

const STOP_WORDS = new Set([
  "yang",
  "dan",
  "atau",
  "untuk",
  "dengan",
  "saya",
  "kami",
  "anda",
  "yah",
  "ya",
  "nih",
  "dong",
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

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input: string) {
  return normalizeText(input)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

function hasKeyword(input: string, keywords: string[]) {
  return keywords.some((keyword) => input.includes(keyword));
}

function isGreetingMessage(input: string) {
  const normalized = normalizeText(input);
  const compact = normalized.replace(/\s+/g, "");

  return GREETING_KEYWORDS.some(
    (keyword) => normalized === keyword || compact === keyword || normalized.includes(keyword),
  );
}

function scoreCandidate(messageText: string, candidateText: string) {
  const normalizedMessage = normalizeText(messageText);
  const normalizedCandidate = normalizeText(candidateText);

  if (!normalizedMessage || !normalizedCandidate) {
    return 0;
  }

  if (normalizedMessage === normalizedCandidate) {
    return 1;
  }

  if (
    normalizedCandidate.includes(normalizedMessage) ||
    normalizedMessage.includes(normalizedCandidate)
  ) {
    return 0.95;
  }

  const messageTokens = Array.from(new Set(tokenize(messageText)));
  const candidateTokens = new Set(tokenize(candidateText));

  if (messageTokens.length === 0 || candidateTokens.size === 0) {
    return 0;
  }

  const matchedTokenCount = messageTokens.filter((token) =>
    candidateTokens.has(token),
  ).length;

  const overlapScore = matchedTokenCount / messageTokens.length;
  const phraseBonus =
    matchedTokenCount >= 2 && normalizedCandidate.includes(messageTokens.join(" "))
      ? 0.15
      : 0;

  return Math.min(1, overlapScore + phraseBonus);
}

function findBestFaqMatch(messageText: string, faqs: FAQItem[]) {
  let bestMatch: { faq: FAQItem; score: number } | null = null;

  for (const faq of faqs) {
    const questionScore = scoreCandidate(messageText, faq.question);
    const answerScore = scoreCandidate(messageText, faq.answer);
    const score = Math.max(questionScore * 1.15, (questionScore + answerScore) / 2);

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { faq, score };
    }
  }

  if (!bestMatch || bestMatch.score < 0.45) {
    return null;
  }

  return {
    reply: bestMatch.faq.answer,
    confidence: Math.min(97, Math.round(bestMatch.score * 100)),
    summary: `Jawaban diambil dari FAQ: ${bestMatch.faq.question}`,
  };
}

function findBestDocumentMatch(messageText: string) {
  const chunks = getKnowledgeChunks();
  let bestMatch: { content: string; sourceName: string; score: number } | null = null;

  for (const chunk of chunks) {
    const score = scoreCandidate(messageText, chunk.content);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        content: chunk.content,
        sourceName: chunk.metadata.sourceName,
        score,
      };
    }
  }

  if (!bestMatch || bestMatch.score < 0.48) {
    return null;
  }

  const snippet =
    bestMatch.content.length > 420
      ? `${bestMatch.content.slice(0, 417).trim()}...`
      : bestMatch.content.trim();

  return {
    reply: snippet,
    confidence: Math.min(94, Math.round(bestMatch.score * 100)),
    summary: `Jawaban diambil dari dokumen: ${bestMatch.sourceName}`,
  };
}

function buildFallbackDecision(config: DashboardConfig, summary: string): ReplyDecision {
  return {
    intent: "FAQ umum",
    confidence: 45,
    needsHuman: false,
    status: "ai_active",
    summary,
    reply: config.aiAgent.fallbackMessage,
    grounded: false,
    source: "fallback",
  };
}

export async function generateReplyDecision(
  messageText: string,
  config: DashboardConfig,
): Promise<ReplyDecision> {
  const lower = messageText.toLowerCase();
  const blacklist = config.aiAgent.blacklist.map((item) => item.toLowerCase());

  if (blacklist.some((term) => term && lower.includes(term))) {
    return buildFallbackDecision(
      config,
      "Pesan menyentuh blacklist AI sehingga sistem memakai fallback aman.",
    );
  }

  if (hasKeyword(lower, SPAM_KEYWORDS)) {
    return {
      intent: "Spam",
      confidence: 99,
      needsHuman: false,
      status: "spam",
      summary: "Pesan terdeteksi sebagai spam dan tidak diteruskan ke alur aktif.",
      grounded: false,
    };
  }

  if (hasKeyword(lower, COMPLAINT_KEYWORDS)) {
    return {
      intent: "Komplain",
      confidence: 40,
      needsHuman: true,
      status: "assigned_to_admin",
      summary: "Customer mengirim komplain dan perlu penanganan admin.",
      reply:
        "Terima kasih, pesan Anda sudah kami teruskan ke admin agar ditangani dengan lebih tepat.",
      grounded: false,
      source: "fallback",
    };
  }

  if (hasKeyword(lower, BOOKING_KEYWORDS)) {
    return {
      intent: "Booking",
      confidence: 83,
      needsHuman: false,
      status: "waiting_customer",
      summary: "Customer ingin booking dan sistem perlu mengumpulkan detail tambahan.",
      reply:
        "Siap, kami bantu booking. Mohon kirim nama, tipe motor, keluhan, tanggal, dan jam yang diinginkan ya.",
      grounded: false,
      source: "fallback",
    };
  }

  if (isGreetingMessage(messageText)) {
    return {
      intent: "Sapaan",
      confidence: 92,
      needsHuman: false,
      status: "ai_active",
      summary: "Customer mengirim sapaan umum dan sistem membalas dengan greeting aman.",
      reply: `Halo, selamat datang di ${config.workspace.name}. Ada yang bisa kami bantu? Anda bisa tanya alamat, jam buka, booking, atau layanan yang dibutuhkan ya.`,
      grounded: true,
      source: "workspace",
    };
  }

  if (hasKeyword(lower, LOCATION_KEYWORDS) && config.workspace.address.trim()) {
    return {
      intent: "Tanya alamat",
      confidence: 98,
      needsHuman: false,
      status: "ai_active",
      summary: "Jawaban alamat diambil dari profil bisnis.",
      reply: `${config.workspace.name} berlokasi di ${config.workspace.address}`,
      grounded: true,
      source: "workspace",
    };
  }

  if (hasKeyword(lower, HOURS_KEYWORDS) && config.workspace.businessHours.trim()) {
    return {
      intent: "Tanya jam buka",
      confidence: 96,
      needsHuman: false,
      status: "ai_active",
      summary: "Jawaban jam operasional diambil dari profil bisnis.",
      reply: config.workspace.businessHours,
      grounded: true,
      source: "workspace",
    };
  }

  const faqMatch = findBestFaqMatch(messageText, config.knowledgeBase.faqs);
  if (faqMatch && faqMatch.confidence >= config.aiAgent.confidenceThreshold) {
    return {
      intent: hasKeyword(lower, PRICE_KEYWORDS) ? "Tanya harga" : "FAQ umum",
      confidence: faqMatch.confidence,
      needsHuman: false,
      status: "ai_active",
      summary: faqMatch.summary,
      reply: faqMatch.reply,
      grounded: true,
      source: "faq",
    };
  }

  const documentMatch = findBestDocumentMatch(messageText);
  if (documentMatch && documentMatch.confidence >= config.aiAgent.confidenceThreshold) {
    return {
      intent: hasKeyword(lower, PRICE_KEYWORDS) ? "Tanya harga" : "FAQ umum",
      confidence: documentMatch.confidence,
      needsHuman: false,
      status: "ai_active",
      summary: documentMatch.summary,
      reply: documentMatch.reply,
      grounded: true,
      source: "document",
    };
  }

  if (hasKeyword(lower, PRICE_KEYWORDS)) {
    return {
      intent: "Tanya harga",
      confidence: 72,
      needsHuman: false,
      status: "ai_active",
      summary: "Customer menanyakan harga, tetapi belum ada jawaban grounded yang cukup kuat.",
      reply:
        "Kami bisa bantu cek harga ya. Mohon kirim tipe motor atau detail layanan yang dimaksud agar saya jawab lebih akurat.",
      grounded: false,
      source: "fallback",
    };
  }

  return buildFallbackDecision(
    config,
    "Tidak ditemukan jawaban grounded yang cukup kuat dari profil bisnis, FAQ, atau dokumen.",
  );
}

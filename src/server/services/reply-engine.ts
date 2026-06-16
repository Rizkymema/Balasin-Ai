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
const OPENING_PHRASES = [
  "boleh tanya",
  "blh tanya",
  "blh tnya",
  "boleh nanya",
  "blh nanya",
  "mau tanya",
  "mau nanya",
  "izin tanya",
  "izin bertanya",
  "sy mau tanya",
  "saya mau tanya",
  "saya ingin tanya",
  "permisi tanya",
  "numpang tanya",
];
const DEFAULT_GREETING_KEYWORDS = [
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

function getGreetingKeywords(config: DashboardConfig) {
  const customKeywords = config.aiAgent.greetingKeywords
    .map((keyword) => normalizeText(keyword))
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_GREETING_KEYWORDS, ...customKeywords]));
}

function isGreetingMessage(input: string, config: DashboardConfig) {
  const normalized = normalizeText(input);
  const compact = normalized.replace(/\s+/g, "");
  const greetingKeywords = getGreetingKeywords(config);

  return greetingKeywords.some(
    (keyword) => normalized === keyword || compact === keyword || normalized.includes(keyword),
  );
}

function stripOpeningPhrase(input: string) {
  const normalized = normalizeText(input);

  for (const phrase of OPENING_PHRASES) {
    if (!normalized.startsWith(phrase)) {
      continue;
    }

    return {
      hadOpener: true,
      normalized,
      stripped: normalized.slice(phrase.length).trim(),
    };
  }

  return {
    hadOpener: false,
    normalized,
    stripped: normalized,
  };
}

function extractStyleSignals(config: DashboardConfig) {
  const combined =
    `${config.aiAgent.tone} ${config.aiAgent.replyInstructions} ${config.aiAgent.replyStyleExample}`.toLowerCase();

  return {
    prefersShort:
      combined.includes("singkat") ||
      combined.includes("ringkas") ||
      combined.includes("to the point"),
    prefersFormal:
      config.aiAgent.tone === "formal" ||
      combined.includes("formal") ||
      combined.includes("sopan"),
    prefersCasual:
      config.aiAgent.tone === "casual" ||
      config.aiAgent.tone === "helpful" ||
      combined.includes("santai") ||
      combined.includes("akrab"),
    useSaya:
      combined.includes("pakai saya") ||
      combined.includes("gunakan saya") ||
      /\bsaya\b/.test(config.aiAgent.replyStyleExample.toLowerCase()),
    useKami:
      combined.includes("pakai kami") ||
      combined.includes("gunakan kami") ||
      /\bkami\b/.test(config.aiAgent.replyStyleExample.toLowerCase()),
    useKak:
      combined.includes("panggil kak") ||
      combined.includes("sapaan kak") ||
      /\bkak\b/.test(config.aiAgent.replyStyleExample.toLowerCase()),
    useBapakIbu:
      combined.includes("bapak/ibu") ||
      combined.includes("bapak ibu") ||
      /\bbapak\b/.test(config.aiAgent.replyStyleExample.toLowerCase()) ||
      /\bibu\b/.test(config.aiAgent.replyStyleExample.toLowerCase()),
  };
}

function shortenReply(text: string) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length >= 2) {
    return sentences.slice(0, 2).join(" ").trim();
  }

  if (text.length > 180) {
    return `${text.slice(0, 177).trim()}...`;
  }

  return text.trim();
}

function applyStyleInstructions(
  reply: string,
  config: DashboardConfig,
  options?: { preserveLength?: boolean },
) {
  const signals = extractStyleSignals(config);
  let text = reply.trim();

  if (signals.useBapakIbu) {
    text = text.replace(/\bAnda\b/g, "Bapak/Ibu").replace(/\banda\b/g, "Bapak/Ibu");
  } else if (signals.useKak) {
    text = text.replace(/\bAnda\b/g, "kak").replace(/\banda\b/g, "kak");
  }

  if (signals.useSaya && !signals.useKami) {
    text = text.replace(/\bKami\b/g, "Saya").replace(/\bkami\b/g, "saya");
  } else if (signals.useKami && !signals.useSaya) {
    text = text.replace(/\bSaya\b/g, "Kami").replace(/\bsaya\b/g, "kami");
  }

  if (signals.prefersFormal) {
    text = text
      .replace(/^Siap,/i, "Baik,")
      .replace(/\bAda yang bisa kami bantu\?/i, "Ada yang dapat kami bantu?")
      .replace(/\bAda yang bisa saya bantu\?/i, "Ada yang dapat saya bantu?")
      .replace(/\bMohon kirim\b/gi, "Mohon informasikan")
      .replace(/\sya([.!?])/gi, "$1");
  } else if (signals.prefersCasual) {
    text = text
      .replace(/^Baik,/i, "Siap,")
      .replace(/\bdapat kami bantu\b/gi, "bisa kami bantu")
      .replace(/\bdapat saya bantu\b/gi, "bisa saya bantu")
      .replace(/\bMohon informasikan\b/gi, "Boleh kirim");
  }

  text = text.replace(/\s{2,}/g, " ").trim();

  if (signals.prefersShort && !options?.preserveLength) {
    text = shortenReply(text);
  }

  if (config.aiAgent.language === "en") {
    text = text
      .replace(/^Halo/gi, "Hello")
      .replace(/^Siap,/gi, "Sure,")
      .replace(/^Baik,/gi, "Alright,")
      .replace(/Ada yang bisa kami bantu\?/gi, "How can we help you?")
      .replace(/Ada yang bisa saya bantu\?/gi, "How can I help you?")
      .replace(/Mohon informasikan/gi, "Please share")
      .replace(/Boleh kirim/gi, "Please send")
      .replace(/Terima kasih/gi, "Thank you")
      .replace(/selamat datang/gi, "welcome")
      .replace(/jam operasional/gi, "business hours")
      .replace(/berlokasi di/gi, "is located at");
  }

  return text;
}

function buildGreetingReply(config: DashboardConfig) {
  const template =
    config.aiAgent.greetingTemplate.trim() ||
    "Halo, selamat datang di {businessName}. Ada yang bisa kami bantu?";

  return template
    .replaceAll("{businessName}", config.workspace.name || "tempat kami")
    .replaceAll("{agentName}", config.aiAgent.name || "AI Assistant")
    .replaceAll("{address}", config.workspace.address || "alamat belum diisi")
    .replaceAll(
      "{businessHours}",
      config.workspace.businessHours || "jam operasional belum diisi",
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

async function findBestDocumentMatch(messageText: string) {
  const chunks = await getKnowledgeChunks();
  let bestMatch:
    | {
        content: string;
        sourceName: string;
        score: number;
        answer?: string;
        question?: string;
      }
    | null = null;

  for (const chunk of chunks) {
    const questionScore = chunk.metadata.question
      ? scoreCandidate(messageText, chunk.metadata.question)
      : 0;
    const answerScore = chunk.metadata.answer
      ? scoreCandidate(messageText, chunk.metadata.answer)
      : 0;
    const contentScore = scoreCandidate(messageText, chunk.content);
    const score = Math.max(
      contentScore,
      questionScore * 1.2,
      (questionScore + answerScore) / 2,
    );

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        content: chunk.content,
        sourceName: chunk.metadata.sourceName,
        score,
        answer: chunk.metadata.answer,
        question: chunk.metadata.question,
      };
    }
  }

  if (!bestMatch || bestMatch.score < 0.48) {
    return null;
  }

  const replySource = bestMatch.answer || bestMatch.content;
  const snippet =
    replySource.length > 420
      ? `${replySource.slice(0, 417).trim()}...`
      : replySource.trim();

  return {
    reply: snippet,
    confidence: Math.min(94, Math.round(bestMatch.score * 100)),
    summary: bestMatch.question
      ? `Jawaban diambil dari knowledge source: ${bestMatch.sourceName} (${bestMatch.question})`
      : `Jawaban diambil dari knowledge source: ${bestMatch.sourceName}`,
  };
}

function buildFallbackDecision(config: DashboardConfig, summary: string): ReplyDecision {
  return {
    intent: "FAQ umum",
    confidence: 45,
    needsHuman: false,
    status: "ai_active",
    summary,
    reply: applyStyleInstructions(config.aiAgent.fallbackMessage, config),
    grounded: false,
    source: "fallback",
  };
}

export async function generateReplyDecision(
  messageText: string,
  config: DashboardConfig,
): Promise<ReplyDecision> {
  const opener = stripOpeningPhrase(messageText);
  const routedMessage = opener.stripped || messageText;
  const lower = normalizeText(routedMessage);
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
      reply: applyStyleInstructions(
        "Terima kasih, pesan Anda sudah kami teruskan ke admin agar ditangani dengan lebih tepat.",
        config,
      ),
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
      reply: applyStyleInstructions(
        "Siap, kami bantu booking. Mohon kirim nama, tipe motor, keluhan, tanggal, dan jam yang diinginkan ya.",
        config,
      ),
      grounded: false,
      source: "fallback",
    };
  }

  if (opener.hadOpener && !opener.stripped) {
    return {
      intent: "Sapaan",
      confidence: 90,
      needsHuman: false,
      status: "ai_active",
      summary: "Customer membuka percakapan dengan izin bertanya dan sistem membalas sebagai sapaan aman.",
      reply: applyStyleInstructions(buildGreetingReply(config), config),
      grounded: true,
      source: "workspace",
    };
  }

  if (isGreetingMessage(messageText, config)) {
    return {
      intent: "Sapaan",
      confidence: 92,
      needsHuman: false,
      status: "ai_active",
      summary: "Customer mengirim sapaan umum dan sistem membalas dengan greeting aman.",
      reply: applyStyleInstructions(buildGreetingReply(config), config),
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
      reply: applyStyleInstructions(
        `${config.workspace.name} berlokasi di ${config.workspace.address}`,
        config,
      ),
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
      reply: applyStyleInstructions(config.workspace.businessHours, config, {
        preserveLength: true,
      }),
      grounded: true,
      source: "workspace",
    };
  }

  const faqMatch = findBestFaqMatch(routedMessage, config.knowledgeBase.faqs);
  if (faqMatch && faqMatch.confidence >= config.aiAgent.confidenceThreshold) {
    return {
      intent: hasKeyword(lower, PRICE_KEYWORDS) ? "Tanya harga" : "FAQ umum",
      confidence: faqMatch.confidence,
      needsHuman: false,
      status: "ai_active",
      summary: faqMatch.summary,
      reply: applyStyleInstructions(faqMatch.reply, config, {
        preserveLength: true,
      }),
      grounded: true,
      source: "faq",
    };
  }

  const documentMatch = await findBestDocumentMatch(routedMessage);
  if (documentMatch && documentMatch.confidence >= config.aiAgent.confidenceThreshold) {
    return {
      intent: hasKeyword(lower, PRICE_KEYWORDS) ? "Tanya harga" : "FAQ umum",
      confidence: documentMatch.confidence,
      needsHuman: false,
      status: "ai_active",
      summary: documentMatch.summary,
      reply: applyStyleInstructions(documentMatch.reply, config, {
        preserveLength: true,
      }),
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
      reply: applyStyleInstructions(
        "Kami bisa bantu cek harga ya. Mohon kirim tipe motor atau detail layanan yang dimaksud agar saya jawab lebih akurat.",
        config,
      ),
      grounded: false,
      source: "fallback",
    };
  }

  return buildFallbackDecision(
    config,
    "Tidak ditemukan jawaban grounded yang cukup kuat dari profil bisnis, FAQ, atau dokumen.",
  );
}

import { getKnowledgeChunks, type KnowledgeChunk } from "@/server/repositories/dashboard-repository";
import { resolveAppUrl } from "@/lib/app-url";
import { formatCurrentTimeContext, getDefaultTimezone } from "@/lib/time";
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

export type ReplyContext = {
  recentMessages?: Array<{
    sender: "customer" | "ai" | "admin" | "agent" | "system";
    text: string;
  }>;
  lastIntent?: string;
  summary?: string;
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

const EMAIL_KEYWORDS = ["email", "surel", "kontak email", "hubungi lewat email"];
const DESCRIPTION_KEYWORDS = ["siapa", "profil", "tentang", "about", "apa itu", "deskripsi"];
const NAME_KEYWORDS = ["nama bisnis", "nama toko", "nama bengkel", "bengkel apa", "toko apa"];

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
const SPAM_KEYWORDS = ["judol", "link di bio", "slot", "gacor", "promosi", "iklan"];
const SERVICE_DETAIL_KEYWORDS = [
  "cvt",
  "tune up",
  "servis besar",
  "service besar",
  "ganti oli",
  "oli",
  "injeksi",
  "kampas ganda",
  "v belt",
  "vbelt",
  "roller",
  "bubut",
  "knalpot",
  "mesin",
  "kelistrikan",
];

const FINANCE_KEYWORDS = [
  "bukti bayar",
  "bukti transfer",
  "dp",
  "down payment",
  "refund",
  "uang kembali",
  "kembalian",
  "gagal bayar",
  "salah bayar",
  "rekening",
  "qris",
  "sudah bayar",
  "sudah transfer",
  "konfirmasi bayar",
  "pembayaran",
  "transfer"
];

const DISCOUNT_KEYWORDS = [
  "diskon",
  "potongan harga",
  "kurangi harga",
  "nego",
  "harga khusus",
  "harga grosir",
  "b2b",
  "diskon khusus",
  "minta diskon"
];

const DETAILED_COMPLAINT_KEYWORDS = [
  "komplain",
  "klaim",
  "rusak",
  "pecah",
  "cacat",
  "garansi",
  "kecewa",
  "jelek",
  "buruk",
  "salah kirim",
  "barang kurang",
  "salah barang",
  "pengembalian barang",
  "retur"
];

const SAFETY_KEYWORDS = [
  "bahaya",
  "celaka",
  "darurat",
  "urgent",
  "cepat",
  "tabrakan",
  "kecelakaan",
  "rem blong",
  "mogok",
  "terbakar",
  "kebakaran",
  "overbooking",
  "bentrok"
];

const ANGRY_KEYWORDS = [
  "tuntut",
  "hukum",
  "polisi",
  "viral",
  "sosmed",
  "lapor",
  "penipu",
  "bohong",
  "brengsek",
  "anjing",
  "babi",
  "goblok",
  "tolol",
  "kecewa banget",
  "marah",
  "kasar"
];

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

const COLLOQUIAL_TOKEN_MAP: Record<string, string> = {
  almt: "alamat",
  almat: "alamat",
  almtny: "alamatnya",
  alamatny: "alamatnya",
  dmn: "dimana",
  dimn: "dimana",
  mn: "mana",
  yg: "yang",
  ygk: "yang",
  yhh: "ya",
  yh: "ya",
  y: "ya",
  brp: "berapa",
  brapa: "berapa",
  gmn: "bagaimana",
  gmna: "bagaimana",
  gmana: "bagaimana",
  blh: "boleh",
  tny: "tanya",
  tnya: "tanya",
  nnya: "nanya",
  nanyaa: "nanya",
  sy: "saya",
  sya: "saya",
  aq: "aku",
  dr: "dari",
  utk: "untuk",
  bngkel: "bengkel",
  bkl: "bengkel",
  bngkelnya: "bengkelnya",
  servisnya: "servisnya",
  svc: "servis",
  srvis: "servis",
  jm: "jam",
  bka: "buka",
  tutp: "tutup",
  hrg: "harga",
  lgkp: "lengkap",
};

function normalizeText(input: string) {
  const normalized = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  return normalized
    .split(" ")
    .map((token) => COLLOQUIAL_TOKEN_MAP[token] ?? token)
    .join(" ");
}

function tokenize(input: string) {
  return normalizeText(input)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

function hasKeyword(input: string, keywords: string[]) {
  const normalizedInput = normalizeText(input);

  return keywords.some((keyword) => normalizedInput.includes(normalizeText(keyword)));
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

function buildConversationSnippet(context?: ReplyContext) {
  if (!context?.recentMessages?.length) {
    return "";
  }

  return context.recentMessages
    .filter((message) => message.text.trim())
    .slice(-6)
    .map((message) => {
      const speaker =
        message.sender === "customer"
          ? "Customer"
          : message.sender === "ai"
            ? "AI"
            : message.sender === "admin"
              ? "Admin"
              : message.sender === "agent"
                ? "Agent"
              : "System";

      return `${speaker}: ${message.text.trim()}`;
    })
    .join("\n");
}

function messageNeedsConversationContext(messageText: string) {
  const normalized = normalizeText(messageText);
  const tokens = tokenize(messageText);

  return (
    tokens.length <= 5 ||
    /^\d{4}$/.test(normalized) ||
    /^[a-z0-9\s/-]+$/i.test(messageText.trim()) ||
    !(
      hasKeyword(normalized, LOCATION_KEYWORDS) ||
      hasKeyword(normalized, HOURS_KEYWORDS) ||
      hasKeyword(normalized, EMAIL_KEYWORDS) ||
      hasKeyword(normalized, DESCRIPTION_KEYWORDS) ||
      hasKeyword(normalized, NAME_KEYWORDS) ||
      hasKeyword(normalized, PRICE_KEYWORDS) ||
      hasKeyword(normalized, BOOKING_KEYWORDS)
    )
  );
}

function previousMessageNeedsFollowUp(message: string) {
  const normalized = normalizeText(message);

  return (
    normalized.includes("tipe motor") ||
    normalized.includes("tahun berapa") ||
    normalized.includes("tahun motor") ||
    normalized.includes("jenis jasa") ||
    normalized.includes("detail layanan") ||
    normalized.includes("keluhan") ||
    normalized.includes("kilometer") ||
    normalized.includes("riwayat servis") ||
    normalized.includes("kapan terakhir")
  );
}

function buildContextualMessage(
  messageText: string,
  context?: ReplyContext,
) {
  if (!context?.recentMessages?.length || !messageNeedsConversationContext(messageText)) {
    return messageText;
  }

  const previousMessages = context.recentMessages.slice(-6);
  const previousCustomerMessages = previousMessages
    .filter((message) => message.sender === "customer")
    .map((message) => message.text.trim())
    .filter(Boolean);
  const lastAiMessage = [...previousMessages]
    .reverse()
    .find((message) => message.sender === "ai")
    ?.text;

  const priorCustomerContext = previousCustomerMessages.join(" ");
  const priorIntentDetected =
    hasKeyword(priorCustomerContext, PRICE_KEYWORDS) ||
    hasKeyword(priorCustomerContext, BOOKING_KEYWORDS) ||
    hasKeyword(priorCustomerContext, HOURS_KEYWORDS) ||
    hasKeyword(priorCustomerContext, LOCATION_KEYWORDS) ||
    /(?:cvt|servis|service|motor|oli|mesin|gredek|getar|vario|beat|aerox|nmax)/i.test(
      priorCustomerContext,
    ) ||
    context.lastIntent === "Tanya harga" ||
    context.lastIntent === "Booking";

  if (!priorIntentDetected && !previousMessageNeedsFollowUp(lastAiMessage ?? "")) {
    return messageText;
  }

  const stitchedParts = [...previousCustomerMessages.slice(-2), messageText]
    .map((part) => part.trim())
    .filter(Boolean);

  return Array.from(new Set(stitchedParts)).join(" | ");
}

function detectServiceDetail(text: string) {
  const normalized = normalizeText(text);
  const matched = SERVICE_DETAIL_KEYWORDS.find((keyword) =>
    normalized.includes(normalizeText(keyword)),
  );

  if (!matched) {
    return "";
  }

  if (matched === "service besar") {
    return "servis besar";
  }

  if (matched === "v belt") {
    return "V-belt";
  }

  if (matched === "vbelt") {
    return "V-belt";
  }

  if (matched === "cvt") {
    return "servis CVT";
  }

  return matched;
}

function extractMotorYear(text: string) {
  const match = normalizeText(text).match(/\b(19\d{2}|20\d{2})\b/);
  return match?.[1] ?? "";
}

function extractMotorType(text: string) {
  const raw = text.trim();
  const year = extractMotorYear(raw);
  const withoutYear = raw.replace(new RegExp(`\\b${year}\\b`, "g"), " ");
  const normalized = normalizeText(withoutYear);

  if (!normalized) {
    return "";
  }

  const genericWords = new Set([
    "harga",
    "service",
    "servis",
    "berapa",
    "biaya",
    "tarif",
    "ongkos",
    "detail",
    "layanan",
    "motor",
    "tahun",
    "jenis",
    "jasa",
    "untuk",
  ]);

  const tokens = normalized
    .split(" ")
    .filter((token) => token && !genericWords.has(token));

  if (tokens.length === 0) {
    return "";
  }

  const joined = tokens.join(" ");
  const knownMotorMatch = joined.match(
    /\b(vario(?:\s+\d{2,3})?|beat(?:\s+(?:street|deluxe|esp))?|pcx(?:\s+\d{2,3})?|aerox(?:\s+\d{2,3})?|nmax(?:\s+\d{2,3})?|adv(?:\s+\d{2,3})?|lexi(?:\s+\d{2,3})?|scoopy|mio|fazzio|freego|genio|supra|revo|sonic|cbr(?:\s+\d{2,3})?|cb(?:\s+\d{2,3})?|mx king|xmax(?:\s+\d{2,3})?)\b/i,
  );

  if (knownMotorMatch) {
    return knownMotorMatch[0]
      .split(" ")
      .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
      .join(" ");
  }

  if (tokens.length <= 4) {
    return tokens
      .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
      .join(" ");
  }

  return "";
}

function buildPriceFollowUpReply(
  messageText: string,
  config: DashboardConfig,
  context?: ReplyContext,
) {
  const contextualText = buildContextualMessage(messageText, context);
  const serviceDetail = detectServiceDetail(contextualText);
  const rawMotorType = extractMotorType(contextualText);
  const motorType =
    serviceDetail &&
    normalizeText(rawMotorType) === normalizeText(serviceDetail.replace(/^servis\s+/i, ""))
      ? ""
      : rawMotorType;
  const motorYear = extractMotorYear(contextualText);
  const waLink = getWaHandoffLink(config);

  if (!serviceDetail) {
    return "Kami bisa bantu cek harga ya. Mohon kirim detail layanan yang dimaksud agar saya jawab lebih akurat.";
  }

  if (!motorType) {
    return `Untuk ${serviceDetail}, boleh kirim tipe motornya dulu ya biar saya cek konteksnya dengan benar.`;
  }

  if (!motorYear) {
    return `Untuk ${serviceDetail} di ${motorType}, tahun motornya berapa ya? Biar saya lanjut bantu cek dengan konteks yang pas.`;
  }

  return `Untuk ${serviceDetail} ${motorType} tahun ${motorYear}, saya belum menemukan harga final yang pasti di data aktif saat ini. Supaya tidak ngarang angka, saya sarankan cek ke admin via ${waLink} ya. Kalau mau, saya bisa bantu arahkan detail pertanyaannya juga.`;
}

function getEditDistanceWithinLimit(
  source: string,
  target: string,
  limit: number,
) {
  if (Math.abs(source.length - target.length) > limit) {
    return limit + 1;
  }

  let previousRow = Array.from(
    { length: target.length + 1 },
    (_, index) => index,
  );

  for (let row = 1; row <= source.length; row += 1) {
    const currentRow = [row];
    let rowMin = row;

    for (let column = 1; column <= target.length; column += 1) {
      const cost = source[row - 1] === target[column - 1] ? 0 : 1;
      const value = Math.min(
        previousRow[column] + 1,
        currentRow[column - 1] + 1,
        previousRow[column - 1] + cost,
      );
      currentRow.push(value);
      rowMin = Math.min(rowMin, value);
    }

    if (rowMin > limit) {
      return limit + 1;
    }

    previousRow = currentRow;
  }

  return previousRow[target.length];
}

function areTokensSimilar(source: string, target: string) {
  if (source === target) {
    return true;
  }

  if (
    source.length >= 4 &&
    target.length >= 4 &&
    (source.startsWith(target) || target.startsWith(source))
  ) {
    return true;
  }

  return getEditDistanceWithinLimit(source, target, 1) <= 1;
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
  const candidateTokens = Array.from(new Set(tokenize(candidateText)));

  if (messageTokens.length === 0 || candidateTokens.length === 0) {
    return 0;
  }

  const matchedTokenCount = messageTokens.filter((token) =>
    candidateTokens.some((candidateToken) => areTokensSimilar(token, candidateToken)),
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

function buildRelevantFaqContext(messageText: string, faqs: FAQItem[]) {
  return faqs
    .map((faq) => {
      const questionScore = scoreCandidate(messageText, faq.question);
      const answerScore = scoreCandidate(messageText, faq.answer);
      const score = Math.max(questionScore * 1.15, (questionScore + answerScore) / 2);

      return {
        question: faq.question.trim(),
        answer: faq.answer.trim(),
        score,
      };
    })
    .filter((item) => item.score >= 0.18)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

function getWaHandoffLink(config: DashboardConfig): string {
  const label = (config.channels.whatsapp.businessLabel || "").trim();
  const cleanPhone = label.replace(/[^0-9]/g, "");
  if (cleanPhone.length >= 9) {
    let formatted = cleanPhone;
    if (formatted.startsWith("0")) {
      formatted = "62" + formatted.slice(1);
    }
    return `https://wa.me/${formatted}`;
  }
  return label || "WhatsApp Admin";
}

function parseStructuredKnowledgeChunk(content: string) {
  const result = {
    category: "",
    triggers: [] as string[],
    guidance: "",
    status: "",
  };

  const parts = content
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const colonIndex = part.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }

    const key = normalizeText(part.slice(0, colonIndex));
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
      continue;
    }

    if (key === "status") {
      result.status = value;
    }
  }

  return result;
}

function isNoisyWebsiteChunk(chunk: KnowledgeChunk) {
  if (chunk.metadata?.sourceType !== "website") {
    return false;
  }

  const normalized = normalizeText(chunk.content);
  const noiseMarkers = [
    "menu close",
    "home products artikel",
    "website home faq",
    "our media",
    "new arrival",
    "track order",
    "socials instagram whatsapp",
    "booking bengkel",
    "categories",
  ];
  const hitCount = noiseMarkers.filter((marker) => normalized.includes(marker)).length;

  return hitCount >= 2 || (normalized.length > 500 && hitCount >= 1);
}

function extractTriggersFromContent(content: string): string[] {
  const match = content.match(/(?:Kata Kunci \/ Trigger|Kata Kunci|Trigger)\s*:\s*([^|]+)/i);
  if (!match) return [];
  
  return match[1]
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatGoogleSheetReply(content: string): string {
  const structured = parseStructuredKnowledgeChunk(content);
  if (structured.guidance) {
    return structured.guidance;
  }

  if (content.startsWith("Pertanyaan:") && content.includes("\nJawaban:")) {
    const parts = content.split("\nJawaban:");
    return parts.slice(1).join("\nJawaban:").trim();
  }

  if (content.includes(" | ")) {
    const parts = content.split(" | ");
    
    // Look specifically for "Panduan Jawaban AI" or "Jawaban" or "Answer" or "Content"
    for (const part of parts) {
      const colonIndex = part.indexOf(":");
      if (colonIndex !== -1) {
        const key = part.slice(0, colonIndex).trim().toLowerCase();
        const value = part.slice(colonIndex + 1).trim();
        
        if (
          key === "panduan jawaban ai" || 
          key === "jawaban" || 
          key === "answer" || 
          key === "jawaban ai"
        ) {
          return value;
        }
      }
    }
    
    // Fallback: If no explicit answer column was found, format all parts except Category/Triggers/Status
    return parts
      .map((part) => {
        const colonIndex = part.indexOf(":");
        if (colonIndex !== -1) {
          const key = part.slice(0, colonIndex).trim().toLowerCase();
          const value = part.slice(colonIndex + 1).trim();
          if (
            key === "kategori" ||
            key === "kata kunci" ||
            key === "trigger" ||
            key === "kata kunci / trigger" ||
            key === "status"
          ) {
            return "";
          }
          return `${part.slice(0, colonIndex).trim()}: ${value}`;
        }
        return part.trim();
      })
      .filter(Boolean)
      .join("\n");
  }
  return content;
}

async function findBestGoogleSheetMatch(
  messageText: string,
): Promise<{ reply: string; confidence: number; summary: string } | null> {
  const chunks = await getKnowledgeChunks();
  const sheetChunks = chunks.filter((c) => c.metadata?.sourceType === "google_sheet");
  if (sheetChunks.length === 0) {
    return null;
  }

  const queryLower = normalizeText(messageText);
  const queryTokens = Array.from(new Set(tokenize(messageText)));
  if (queryTokens.length === 0) {
    return null;
  }

  const askingPrice = hasKeyword(queryLower, PRICE_KEYWORDS);

  let bestMatch: { chunk: KnowledgeChunk; score: number; isTriggerMatch: boolean } | null = null;

  for (const chunk of sheetChunks) {
    const contentLower = chunk.content.toLowerCase();
    if (
      contentLower.includes("status: nonaktif") ||
      contentLower.includes("status: non-active") ||
      contentLower.includes("status: inactive") ||
      contentLower.includes("status: non aktif")
    ) {
      continue;
    }

    const structured = parseStructuredKnowledgeChunk(chunk.content);
    const triggers =
      structured.triggers.length > 0
        ? structured.triggers.map((trigger) => trigger.toLowerCase())
        : extractTriggersFromContent(chunk.content);
    let triggerScore = 0;
    let hasTriggerMatch = false;

    // Check triggers first (substring match with word boundary)
    for (const trigger of triggers) {
      if (trigger.length < 2) continue;
      
      const escapedTrigger = escapeRegExp(trigger);
      const regex = new RegExp(`\\b${escapedTrigger}\\b`, "i");
      
      if (regex.test(queryLower)) {
        hasTriggerMatch = true;
        const wordCount = trigger.split(/\s+/).length;
        const currentTriggerScore = wordCount >= 2 ? 1.0 : 0.95;
        if (currentTriggerScore > triggerScore) {
          triggerScore = currentTriggerScore;
        }
      }
    }

    if (hasTriggerMatch) {
      const categoryScore = structured.category
        ? scoreCandidate(messageText, structured.category)
        : 0;
      const guidanceScore = structured.guidance
        ? scoreCandidate(messageText, structured.guidance)
        : 0;
      const priceBoost =
        askingPrice &&
        /(harga|biaya|tarif|pricelist)/i.test(
          `${structured.category} ${structured.guidance}`,
        )
          ? 0.15
          : 0;
      const currentScore = Math.min(
        1,
        Math.max(triggerScore, categoryScore * 0.95, guidanceScore * 0.7) + priceBoost,
      );

      if (
        !bestMatch ||
        currentScore > bestMatch.score ||
        (!bestMatch.isTriggerMatch && currentScore === bestMatch.score)
      ) {
        bestMatch = { chunk, score: currentScore, isTriggerMatch: true };
      }
      continue;
    }

    // Fallback to token overlap
    let matchCount = 0;

    for (const token of queryTokens) {
      if (contentLower.includes(token)) {
        matchCount++;
      }
    }

    if (matchCount === 0) {
      continue;
    }

    const overlapScore = matchCount / queryTokens.length;
    const categoryScore = structured.category
      ? scoreCandidate(messageText, structured.category)
      : 0;
    const guidanceScore = structured.guidance
      ? scoreCandidate(messageText, structured.guidance)
      : 0;
    const priceBoost =
      askingPrice &&
      /(harga|biaya|tarif|pricelist)/i.test(`${structured.category} ${structured.guidance}`)
        ? 0.15
        : 0;
    const currentScore = Math.min(
      1,
      Math.max(overlapScore * 0.9, categoryScore * 0.95, guidanceScore * 0.7) +
        priceBoost,
    );

    if (!bestMatch || (!bestMatch.isTriggerMatch && currentScore > bestMatch.score)) {
      bestMatch = { chunk, score: currentScore, isTriggerMatch: false };
    }
  }

  if (bestMatch) {
    const confidence = Math.min(99, Math.round(bestMatch.score * 100));
    const isMatched = bestMatch.isTriggerMatch || confidence >= 60;

    if (isMatched) {
      return {
        reply: formatGoogleSheetReply(bestMatch.chunk.content),
        confidence,
        summary: bestMatch.isTriggerMatch
          ? `Jawaban diambil dari Google Sheet (${bestMatch.chunk.metadata.sourceName}) berdasarkan pencocokan trigger kata kunci.`
          : `Jawaban diambil dari Google Sheet (${bestMatch.chunk.metadata.sourceName}) berdasarkan overlap kata kunci.`,
      };
    }
  }

  return null;
}

async function findBestDocumentMatch(messageText: string) {
  const chunks = await getKnowledgeChunks();
  const nonSheetChunks = chunks.filter(
    (c) =>
      c.metadata?.sourceType !== "google_sheet" &&
      c.metadata?.sourceType !== "website",
  );
  let bestMatch:
    | {
        content: string;
        sourceName: string;
        score: number;
        answer?: string;
        question?: string;
      }
    | null = null;

  for (const chunk of nonSheetChunks) {
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

async function buildRelevantDocumentContext(messageText: string) {
  const chunks = await getKnowledgeChunks();
  const activeChunks = chunks.filter((c) => {
    if (isNoisyWebsiteChunk(c)) {
      return false;
    }

    const contentLower = c.content.toLowerCase();
    return !(
      contentLower.includes("status: nonaktif") ||
      contentLower.includes("status: non-active") ||
      contentLower.includes("status: inactive") ||
      contentLower.includes("status: non aktif")
    );
  });

  return activeChunks
    .map((chunk) => {
      const structured = parseStructuredKnowledgeChunk(chunk.content);
      const questionScore = chunk.metadata.question
        ? scoreCandidate(messageText, chunk.metadata.question)
        : 0;
      const answerScore = chunk.metadata.answer
        ? scoreCandidate(messageText, chunk.metadata.answer)
        : 0;
      const contentCandidate =
        structured.guidance || chunk.metadata.answer || chunk.content;
      const categoryScore = structured.category
        ? scoreCandidate(messageText, structured.category)
        : 0;
      const contentScore = scoreCandidate(messageText, contentCandidate);
      const score = Math.max(
        contentScore,
        categoryScore * 0.95,
        questionScore * 1.2,
        (questionScore + answerScore) / 2,
      );

      const content = contentCandidate.trim();
      const titleBase = structured.category
        ? `${chunk.metadata.sourceName} | ${structured.category}`
        : chunk.metadata.sourceName;

      return {
        sourceName: titleBase,
        question: chunk.metadata.question?.trim() || "",
        content: content.length > 700 ? `${content.slice(0, 697).trim()}...` : content,
        score,
        sourceType: chunk.metadata.sourceType,
      };
    })
    .filter((item) => {
      if (!item.content || item.score < 0.18) {
        return false;
      }

      if (item.sourceType === "website") {
        return item.score >= 0.45;
      }

      return true;
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
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
      const model = config.aiProvider.model.trim();
      const apiKey = config.aiProvider.apiKey.trim();
      return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    }
    case "anthropic":
      return "https://api.anthropic.com/v1/messages";
    default:
      return "";
  }
}

function extractAiResponseText(payload: unknown, provider?: string) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  // Anthropic response: { content: [{ type: "text", text: "..." }] }
  if (provider === "anthropic") {
    const anthropic = payload as { content?: Array<{ type?: string; text?: string }> };
    const text = anthropic.content
      ?.filter((item) => item.type === "text")
      .map((item) => item.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n");
    return text?.trim() ?? "";
  }

  // Gemini response: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
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

  // OpenAI / OpenRouter response
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
      .map((item) => (typeof item.text === "string" ? item.text.trim() : ""))
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

async function generateProviderReply(
  messageText: string,
  config: DashboardConfig,
  context?: ReplyContext,
) {
  if (
    !config.aiProvider.enabled ||
    !config.aiProvider.apiKey.trim() ||
    !config.aiProvider.model.trim()
  ) {
    return null;
  }

  const endpoint = resolveProviderEndpoint(config);
  if (!endpoint) {
    return null;
  }

  const faqContext = buildRelevantFaqContext(messageText, config.knowledgeBase.faqs);
  const documentContext = await buildRelevantDocumentContext(messageText);
  const conversationContext = buildConversationSnippet(context);
  const timezone = config.workspace.timezone || getDefaultTimezone();
  const currentTime = formatCurrentTimeContext(timezone);

  const workspaceContext = [
    `Nama bisnis: ${config.workspace.name || "-"}`,
    `Industri: ${config.workspace.industry || "-"}`,
    `Deskripsi: ${config.workspace.description || "-"}`,
    `Alamat: ${config.workspace.address || "-"}`,
    `Jam operasional: ${config.workspace.businessHours || "-"}`,
    `Timezone bisnis: ${timezone}`,
    `Waktu lokal saat ini: ${currentTime}`,
  ].join("\n");

  const faqSection =
    faqContext.length > 0
      ? faqContext
          .map(
            (item, index) =>
              `${index + 1}. Q: ${item.question}\nA: ${item.answer}`,
          )
          .join("\n\n")
      : "Tidak ada FAQ relevan.";

  const documentSection =
    documentContext.length > 0
      ? documentContext
          .map((item, index) => {
            const title = item.question
              ? `${item.sourceName} | ${item.question}`
              : item.sourceName;
            return `${index + 1}. ${title}\n${item.content}`;
          })
          .join("\n\n")
      : "Tidak ada dokumen relevan.";

  const waLink = getWaHandoffLink(config);
  const systemPrompt = `
Anda adalah ${config.aiAgent.name || "AI Assistant"} untuk ${config.workspace.name || "sebuah bisnis"}.
Jawab dalam bahasa ${config.aiAgent.language === "en" ? "English" : "Bahasa Indonesia"}.
Gaya: ${config.aiAgent.tone}.
Instruksi balasan: ${config.aiAgent.replyInstructions || "-"}.
Contoh gaya bicara: ${config.aiAgent.replyStyleExample || "-"}.

Aturan penting & pembatasan AI (PANDUAN AI):
- Gunakan data profil bisnis, FAQ, dan knowledge relevan yang disediakan secara ketat.
- TANPA KEBOHONGAN (NO HALLUCINATION): Jika informasi spesifik bisnis (seperti harga, stok, alamat, detail booking, atau kebijakan) tidak ada di data di bawah ini, Anda WAJIB mengaku tidak tahu dengan sopan, ramah, dan arahkan ke admin melalui WhatsApp di nomor/link ${waLink}. Dilarang menebak atau berasumsi.
- ATURAN STOK KOSONG: Jika produk habis atau stok kosong, jangan langsung memotong chat (misal: "Stok kosong"). Gunakan kalimat jembatan yang ramah seperti "Stok saat ini sedang habis di toko, silakan cek berkala atau hubungi admin di WhatsApp ${waLink}".
- KATEGORI TERLARANG: Anda dilarang memproses transaksi keuangan, refund/DP, negosiasi diskon khusus di luar harga resmi, komplain/garansi serius, atau kendala keselamatan fisik. Segera katakan hal tersebut harus ditangani langsung oleh Admin manusia lewat WhatsApp di ${waLink}.
- KERAHASIAAN SISTEM: AI dilarang menyebut istilah teknis internal AI seperti "system prompt", "database", "API", "tool", "LLM", atau proses internal lainnya dalam membalas chat.
- Output hanya teks balasan final untuk customer, tanpa format markdown, tanpa label tambahan (seperti "A:", "Jawaban:").
`.trim();

  const userPrompt = `
PROFIL BISNIS
${workspaceContext}

RIWAYAT PERCAKAPAN TERBARU
${conversationContext || "Belum ada riwayat percakapan sebelumnya."}

FAQ RELEVAN
${faqSection}

KNOWLEDGE RELEVAN
${documentSection}

PERTANYAAN CUSTOMER
${messageText}
`.trim();

  const provider = config.aiProvider.provider;
  const apiKey = config.aiProvider.apiKey.trim();

  try {
    let response: Response;

    // ── Gemini (Google AI) ──────────────────────────────────────────────
    if (provider === "gemini") {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.25, maxOutputTokens: 1024 },
        }),
      });
    }
    // ── Anthropic (Claude) ──────────────────────────────────────────────
    else if (provider === "anthropic") {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.aiProvider.model.trim(),
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
    }
    // ── OpenAI / OpenRouter (default) ───────────────────────────────────
    else {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
      if (provider === "openrouter") {
        headers["HTTP-Referer"] = resolveAppUrl();
        headers["X-Title"] = config.workspace.name || "Balesin Desk";
      }
      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: config.aiProvider.model.trim(),
          temperature: 0.25,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[reply-engine] provider=${provider} status=${response.status}`, errText.slice(0, 400));
      return null;
    }

    const payload = (await response.json()) as unknown;
    const reply = extractAiResponseText(payload, provider);
    if (!reply) {
      console.error("[reply-engine] empty reply from provider", provider);
      return null;
    }

    return {
      reply,
      grounded: faqContext.length > 0 || documentContext.length > 0,
      usedContext: faqContext.length > 0 || documentContext.length > 0,
    };
  } catch (err) {
    console.error("[reply-engine] generateProviderReply threw", err);
    return null;
  }
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

function isInstructionOnly(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.startsWith("pertanyaan seputar") ||
    lower.startsWith("pertanyaan ") ||
    lower.startsWith("keluhan ") ||
    lower.startsWith("keluhan:") ||
    lower.includes("minta tipe motor") ||
    lower.includes("jangan beri") ||
    lower.includes("jangan rekomendasikan") ||
    lower.includes("jangan memastikan") ||
    lower.includes("jangan mengarang") ||
    lower.includes("arahkan ke admin") ||
    lower.includes("arahkan admin") ||
    lower.includes("wajib handoff") ||
    lower.includes("wajib arahkan") ||
    lower.includes("jangan langsung")
  );
}

export async function generateReplyDecision(
  messageText: string,
  config: DashboardConfig,
  context?: ReplyContext,
): Promise<ReplyDecision> {
  const effectiveMessage = buildContextualMessage(messageText, context);
  const opener = stripOpeningPhrase(effectiveMessage);
  const routedMessage = opener.stripped || effectiveMessage;
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

  // 1. Keuangan / Financial
  if (hasKeyword(lower, FINANCE_KEYWORDS)) {
    const waLink = getWaHandoffLink(config);
    return {
      intent: "Keuangan",
      confidence: 95,
      needsHuman: true,
      status: "assigned_to_admin",
      summary: "Customer mengirim pesan terkait transaksi/keuangan dan perlu penanganan admin.",
      reply: applyStyleInstructions(
        `Maaf ya Kak, untuk kendala transaksi/pembayaran ini harus dibantu cek langsung oleh Admin kami agar aman. Kakak bisa langsung hubungi Admin lewat WhatsApp di ${waLink} ya!`,
        config,
      ),
      grounded: false,
      source: "fallback",
    };
  }

  // 2. Negosiasi / Diskon
  if (hasKeyword(lower, DISCOUNT_KEYWORDS)) {
    const waLink = getWaHandoffLink(config);
    return {
      intent: "Negosiasi",
      confidence: 95,
      needsHuman: true,
      status: "assigned_to_admin",
      summary: "Customer ingin negosiasi diskon/kerja sama dan harus dialihkan ke admin.",
      reply: applyStyleInstructions(
        `Maaf ya Kak, untuk kendala negosiasi diskon ini harus dibantu cek langsung oleh Admin kami agar aman. Kakak bisa langsung hubungi Admin lewat WhatsApp di ${waLink} ya!`,
        config,
      ),
      grounded: false,
      source: "fallback",
    };
  }

  // 3. Komplain / Garansi
  if (hasKeyword(lower, DETAILED_COMPLAINT_KEYWORDS)) {
    const waLink = getWaHandoffLink(config);
    return {
      intent: "Komplain",
      confidence: 95,
      needsHuman: true,
      status: "assigned_to_admin",
      summary: "Customer mengirim komplain/garansi dan memerlukan penanganan manual admin.",
      reply: applyStyleInstructions(
        `Maaf ya Kak, untuk kendala komplain/garansi ini harus dibantu cek langsung oleh Admin kami agar aman. Kakak bisa langsung hubungi Admin lewat WhatsApp di ${waLink} ya!`,
        config,
      ),
      grounded: false,
      source: "fallback",
    };
  }

  // 4. Safety / Urgensi
  if (hasKeyword(lower, SAFETY_KEYWORDS)) {
    const waLink = getWaHandoffLink(config);
    return {
      intent: "Keamanan",
      confidence: 95,
      needsHuman: true,
      status: "assigned_to_admin",
      summary: "Customer mengalami kendala keselamatan/darurat dan harus dialihkan segera.",
      reply: applyStyleInstructions(
        `Maaf ya Kak, untuk kendala darurat ini harus dibantu cek langsung oleh Admin kami agar aman. Kakak bisa langsung hubungi Admin lewat WhatsApp di ${waLink} ya!`,
        config,
      ),
      grounded: false,
      source: "fallback",
    };
  }

  // 5. Marah / Frustrasi / Ancaman
  if (hasKeyword(lower, ANGRY_KEYWORDS)) {
    const waLink = getWaHandoffLink(config);
    return {
      intent: "Pelanggan Marah",
      confidence: 95,
      needsHuman: true,
      status: "assigned_to_admin",
      summary: "Customer mengekspresikan kekesalan/ancaman dan dihentikan auto-reply-nya.",
      reply: applyStyleInstructions(
        `Maaf ya Kak, untuk keluhan Anda ini harus dibantu cek langsung oleh Admin kami agar aman. Kakak bisa langsung hubungi Admin lewat WhatsApp di ${waLink} ya!`,
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

  if (hasKeyword(lower, EMAIL_KEYWORDS) && config.workspace.supportEmail.trim()) {
    return {
      intent: "Tanya email",
      confidence: 97,
      needsHuman: false,
      status: "ai_active",
      summary: "Jawaban email diambil dari profil bisnis.",
      reply: applyStyleInstructions(
        `Anda dapat menghubungi kami melalui email di ${config.workspace.supportEmail}`,
        config,
      ),
      grounded: true,
      source: "workspace",
    };
  }

  if (hasKeyword(lower, DESCRIPTION_KEYWORDS) && config.workspace.description.trim()) {
    return {
      intent: "Tanya profil bisnis",
      confidence: 95,
      needsHuman: false,
      status: "ai_active",
      summary: "Jawaban profil bisnis diambil dari deskripsi bisnis.",
      reply: applyStyleInstructions(config.workspace.description, config, {
        preserveLength: true,
      }),
      grounded: true,
      source: "workspace",
    };
  }

  if (hasKeyword(lower, NAME_KEYWORDS) && config.workspace.name.trim()) {
    return {
      intent: "Tanya nama bisnis",
      confidence: 98,
      needsHuman: false,
      status: "ai_active",
      summary: "Jawaban nama bisnis diambil dari profil bisnis.",
      reply: applyStyleInstructions(
        `Bisnis kami bernama ${config.workspace.name}`,
        config,
      ),
      grounded: true,
      source: "workspace",
    };
  }

  const googleSheetMatch = await findBestGoogleSheetMatch(routedMessage);
  if (
    googleSheetMatch &&
    googleSheetMatch.confidence >= config.aiAgent.confidenceThreshold &&
    !isInstructionOnly(googleSheetMatch.reply)
  ) {
    return {
      intent: hasKeyword(lower, PRICE_KEYWORDS) ? "Tanya harga" : "Jawaban Google Sheet",
      confidence: googleSheetMatch.confidence,
      needsHuman: false,
      status: "ai_active",
      summary: googleSheetMatch.summary,
      reply: applyStyleInstructions(googleSheetMatch.reply, config, {
        preserveLength: true,
      }),
      grounded: true,
      source: "document",
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

  const providerReply = await generateProviderReply(routedMessage, config, context);
  if (providerReply) {
    return {
      intent: hasKeyword(lower, PRICE_KEYWORDS)
        ? "Tanya harga"
        : hasKeyword(lower, HOURS_KEYWORDS)
          ? "Tanya operasional"
          : "Jawaban AI",
      confidence: providerReply.grounded ? 84 : 74,
      needsHuman: false,
      status: "ai_active",
      summary: providerReply.usedContext
        ? "Jawaban dibuat oleh model AI dengan grounding profil bisnis dan knowledge yang relevan."
        : "Jawaban dibuat oleh model AI production karena tidak ada jawaban exact-match di knowledge.",
      reply: applyStyleInstructions(providerReply.reply, config, {
        preserveLength: true,
      }),
      grounded: providerReply.grounded,
      source: providerReply.grounded ? "document" : "fallback",
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
        buildPriceFollowUpReply(routedMessage, config, context),
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

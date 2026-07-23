import type {
  ConversationFlow,
  ConversationFlowEdge,
  ConversationFlowNode,
} from "@/types/dashboard-config";

export const BOOKING_SERVICE_TEMPLATE_NAME = "Booking Service - Johan Garage";
export const SYSTEM_CHATBOT_TEMPLATE_NAME = "Chatbot Utama - RAG & Safety";

export function createSystemChatbotFlowTemplate(input: {
  flowId: string;
  lastUpdate: string;
  agentId?: string;
}): ConversationFlow {
  const nodeId = (name: string) => `${input.flowId}-${name}`;
  const nodes: ConversationFlowNode[] = [
    {
      id: nodeId("start"),
      type: "start",
      position: { x: 520, y: 40 },
      data: {
        label: "Pesan Masuk + Safety Gate",
        trigger: "all_incoming_messages",
        triggerKeywords: [],
      },
    },
    {
      id: nodeId("rag-agent"),
      type: "ai_agent",
      position: { x: 470, y: 220 },
      data: {
        label: "RAG Knowledge Base + Custom Instructions",
        agentId: input.agentId,
        useConversationHistory: true,
        requireKnowledgeBase: true,
      },
    },
    {
      id: nodeId("answered"),
      type: "end",
      position: { x: 80, y: 470 },
      data: { label: "Jawaban Akurat Terkirim" },
    },
    {
      id: nodeId("fallback"),
      type: "fallback",
      position: { x: 460, y: 470 },
      data: {
        label: "Fallback Data Tidak Tersedia",
        message:
          "Maaf, informasi tersebut belum tersedia di data resmi kami. Agar informasinya akurat, pesan Anda akan diteruskan ke admin.",
      },
    },
    {
      id: nodeId("handoff"),
      type: "handoff",
      position: { x: 460, y: 690 },
      data: {
        label: "Safety Handoff ke Admin",
        message: "Pesan Anda sudah diteruskan ke admin untuk ditindaklanjuti.",
        handoffTarget: "Admin Desk",
        handoffReason:
          "Data tidak tersedia, keyakinan rendah, atau pesan membutuhkan penanganan manusia.",
      },
    },
    {
      id: nodeId("handoff-end"),
      type: "end",
      position: { x: 510, y: 900 },
      data: { label: "Menunggu Admin" },
    },
  ];

  const edge = (
    name: string,
    source: string,
    target: string,
    sourceHandle?: string,
    label?: string,
  ): ConversationFlowEdge => ({
    id: `${input.flowId}-edge-${name}`,
    source: nodeId(source),
    target: nodeId(target),
    sourceHandle,
    label,
  });

  return {
    id: input.flowId,
    name: SYSTEM_CHATBOT_TEMPLATE_NAME,
    channel: "All Channels",
    trigger: "Semua pesan masuk",
    normalizedTrigger: "all_incoming_messages",
    triggerKeywords: [],
    initialMessage: "",
    interactiveMenu: [],
    fallbackMessage:
      "Maaf, informasi tersebut belum tersedia di data resmi kami. Pesan Anda akan diteruskan ke admin.",
    aiAgentId: input.agentId,
    humanAgentHandoff: {
      enabled: true,
      condition:
        "Data tidak tersedia, keyakinan rendah, atau pesan membutuhkan admin.",
    },
    status: "Draft",
    botResponse: 0,
    lastUpdate: input.lastUpdate,
    draftGraph: {
      nodes,
      edges: [
        edge("start-rag", "start", "rag-agent"),
        edge(
          "rag-answered",
          "rag-agent",
          "answered",
          "answered",
          "Data ditemukan",
        ),
        edge("rag-human", "rag-agent", "handoff", "needs_human", "Perlu admin"),
        edge(
          "rag-not-found",
          "rag-agent",
          "fallback",
          "not_found",
          "Data tidak ada",
        ),
        edge("rag-error", "rag-agent", "fallback", "error", "AI error"),
        edge("fallback-handoff", "fallback", "handoff"),
        edge("handoff-end", "handoff", "handoff-end"),
      ],
      viewport: { x: 0, y: 0, zoom: 0.82 },
    },
    draftRevision: 1,
    hasUnpublishedChanges: true,
  };
}

export function createBookingServiceFlowTemplate(input: {
  flowId: string;
  lastUpdate: string;
}): ConversationFlow {
  const nodeId = (name: string) => `${input.flowId}-${name}`;
  const nodes: ConversationFlowNode[] = [
    {
      id: nodeId("start"),
      type: "start",
      position: { x: 540, y: 40 },
      data: {
        label: "Booking Intent",
        trigger: "booking_intent",
        triggerKeywords: [
          "booking",
          "service",
          "servis",
          "jadwal",
          "reservasi",
        ],
      },
    },
    {
      id: nodeId("welcome"),
      type: "message",
      position: { x: 500, y: 180 },
      data: {
        label: "Sambutan Booking",
        message:
          "Halo! Kami siap membantu booking servis di Johan Garage. Silakan lengkapi data kendaraan dan jadwal yang Anda inginkan.",
      },
    },
    {
      id: nodeId("office-hours"),
      type: "office_hours",
      position: { x: 500, y: 350 },
      data: { label: "Cek Jam Operasional" },
    },
    {
      id: nodeId("outside-message"),
      type: "message",
      position: { x: 130, y: 530 },
      data: {
        label: "Di Luar Jam Operasional",
        message:
          "Saat ini kami sedang di luar jam operasional. Anda tetap dapat mengisi form booking dan admin akan mengonfirmasi pada jam kerja berikutnya.",
      },
    },
    {
      id: nodeId("booking-form"),
      type: "form_chat",
      position: { x: 500, y: 570 },
      data: {
        label: "Form Booking Service",
        formTitle: "Booking Service Johan Garage",
        formDescription:
          "Isi data berikut agar admin dapat memeriksa kebutuhan servis dan ketersediaan jadwal.",
        formFillMode: "single_message",
        submitButtonLabel: "Kirim Permintaan Booking",
        successMessage:
          "Data booking sudah diterima. Admin akan memeriksa slot dan menghubungi Anda untuk konfirmasi.",
        formFields: [
          {
            id: "customer_name",
            label: "Nama Lengkap",
            type: "text",
            placeholder: "Masukkan nama lengkap",
            required: true,
          },
          {
            id: "whatsapp_number",
            label: "Nomor WhatsApp",
            type: "phone",
            placeholder: "Contoh: 081234567890",
            required: true,
          },
          {
            id: "vehicle_type",
            label: "Tipe Motor",
            type: "text",
            placeholder: "Contoh: Honda Genio 2022",
            required: true,
          },
          {
            id: "service_type",
            label: "Jenis Layanan",
            type: "select",
            options: [
              "Servis Berkala",
              "Servis CVT",
              "Ganti Oli",
              "Tune Up",
              "Kelistrikan",
              "Konsultasi Lainnya",
            ],
            required: true,
          },
          {
            id: "complaint",
            label: "Keluhan / Kebutuhan",
            type: "textarea",
            placeholder: "Jelaskan keluhan atau servis yang dibutuhkan",
            required: true,
          },
          {
            id: "preferred_date",
            label: "Tanggal Booking",
            type: "date",
            required: true,
          },
          {
            id: "preferred_time",
            label: "Pilihan Jam",
            type: "select",
            options: ["08:00", "10:00", "13:00", "15:00", "17:00"],
            required: true,
          },
        ],
      },
    },
    {
      id: nodeId("confirmation"),
      type: "message",
      position: { x: 410, y: 820 },
      data: {
        label: "Konfirmasi Permintaan",
        message:
          "Terima kasih, permintaan booking Anda sudah diterima. Jadwal belum dianggap final sebelum dikonfirmasi oleh admin Johan Garage.",
      },
    },
    {
      id: nodeId("handoff"),
      type: "handoff",
      position: { x: 500, y: 1020 },
      data: {
        label: "Konfirmasi Admin",
        message:
          "Data sudah diteruskan ke admin untuk pengecekan slot dan konfirmasi booking.",
        handoffTarget: "Admin Booking",
        handoffReason: "Permintaan booking baru perlu konfirmasi jadwal.",
      },
    },
    {
      id: nodeId("end"),
      type: "end",
      position: { x: 540, y: 1210 },
      data: { label: "Booking Menunggu Konfirmasi" },
    },
  ];

  const edge = (
    name: string,
    source: string,
    target: string,
    sourceHandle?: string,
    label?: string,
  ): ConversationFlowEdge => ({
    id: `${input.flowId}-edge-${name}`,
    source: nodeId(source),
    target: nodeId(target),
    sourceHandle,
    label,
  });

  const edges: ConversationFlowEdge[] = [
    edge("start-welcome", "start", "welcome"),
    edge("welcome-hours", "welcome", "office-hours"),
    edge(
      "hours-outside",
      "office-hours",
      "outside-message",
      "outside",
      "Di luar jam kerja",
    ),
    edge("hours-inside", "office-hours", "booking-form", "inside", "Jam kerja"),
    edge("outside-form", "outside-message", "booking-form"),
    edge(
      "form-submitted",
      "booking-form",
      "confirmation",
      "submitted",
      "Form dikirim",
    ),
    edge(
      "form-cancelled",
      "booking-form",
      "handoff",
      "cancelled",
      "Perlu bantuan",
    ),
    edge("confirmation-handoff", "confirmation", "handoff"),
    edge("handoff-end", "handoff", "end"),
  ];

  return {
    id: input.flowId,
    name: BOOKING_SERVICE_TEMPLATE_NAME,
    channel: "All Channels",
    trigger: "Booking intent",
    normalizedTrigger: "booking_intent",
    triggerKeywords: ["booking", "service", "servis", "jadwal", "reservasi"],
    initialMessage: "Halo! Kami siap membantu booking servis di Johan Garage.",
    interactiveMenu: [],
    fallbackMessage:
      "Data booking belum lengkap. Silakan lengkapi form atau tunggu bantuan admin.",
    humanAgentHandoff: {
      enabled: true,
      condition: "Booking baru perlu dikonfirmasi oleh admin.",
    },
    status: "Draft",
    botResponse: 0,
    lastUpdate: input.lastUpdate,
    draftGraph: {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 0.78 },
    },
    draftRevision: 1,
    hasUnpublishedChanges: true,
  };
}

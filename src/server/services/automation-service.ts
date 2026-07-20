import {
  deleteJobsByIds,
  enqueueJob,
  listDueJobs,
  listJobs,
  markJobCompleted,
  markJobFailed,
  markJobProcessing,
} from "@/server/repositories/job-repository";
import {
  getDashboardConfigRecord,
  getDashboardOperationsRecord,
  saveDashboardConfigRecord,
  saveDashboardOperationsRecord,
} from "@/server/repositories/dashboard-repository";
import { fetchExternalWithLimit } from "@/server/security/safe-fetch";
import { appendAutomationLog } from "@/server/services/automation-orchestrator";
import { sendChannelMessage } from "@/server/services/channel-adapters";
import { formatClockTime } from "@/lib/time";
import type {
  ApiIntegration,
  ApiTestResult,
  DashboardConfig,
} from "@/types/dashboard-config";
import type {
  ConversationRecord,
  CrmDealEntry,
  CrmTaskEntry,
  CustomerRecord,
} from "@/types/operations";

function interpolateTemplate(
  template: string,
  context: Record<string, string | undefined>,
) {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, rawKey: string) => {
    const value = context[rawKey.trim()];
    return value ?? "";
  });
}

function buildTemplateContext(input: {
  conversation?: Awaited<ReturnType<typeof getDashboardOperationsRecord>>["conversations"][number];
  customer?: Awaited<ReturnType<typeof getDashboardOperationsRecord>>["customers"][number];
}) {
  return {
    "conversation.id": input.conversation?.id,
    "conversation.last_message": input.conversation?.lastMessage,
    "conversation.intent": input.conversation?.lastIntent,
    "conversation.summary": input.conversation?.summary,
    "conversation.status": input.conversation?.status,
    "customer.id": input.customer?.id,
    "customer.name": input.customer?.name,
    "customer.phone": input.customer?.phone,
    "customer.email": input.customer?.email,
    "customer.segment": input.customer?.segment,
  };
}

function buildIntegrationHeaders(
  integration: ApiIntegration,
  templateContext: Record<string, string | undefined>,
) {
  let headers: Record<string, string> = {};
  if (integration.headers.trim()) {
    const parsed = JSON.parse(
      interpolateTemplate(integration.headers, templateContext),
    ) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("Headers API wajib berupa object JSON.");
    }
    headers = Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, String(value)]),
    );
  }

  const authToken = integration.authToken.trim();
  if (integration.authType === "Bearer Token" && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  } else if (integration.authType === "API Key" && authToken) {
    headers["X-API-Key"] = authToken;
  } else if (integration.authType === "Basic Auth" && authToken) {
    headers.Authorization = `Basic ${Buffer.from(authToken).toString("base64")}`;
  } else if (integration.authType === "Custom Header" && authToken) {
    const separator = authToken.indexOf(":");
    if (separator <= 0) {
      throw new Error("Custom Header harus memakai format Nama-Header: nilai.");
    }
    headers[authToken.slice(0, separator).trim()] = authToken
      .slice(separator + 1)
      .trim();
  }

  return headers;
}

async function executeApiIntegration(
  integration: ApiIntegration,
  templateContext: Record<string, string | undefined>,
) {
  const headers = buildIntegrationHeaders(integration, templateContext);
  let requestBody: string | undefined;
  if (integration.method !== "GET" && integration.requestBody.trim()) {
    requestBody = interpolateTemplate(integration.requestBody, templateContext);
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  const { response, buffer } = await fetchExternalWithLimit(
    integration.endpoint,
    {
      method: integration.method,
      headers,
      body: requestBody,
      cache: "no-store",
    },
    { timeoutMs: 10_000, maxBytes: 512 * 1024 },
  );

  return {
    status: response.status,
    responseBody: buffer.toString("utf8"),
    ok: response.status >= 200 && response.status < 300,
  };
}

function readMappedResponseValue(value: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, value);
}

function mapIntegrationResponse(responseBody: string, mapping: string) {
  const parsed = JSON.parse(responseBody) as unknown;
  const mappedValues = mapping
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(
        /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*response\.([a-zA-Z0-9_.-]+)$/,
      );
      if (!match) {
        throw new Error(
          `Response Mapping tidak valid: "${line.slice(0, 80)}". Gunakan format namaVariabel = response.field.path.`,
        );
      }

      const value = readMappedResponseValue(parsed, match[2]);
      if (value == null) {
        return null;
      }

      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);
      return `${match[1]}: ${serialized.slice(0, 1_000)}`;
    })
    .filter((item): item is string => Boolean(item));

  return mappedValues.join("\n").slice(0, 4_000);
}

export async function getApiIntegrationKnowledgeContext(input: {
  config: DashboardConfig;
  conversation: ConversationRecord;
  customer: CustomerRecord;
  messageText: string;
  agentId?: string;
}) {
  const activeAgent = input.config.automation.aiAgents.find(
    (agent) =>
      agent.id ===
      (input.agentId ?? input.conversation.automation?.activeAgentId),
  );
  if (activeAgent && !activeAgent.allowedActions.sendToApi) {
    return null;
  }

  const integration = input.config.automation.apiIntegrations.find(
    (item) =>
      item.status === "Active" &&
      item.endpoint.trim() &&
      item.responseMapping.trim(),
  );
  if (!integration) {
    return null;
  }

  try {
    const templateContext = buildTemplateContext({
      conversation: {
        ...input.conversation,
        lastMessage: input.messageText,
      },
      customer: input.customer,
    });
    const execution = await executeApiIntegration(integration, templateContext);
    if (!execution.ok || !execution.responseBody.trim()) {
      return null;
    }

    const mapped = mapIntegrationResponse(
      execution.responseBody,
      integration.responseMapping,
    );
    return mapped || null;
  } catch (error) {
    console.error(
      "[automation-service] failed to build API knowledge context",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function testApiIntegrationConnection(integrationId: string) {
  const config = await getDashboardConfigRecord();
  const integration = config.automation.apiIntegrations.find(
    (item) => item.id === integrationId,
  );
  if (!integration?.endpoint.trim()) {
    throw new Error("Integrasi API belum tersimpan atau endpoint masih kosong.");
  }

  let result: ApiTestResult = "Failed";
  let status = 0;
  let responseBody = "";

  try {
    const execution = await executeApiIntegration(integration, {
      "conversation.id": "connection-test",
      "conversation.last_message": "Connection test",
      "conversation.intent": "connection_test",
      "conversation.summary": "Chatbot API integration connection test",
      "conversation.status": "test",
      "customer.id": "connection-test",
      "customer.name": "Connection Test",
      "customer.phone": "",
      "customer.email": "",
      "customer.segment": "test",
    });
    status = execution.status;
    responseBody = execution.responseBody;
    if (execution.ok && integration.responseMapping.trim()) {
      const mapped = mapIntegrationResponse(
        execution.responseBody,
        integration.responseMapping,
      );
      if (!mapped) {
        throw new Error(
          "API berhasil merespons, tetapi Response Mapping tidak menghasilkan data.",
        );
      }
    }
    result = execution.ok
      ? "Success"
      : execution.status === 401 || execution.status === 403
        ? "Unauthorized"
        : "Failed";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown integration error";
    responseBody = message;
    result = /abort|timeout/i.test(message) ? "Timeout" : "Failed";
  }

  await saveDashboardConfigRecord({
    ...config,
    automation: {
      ...config.automation,
      apiIntegrations: config.automation.apiIntegrations.map((item) =>
        item.id === integrationId ? { ...item, lastTest: result } : item,
      ),
    },
  });

  return {
    integrationId,
    result,
    status,
    response: responseBody.slice(0, 300),
  };
}

async function processLeadFollowup(payload: Record<string, unknown>) {
  const current = await getDashboardOperationsRecord();
  const conversationId = String(payload.conversationId ?? "");
  const target = current.conversations.find((item) => item.id === conversationId);
  if (!target || target.status !== "waiting_customer") {
    return { skipped: true };
  }

  await sendChannelMessage({
    channel: target.channel,
    recipientId: target.phone ?? target.username ?? target.customerId,
    message:
      "Halo, kami follow-up ya. Jika masih ingin lanjut, cukup balas detail kebutuhan atau jadwal yang diinginkan.",
    phoneNumberIdOverride: target.channelContext?.whatsappPhoneNumberId,
    instagramAccountIdOverride: target.channelContext?.instagramAccountId,
  });

  target.messages.push({
    id: crypto.randomUUID(),
    sender: "system",
    text: "Follow-up otomatis dikirim oleh worker.",
    timestamp: formatClockTime(),
    type: "system",
  });
  target.lastMessage = "Follow-up otomatis dikirim oleh worker.";

  await saveDashboardOperationsRecord(current);
  return { sent: true };
}

async function processHandoffNotify(payload: Record<string, unknown>) {
  const current = await getDashboardOperationsRecord();
  const conversationId = String(payload.conversationId ?? "");
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { skipped: true };
  }

  const nextConversation = appendAutomationLog(conversation, {
    event: "conversation_status_changed",
    summary: "Worker handoff notify dijalankan untuk percakapan ini.",
    status: "applied",
  });
  current.conversations = current.conversations.map((item) =>
    item.id === conversationId ? nextConversation : item,
  );
  await saveDashboardOperationsRecord(current);

  return {
    notified: true,
    conversationId: payload.conversationId,
  };
}

async function processBookingReminder(payload: Record<string, unknown>) {
  const current = await getDashboardOperationsRecord();
  const bookingId = String(payload.bookingId ?? "");
  const booking = current.bookings.find((item) => item.id === bookingId);
  if (!booking) {
    return { skipped: true };
  }

  const customer = current.customers.find((item) => item.id === booking.customerId);
  const conv = current.conversations.find((c) => c.customerId === booking.customerId && c.channel === booking.channel);
  await sendChannelMessage({
    channel: booking.channel,
    recipientId: customer?.phone ?? customer?.username ?? booking.customerId,
    message: `Reminder booking ${booking.service} pada ${booking.date} jam ${booking.slot}.`,
    phoneNumberIdOverride: conv?.channelContext?.whatsappPhoneNumberId,
    instagramAccountIdOverride: conv?.channelContext?.instagramAccountId,
  });

  return { reminded: true };
}

async function processBroadcastSend(payload: Record<string, unknown>) {
  const current = await getDashboardOperationsRecord();
  const broadcastId = String(payload.broadcastId ?? "");
  const broadcast = current.broadcasts.find((item) => item.id === broadcastId);
  if (!broadcast) {
    return { skipped: true };
  }

  const audience = current.customers.filter((customer) => customer.leadStatus !== "Spam");
  for (const customer of audience.slice(0, 25)) {
    const conv = current.conversations.find((c) => c.customerId === customer.id && c.channel === broadcast.channel);
    await sendChannelMessage({
      channel: broadcast.channel,
      recipientId: customer.phone ?? customer.username ?? customer.id,
      message: broadcast.template,
      phoneNumberIdOverride: conv?.channelContext?.whatsappPhoneNumberId,
      instagramAccountIdOverride: conv?.channelContext?.instagramAccountId,
    });
  }

  broadcast.status = "sent";
  broadcast.sentCount += Math.min(audience.length, 25);
  broadcast.scheduledAt = "Dikirim worker";
  await saveDashboardOperationsRecord(current);

  return {
    sentCount: Math.min(audience.length, 25),
  };
}

async function processAnalyticsRollup() {
  return {
    rolledUpAt: new Date().toISOString(),
  };
}

async function processConversationIdleCheck(payload: Record<string, unknown>) {
  const config = await getDashboardConfigRecord();
  const current = await getDashboardOperationsRecord();
  const conversationId = String(payload.conversationId ?? "");
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { skipped: true, reason: "missing_conversation" };
  }

  if (
    conversation.status === "resolved" ||
    conversation.status === "spam" ||
    conversation.status === "ai_paused" ||
    conversation.status === "assigned_to_admin" ||
    !config.automation.idleAction.enabled
  ) {
    return { skipped: true, reason: "inactive_rule" };
  }

  const timeoutHours =
    config.automation.idleAction.idleTimeoutUnit === "days"
      ? config.automation.idleAction.idleTimeout * 24
      : config.automation.idleAction.idleTimeout;
  const times = [
    conversation.automation?.lastHumanReplyAt,
    conversation.automation?.lastOutboundAt,
    conversation.automation?.lastInboundAt,
  ]
    .filter((t): t is string => Boolean(t))
    .map((t) => new Date(t).getTime());

  const latestTime = times.length > 0 ? Math.max(...times) : null;
  if (!latestTime) {
    return { skipped: true, reason: "missing_reference" };
  }

  const idleAt = latestTime + timeoutHours * 60 * 60 * 1000;
  if (Date.now() < idleAt) {
    return { skipped: true, reason: "not_due" };
  }

  let nextConversation = conversation;

  if (config.automation.idleAction.idleMessage.trim()) {
    await sendChannelMessage({
      channel: conversation.channel,
      recipientId: conversation.phone ?? conversation.username ?? conversation.customerId,
      message: config.automation.idleAction.idleMessage,
      phoneNumberIdOverride: conversation.channelContext?.whatsappPhoneNumberId,
      instagramAccountIdOverride: conversation.channelContext?.instagramAccountId,
    });
  }

  if (
    config.automation.idleAction.actionType === "Mark as resolved" ||
    config.automation.idleAction.actionType === "Close conversation" ||
    config.automation.idleAction.autoClose
  ) {
    nextConversation = {
      ...nextConversation,
      status: "resolved",
      summary: "Percakapan di-resolve otomatis oleh idle action worker.",
    };
  }

  if (config.automation.idleAction.actionType === "Add label") {
    nextConversation = {
      ...nextConversation,
      tags: Array.from(new Set([...nextConversation.tags, "idle_action"])),
    };
  }

  if (config.automation.idleAction.actionType === "Assign to agent") {
    nextConversation = {
      ...nextConversation,
      assignedTo:
        config.automation.aiConfig.handoverTarget || "Admin Desk",
      status: "assigned_to_admin",
      summary: "Percakapan dialihkan otomatis ke agent oleh idle action worker.",
    };
  }

  if (config.automation.idleAction.actionType === "Trigger webhook") {
    const activeIntegration = config.automation.apiIntegrations.find(
      (integration) => integration.status === "Active" && integration.endpoint.trim(),
    );
    if (activeIntegration) {
      await enqueueJob({
        type: "api_integration_call",
        payload: {
          conversationId,
          integrationId: activeIntegration.id,
          event: "schedule_reached",
        },
      });
    }
  }

  nextConversation = appendAutomationLog(nextConversation, {
    event: "schedule_reached",
    summary: `Idle action dijalankan: ${config.automation.idleAction.actionType}.`,
    status: "applied",
  });

  current.conversations = current.conversations.map((item) =>
    item.id === conversationId ? nextConversation : item,
  );
  await saveDashboardOperationsRecord(current);

  return { applied: true, conversationId, status: nextConversation.status };
}

async function processCrmSync(payload: Record<string, unknown>) {
  const config = await getDashboardConfigRecord();
  const current = await getDashboardOperationsRecord();
  const conversationId = String(payload.conversationId ?? "");
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { skipped: true, reason: "missing_conversation" };
  }

  const customer = current.customers.find(
    (item) => item.id === conversation.customerId,
  );
  if (!customer) {
    return { skipped: true, reason: "missing_customer" };
  }

  let nextConversation = appendAutomationLog(conversation, {
    event: "schedule_reached",
    summary: `CRM sync dipicu untuk event ${String(payload.event ?? "unknown")}.`,
    status: "queued",
  });
  const provider = config.automation.crmIntegration.provider;

  if (provider === "Internal CRM") {
    const existingDealIndex = current.crmDeals.findIndex(
      (item) => item.contactId === customer.id,
    );
    const nextDeal: CrmDealEntry = {
      id:
        current.crmDeals[existingDealIndex]?.id ??
        `deal-${conversation.id}`,
      title: `${conversation.lastIntent || "Lead"} - ${customer.name}`,
      contactId: customer.id,
      contactName: customer.name,
      stage:
        customer.leadStatus === "Booking"
          ? "Booking"
          : customer.leadStatus === "Paid"
            ? "Won"
            : "New Lead",
      valueLabel: customer.revenueHint || "Rp0",
      probability: customer.leadStatus === "Booking" ? 70 : 35,
      owner: conversation.assignedTo || "AI Agent",
      source: conversation.channel,
      expectedClose: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      productOrService: conversation.lastIntent || "General inquiry",
      note: conversation.summary,
      createdAt:
        current.crmDeals[existingDealIndex]?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existingDealIndex >= 0) {
      current.crmDeals[existingDealIndex] = nextDeal;
    } else {
      current.crmDeals.unshift(nextDeal);
    }

    const existingTaskIndex = current.crmTasks.findIndex(
      (item) =>
        item.contactId === customer.id &&
        item.title === `Follow up ${conversation.lastIntent || "lead"}`,
    );
    const nextTask: CrmTaskEntry = {
      id:
        current.crmTasks[existingTaskIndex]?.id ??
        `task-${conversation.id}`,
      contactId: customer.id,
      contactName: customer.name,
      title: `Follow up ${conversation.lastIntent || "lead"}`,
      type: "Automation Sync",
      status: "Open",
      dueLabel: "Besok",
      priority: conversation.riskLevel === "high" ? "High" : "Medium",
      owner: conversation.assignedTo || "AI Agent",
      outcome: `Event ${String(payload.event ?? "unknown")} dipicu dari inbox.`,
      createdAt:
        current.crmTasks[existingTaskIndex]?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existingTaskIndex >= 0) {
      current.crmTasks[existingTaskIndex] = nextTask;
    } else {
      current.crmTasks.unshift(nextTask);
    }

    nextConversation = appendAutomationLog(nextConversation, {
      event: "schedule_reached",
      summary: "Internal CRM diperbarui dengan deal dan task terbaru dari percakapan ini.",
      status: "applied",
    });
  } else {
    nextConversation = appendAutomationLog(nextConversation, {
      event: "schedule_reached",
      summary: `Provider CRM ${provider} belum memiliki adapter khusus; sinkronisasi disimpan sebagai event orchestration.`,
      status: "skipped",
    });
  }

  current.conversations = current.conversations.map((item) =>
    item.id === conversationId ? nextConversation : item,
  );
  await saveDashboardOperationsRecord(current);

  return { synced: true, conversationId, provider };
}

async function processApiIntegrationCall(payload: Record<string, unknown>) {
  const config = await getDashboardConfigRecord();
  const current = await getDashboardOperationsRecord();
  const integrationId = String(payload.integrationId ?? "");
  const integration = config.automation.apiIntegrations.find(
    (item) => item.id === integrationId,
  );
  if (!integration?.endpoint.trim()) {
    return { skipped: true, reason: "missing_endpoint" };
  }

  const conversationId = String(payload.conversationId ?? "");
  const conversation = current.conversations.find((item) => item.id === conversationId);
  const customer = current.customers.find(
    (item) => item.id === conversation?.customerId,
  );
  const templateContext = buildTemplateContext({ conversation, customer });

  let responseStatus = 0;
  let responseBody = "";
  try {
    const execution = await executeApiIntegration(integration, templateContext);
    responseStatus = execution.status;
    responseBody = execution.responseBody;
  } catch (error) {
    responseBody = error instanceof Error ? error.message : "Unknown integration error";
  }

  if (conversation) {
    let nextConversation = appendAutomationLog(conversation, {
      event: "schedule_reached",
      summary:
        responseStatus >= 200 && responseStatus < 300
          ? `API integration "${integration.name}" berhasil dieksekusi.`
          : `API integration "${integration.name}" gagal dieksekusi.`,
      status:
        responseStatus >= 200 && responseStatus < 300 ? "applied" : "failed",
    });
    nextConversation = appendAutomationLog(nextConversation, {
      event: "schedule_reached",
      summary: `HTTP ${responseStatus || 500}: ${responseBody.slice(0, 180) || "Tanpa respons body"}`,
      status:
        responseStatus >= 200 && responseStatus < 300 ? "queued" : "failed",
    });
    current.conversations = current.conversations.map((item) =>
      item.id === conversation.id ? nextConversation : item,
    );
    await saveDashboardOperationsRecord(current);
  }

  return {
    dispatched: responseStatus >= 200 && responseStatus < 300,
    integrationId,
    endpoint: integration.endpoint,
    status: responseStatus,
    response: responseBody.slice(0, 300),
    event: payload.event ?? null,
  };
}

const jobHandlers: Record<
  string,
  (payload: Record<string, unknown>) => Promise<Record<string, unknown>>
> = {
  lead_followup: processLeadFollowup,
  handoff_notify: processHandoffNotify,
  booking_reminder: processBookingReminder,
  broadcast_send: processBroadcastSend,
  conversation_idle_check: processConversationIdleCheck,
  crm_sync: processCrmSync,
  api_integration_call: processApiIntegrationCall,
  analytics_rollup: async () => processAnalyticsRollup(),
};

export async function runDueJobs(limit = 20) {
  const dueJobs = await listDueJobs(limit);
  const results: Array<Record<string, unknown>> = [];

  for (const job of dueJobs) {
    await markJobProcessing(job.id);

    try {
      const handler = jobHandlers[job.type];
      if (!handler) {
        throw new Error(`Unknown job type: ${job.type}`);
      }

      const result = await handler(job.payload);
      await markJobCompleted(job.id);
      results.push({
        id: job.id,
        type: job.type,
        status: "completed",
        result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown worker error";
      await markJobFailed(job.id, message);
      results.push({
        id: job.id,
        type: job.type,
        status: "failed",
        error: message,
      });
    }
  }

  return results;
}

export async function scheduleOperationalJobs() {
  const config = await getDashboardConfigRecord();
  const current = await getDashboardOperationsRecord();

  for (const booking of current.bookings) {
    if (booking.status === "Confirmed" || booking.status === "Waiting Payment") {
      await enqueueJob({
        type: "booking_reminder",
        payload: { bookingId: booking.id },
        runAt: new Date(
          Date.now() + 1000 * 60 * 60 * config.automation.bookingReminderHours,
        ).toISOString(),
      });
    }
  }

  if (config.automation.idleAction.enabled) {
    const idleDelayHours =
      config.automation.idleAction.idleTimeoutUnit === "days"
        ? config.automation.idleAction.idleTimeout * 24
        : config.automation.idleAction.idleTimeout;
    for (const conversation of current.conversations) {
      if (conversation.status === "resolved" || conversation.status === "spam") {
        continue;
      }

      await enqueueJob({
        type: "conversation_idle_check",
        payload: {
          conversationId: conversation.id,
        },
        runAt: new Date(Date.now() + 1000 * 60 * 60 * idleDelayHours).toISOString(),
      });
    }
  }

  for (const broadcast of current.broadcasts) {
    if (broadcast.status === "scheduled") {
      await enqueueJob({
        type: "broadcast_send",
        payload: { broadcastId: broadcast.id },
      });
    }
  }

  await enqueueJob({
    type: "analytics_rollup",
    payload: {},
    runAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  });
}

export async function getWorkerJobs(limit?: number) {
  return listJobs(limit);
}

export async function pruneObsoleteJobs() {
  const [config, current, jobs] = await Promise.all([
    getDashboardConfigRecord(),
    getDashboardOperationsRecord(),
    listJobs(500),
  ]);

  const conversationIds = new Set(current.conversations.map((item) => item.id));
  const bookingIds = new Set(current.bookings.map((item) => item.id));
  const broadcastIds = new Set(current.broadcasts.map((item) => item.id));
  const activeIntegrationIds = new Set(
    config.automation.apiIntegrations
      .filter((integration) => integration.status === "Active" && integration.endpoint.trim())
      .slice(0, 1)
      .map((integration) => integration.id),
  );
  const conversationById = new Map(
    current.conversations.map((conversation) => [conversation.id, conversation] as const),
  );

  const obsoleteJobIds = jobs
    .filter((job) => {
      const conversationId = String(job.payload.conversationId ?? "");
      const bookingId = String(job.payload.bookingId ?? "");
      const broadcastId = String(job.payload.broadcastId ?? "");
      const integrationId = String(job.payload.integrationId ?? "");
      const conversation = conversationById.get(conversationId);

      if (conversationId && !conversationIds.has(conversationId)) {
        return true;
      }

      if (job.type === "lead_followup") {
        return !conversation || conversation.status !== "waiting_customer";
      }

      if (job.type === "handoff_notify") {
        return !conversation || conversation.status !== "assigned_to_admin";
      }

      if (job.type === "booking_reminder") {
        return !bookingIds.has(bookingId);
      }

      if (job.type === "broadcast_send") {
        return !broadcastIds.has(broadcastId);
      }

      if (job.type === "crm_sync") {
        return !config.automation.crmIntegration.enabled || !conversation;
      }

      if (job.type === "api_integration_call") {
        return !conversation || !activeIntegrationIds.has(integrationId);
      }

      return false;
    })
    .map((job) => job.id);

  const deleted = await deleteJobsByIds(obsoleteJobIds);

  return {
    scanned: jobs.length,
    deleted,
    deletedJobIds: obsoleteJobIds,
  };
}

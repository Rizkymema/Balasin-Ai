import { enqueueJob, listDueJobs, listJobs, markJobCompleted, markJobFailed, markJobProcessing } from "@/server/repositories/job-repository";
import {
  getDashboardConfigRecord,
  getDashboardOperationsRecord,
  saveDashboardOperationsRecord,
} from "@/server/repositories/dashboard-repository";
import { appendAutomationLog } from "@/server/services/automation-orchestrator";
import { sendChannelMessage } from "@/server/services/channel-adapters";
import { formatClockTime } from "@/lib/time";
import type { CrmDealEntry, CrmTaskEntry } from "@/types/operations";

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
    !config.automation.idleAction.enabled
  ) {
    return { skipped: true, reason: "inactive_rule" };
  }

  const timeoutHours =
    config.automation.idleAction.idleTimeoutUnit === "days"
      ? config.automation.idleAction.idleTimeout * 24
      : config.automation.idleAction.idleTimeout;
  const idleReference =
    conversation.automation?.lastHumanReplyAt ??
    conversation.automation?.lastOutboundAt ??
    conversation.automation?.lastInboundAt;

  if (!idleReference) {
    return { skipped: true, reason: "missing_reference" };
  }

  const idleAt = new Date(idleReference).getTime() + timeoutHours * 60 * 60 * 1000;
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
    const activeIntegrations = config.automation.apiIntegrations.filter(
      (integration) => integration.status === "Active" && integration.endpoint.trim(),
    );
    await Promise.allSettled(
      activeIntegrations.map((integration) =>
        enqueueJob({
          type: "api_integration_call",
          payload: {
            conversationId,
            integrationId: integration.id,
            event: "schedule_reached",
          },
        }),
      ),
    );
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

  let headers: Record<string, string> = {};
  if (integration.headers.trim()) {
    try {
      const parsedHeaders = JSON.parse(
        interpolateTemplate(integration.headers, templateContext),
      ) as Record<string, string>;
      headers = parsedHeaders;
    } catch {
      headers = {};
    }
  }

  if (integration.authType === "Bearer Token" && integration.authToken.trim()) {
    headers.Authorization = `Bearer ${integration.authToken.trim()}`;
  }

  let requestBody: string | undefined;
  if (integration.method !== "GET" && integration.requestBody.trim()) {
    requestBody = interpolateTemplate(integration.requestBody, templateContext);
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  let responseStatus = 0;
  let responseBody = "";
  try {
    const response = await fetch(integration.endpoint, {
      method: integration.method,
      headers,
      body: requestBody,
    });
    responseStatus = response.status;
    responseBody = await response.text();
  } catch (error) {
    responseBody = error instanceof Error ? error.message : "Unknown error";
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

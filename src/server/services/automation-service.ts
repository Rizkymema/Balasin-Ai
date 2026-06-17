import { enqueueJob, listDueJobs, listJobs, markJobCompleted, markJobFailed, markJobProcessing } from "@/server/repositories/job-repository";
import {
  getDashboardOperationsRecord,
  saveDashboardOperationsRecord,
} from "@/server/repositories/dashboard-repository";
import { sendChannelMessage } from "@/server/services/channel-adapters";
import { formatClockTime } from "@/lib/time";

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
  await sendChannelMessage({
    channel: booking.channel,
    recipientId: customer?.phone ?? customer?.username ?? booking.customerId,
    message: `Reminder booking ${booking.service} pada ${booking.date} jam ${booking.slot}.`,
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
    await sendChannelMessage({
      channel: broadcast.channel,
      recipientId: customer.phone ?? customer.username ?? customer.id,
      message: broadcast.template,
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

const jobHandlers: Record<
  string,
  (payload: Record<string, unknown>) => Promise<Record<string, unknown>>
> = {
  lead_followup: processLeadFollowup,
  handoff_notify: processHandoffNotify,
  booking_reminder: processBookingReminder,
  broadcast_send: processBroadcastSend,
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
  const current = await getDashboardOperationsRecord();

  for (const booking of current.bookings) {
    if (booking.status === "Confirmed" || booking.status === "Waiting Payment") {
      await enqueueJob({
        type: "booking_reminder",
        payload: { bookingId: booking.id },
        runAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
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

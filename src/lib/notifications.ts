import type { DashboardOperationsData } from "@/types/operations";

export type DashboardNotificationKind =
  | "conversation"
  | "handoff"
  | "booking"
  | "ticket";

export type DashboardNotification = {
  id: string;
  kind: DashboardNotificationKind;
  title: string;
  message: string;
  href: string;
  sourceId: string;
  priority: "normal" | "high";
  createdAt: string;
};

const ACTIONABLE_BOOKING_STATUSES = new Set([
  "New",
  "Pending Confirmation",
  "Waiting Payment",
  "Rescheduled",
]);

function getLastConversationTimestamp(
  conversation: DashboardOperationsData["conversations"][number],
) {
  return (
    conversation.messages.at(-1)?.timestamp ||
    conversation.lastSeenAt ||
    conversation.timestamp ||
    ""
  );
}

function getConversationMessage(
  conversation: DashboardOperationsData["conversations"][number],
) {
  const message = conversation.lastMessage || conversation.messages.at(-1)?.text;
  return message?.trim() || "Ada aktivitas baru yang perlu diperiksa.";
}

function getSortableTime(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function deriveDashboardNotifications(
  data: DashboardOperationsData,
  options: { includeHandoff?: boolean; limit?: number } = {},
) {
  const notifications: DashboardNotification[] = [];
  const includeHandoff = options.includeHandoff ?? true;

  for (const conversation of data.conversations) {
    if (conversation.unreadCount <= 0) continue;

    const isHandoff =
      includeHandoff && conversation.status === "assigned_to_admin";
    notifications.push({
      id: `${isHandoff ? "handoff" : "conversation"}:${conversation.id}`,
      kind: isHandoff ? "handoff" : "conversation",
      title: isHandoff ? "Handoff membutuhkan admin" : "Pesan baru di Inbox",
      message: `${conversation.name}: ${getConversationMessage(conversation)}`,
      href: `/inbox?conversation=${encodeURIComponent(conversation.id)}`,
      sourceId: conversation.id,
      priority: isHandoff ? "high" : "normal",
      createdAt: getLastConversationTimestamp(conversation),
    });
  }

  for (const booking of data.bookings) {
    if (!ACTIONABLE_BOOKING_STATUSES.has(booking.status)) continue;

    notifications.push({
      id: `booking:${booking.id}`,
      kind: "booking",
      title: "Booking membutuhkan tindakan",
      message: `${booking.customer} - ${booking.service} (${booking.status})`,
      href: "/booking",
      sourceId: booking.id,
      priority: booking.status === "Waiting Payment" ? "high" : "normal",
      createdAt: booking.date,
    });
  }

  for (const ticket of data.tickets) {
    if (ticket.status === "resolved") continue;

    notifications.push({
      id: `ticket:${ticket.id}`,
      kind: "ticket",
      title: "Tiket aktif perlu diperiksa",
      message: `${ticket.customerName} - ${ticket.issueType} (${ticket.status})`,
      href: "/tickets",
      sourceId: ticket.id,
      priority:
        ticket.priority === "critical" || ticket.priority === "high"
          ? "high"
          : "normal",
      createdAt: ticket.updatedAt || ticket.createdAt,
    });
  }

  notifications.sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority === "high" ? -1 : 1;
    }

    return getSortableTime(right.createdAt) - getSortableTime(left.createdAt);
  });

  return notifications.slice(0, options.limit ?? 12);
}

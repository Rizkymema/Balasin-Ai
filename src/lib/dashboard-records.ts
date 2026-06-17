import type {
  BookingStatus,
  ConversationStatus,
  LeadStatus,
  TicketStatus,
} from "@/types/operations";
import { formatOperatorTimestamp } from "@/lib/time";

export function createRecordId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createOperatorTimestamp() {
  return formatOperatorTimestamp();
}

export function normalizeLookupKey(value: string) {
  return value.trim().toLowerCase();
}

export function deriveLeadStatusFromBookingStatus(status: BookingStatus): LeadStatus {
  switch (status) {
    case "Done":
      return "Paid";
    case "Confirmed":
    case "Waiting Payment":
    case "Pending Confirmation":
    case "Rescheduled":
      return "Booking";
    case "Cancelled":
      return "Interested";
    case "New":
    default:
      return "Asked Price";
  }
}

export function deriveConversationStatusFromTicketStatus(
  status: TicketStatus,
): ConversationStatus {
  switch (status) {
    case "resolved":
      return "resolved";
    case "complaint":
      return "blocked";
    case "open":
    case "in_progress":
    default:
      return "assigned_to_admin";
  }
}

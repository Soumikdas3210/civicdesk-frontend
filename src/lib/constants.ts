import type { BadgeTone } from "@/components/ui/Badge";
import type { GrievanceAction } from "./types";

export type GrievanceStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_ON_CITIZEN"
  | "RESOLVED"
  | "REOPENED"
  | "CLOSED";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export const STATUS_ORDER: GrievanceStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_ON_CITIZEN",
  "RESOLVED",
  "REOPENED",
  "CLOSED",
];

export const STATUS_LABEL: Record<GrievanceStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_ON_CITIZEN: "Waiting on citizen",
  RESOLVED: "Resolved",
  REOPENED: "Reopened",
  CLOSED: "Closed",
};

export const STATUS_LABEL_CITIZEN: Record<GrievanceStatus, string> = {
  ...STATUS_LABEL,
  WAITING_ON_CITIZEN: "Waiting for your reply",
};

export const STATUS_TONE: Record<GrievanceStatus, BadgeTone> = {
  OPEN: "open",
  IN_PROGRESS: "progress",
  WAITING_ON_CITIZEN: "waiting",
  RESOLVED: "resolved",
  REOPENED: "reopened",
  CLOSED: "closed",
};

export const PRIORITY_ORDER: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PRIORITY_TONE: Record<Priority, BadgeTone> = {
  LOW: "closed",
  MEDIUM: "open",
  HIGH: "progress",
  URGENT: "danger",
};

export const PAGE_SIZE = 20;

export function statusLabel(
  status: GrievanceStatus,
  role: "citizen" | "officer" | "admin",
): string {
  return role === "citizen"
    ? STATUS_LABEL_CITIZEN[status]
    : STATUS_LABEL[status];
}

export const STATUS_RAIL: Record<GrievanceStatus, string> = {
  OPEN: "bg-open",
  IN_PROGRESS: "bg-progress",
  WAITING_ON_CITIZEN: "bg-waiting",
  RESOLVED: "bg-resolved",
  REOPENED: "bg-reopened",
  CLOSED: "bg-closed",
};

export const ACTION_LABEL: Record<GrievanceAction, string> = {
  START: "Start work",
  REQUEST_INFO: "Ask the citizen for information",
  CITIZEN_REPLY: "Reply",
  RESOLVE: "Mark as resolved",
  CLOSE: "Close this complaint",
  REOPEN: "Reopen this complaint",
  RESUME: "Resume work",
};

export const TIMELINE_STEPS = [
  "Open",
  "In progress",
  "Resolved",
  "Closed",
] as const;

export const TIMELINE_INDEX: Record<GrievanceStatus, number> = {
  OPEN: 0,
  IN_PROGRESS: 1,
  WAITING_ON_CITIZEN: 1,
  REOPENED: 1,
  RESOLVED: 2,
  CLOSED: 3,
};

type ActionConfirmation = {
  title: string;
  description: string;
  confirmLabel: string;
};

export const ACTION_CONFIRM: Partial <
  Record<GrievanceAction, ActionConfirmation>
> = {
  RESOLVE: {
    title: "Mark this complaint as resolved?",
    description:
      "The person who reported it will be told it is fixed and asked to rate the service. They can reopen it if they disagree.",
    confirmLabel: "Mark as resolved",
  },
  CLOSE: {
    title: "Close this complaint?",
    description:
      "Closing is final. The person who reported it will no longer be able to reopen it.",
    confirmLabel: "Close this complaint",
  },
  REOPEN: {
    title: "Reopen this complaint?",
    description:
      "This tells the council the problem is not fixed. A new deadline is set from today and any rating you gave is removed.",
    confirmLabel: "Reopen this complaint",
  },
  REQUEST_INFO: {
    title: "Ask the citizen for information?",
    description:
      "The resolution clock pauses until they reply, and they will be notified that you need something from them.",
    confirmLabel: "Ask for information",
  },
};
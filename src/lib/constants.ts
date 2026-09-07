import type { BadgeTone } from "@/components/ui/Badge";

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
import type { GrievanceStatus, Priority } from "./constants";

export type Department = {
  id: string;
  name: string;
  description: string | null;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  departmentId: string;
  department?: Department;
};

export type Ward = {
  id: string;
  name: string;
  code: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type Grievance = {
  id: string;
  trackingCode: string;
  title: string;
  description: string;
  status: GrievanceStatus;
  priority: Priority;
  citizenId: string;
  assignedOfficerId: string | null;
  category: Category;
  categoryId: string;
  ward: Ward;
  wardId: string;
  responseDueAt: string;
  resolutionDueAt: string;
  firstRespondedAt: string | null;
  resolvedAt: string | null;
  waitingSince: string | null;
  pausedMs: string;
  responseBreached: boolean;
  resolutionBreached: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type CannedResponse = {
  id: string;
  title: string;
  body: string;
  departmentId: string | null;
  categoryId: string | null;
  department?: Department | null;
  category?: Category | null;
  createdAt: string;
};

export type EscalationTrigger =
  | "RESPONSE_OVERDUE"
  | "RESOLUTION_OVERDUE"
  | "UNASSIGNED_FOR_HOURS";

export type EscalationAction = "RAISE_PRIORITY" | "NOTIFY_ADMIN";

export type EscalationRule = {
  id: string;
  name: string;
  isActive: boolean;
  trigger: EscalationTrigger;
  thresholdHours: number | null;
  priorityFilter: Priority | null;
  departmentId: string | null;
  department?: Department | null;
  action: EscalationAction;
  targetPriority: Priority | null;
};
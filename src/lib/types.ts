import type { GrievanceStatus, Priority } from "./constants";

export type AnalyticsOverview = {
  byStatus: Record<GrievanceStatus, number>;
  total: number;
  openCount: number;
  resolvedCount: number;
  responseBreachRate: number;
  resolutionBreachRate: number;
};

/** Raw SQL rows: counts come back as strings, averages as string or null. */
export type OfficerStat = {
  id: string;
  fullName: string;
  assigned: string;
  resolved: string;
  avgResolutionHours: string | null;
  avgCsat: string | null;
};

/** `/analytics/{departments,categories,wards}` rows. `total` is a string. */
export type NameTotalStat = {
  id: string;
  name: string;
  total: string;
};

/** `/analytics/sla` rows. `department` is the name; counts are strings. */
export type SlaBreachRow = {
  department: string;
  priority: Priority;
  responseBreaches: string;
  resolutionBreaches: string;
  total: string;
};

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

export type SlaPolicy = {
  id: string;
  categoryId: string;
  priority: Priority;
  responseDueHours: number;
  resolutionDueHours: number;
};

export type StaffRole = "citizen" | "officer" | "admin";

export type StaffUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: StaffRole;
  isActive: boolean;
  departmentId: string | null;
  createdAt: string;
};

export type GrievanceAction =
  | "START"
  | "REQUEST_INFO"
  | "CITIZEN_REPLY"
  | "RESOLVE"
  | "CLOSE"
  | "REOPEN"
  | "RESUME";

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
  availableActions?: GrievanceAction[];
};

export type Message = {
  id: string;
  grievanceId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  grievanceId: string;
  actorId: string | null;
  action: string;
  fromStatus: GrievanceStatus | null;
  toStatus: GrievanceStatus | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
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
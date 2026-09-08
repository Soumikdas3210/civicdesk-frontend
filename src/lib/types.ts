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

export type SlaPolicy = {
  id: string;
  categoryId: string;
  priority: Priority;
  responseDueHours: number;
  resolutionDueHours: number;
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
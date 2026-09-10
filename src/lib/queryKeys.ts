export const qk = {
  me: ["me"] as const,
  grievances: (q: unknown) => ["grievances", q] as const,
  grievance: (id: string) => ["grievance", id] as const,
  messages: (id: string) => ["messages", id] as const,
  wards: ["wards"] as const,
  categories: (opts?: { includeInactive?: boolean }) =>
    ["categories", { includeInactive: opts?.includeInactive ?? false }] as const,
  departments: ["departments"] as const,
  department: (id: string) => ["department", id] as const,
  tags: ["tags"] as const,
  slaPolicies: ["sla-policies"] as const,
  users: (q: unknown) => ["users", q] as const,
  officerWards: (userId: string) => ["officer-wards", userId] as const,
  eligibleOfficers: (id: string) => ["eligibleOfficers", id] as const,
  history: (id: string) => ["history", id] as const,
  analytics: (section: string) => ["analytics", section] as const,
  apiStatus: ["apiStatus"] as const,
};

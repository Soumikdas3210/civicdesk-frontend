export const qk = {
  me: ["me"] as const,
  grievances: (q: unknown) => ["grievances", q] as const,
  grievance: (id: string) => ["grievance", id] as const,
  messages: (id: string) => ["messages", id] as const,
  wards: ["wards"] as const,
  categories: ["categories"] as const,
};
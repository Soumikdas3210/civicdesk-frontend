"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { EscalationRule } from "@/lib/types";

export function useEscalationRules() {
  return useQuery({
    queryKey: qk.escalationRules,
    queryFn: async () =>
      (await http.get<EscalationRule[]>("/escalation-rules")).data,
    staleTime: 60 * 1000,
  });
}

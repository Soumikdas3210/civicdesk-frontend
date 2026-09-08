"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { CannedResponse } from "@/lib/types";

/**
 * The backend scopes this list to the requesting officer's department and
 * category assignments. Admins get the full set, which is what the
 * /admin/canned-responses CRUD screen expects.
 */
export function useCannedResponses() {
  return useQuery({
    queryKey: qk.cannedResponses,
    queryFn: async () =>
      (await http.get<CannedResponse[]>("/canned-responses")).data,
    staleTime: 60 * 1000,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { Grievance } from "@/lib/types";

export function useGrievance(id: string) {
  return useQuery({
    queryKey: qk.grievance(id),
    queryFn: async () => {
      const res = await http.get<Grievance>(`/grievances/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
}
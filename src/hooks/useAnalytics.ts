"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type {
  AnalyticsOverview,
  NameTotalStat,
  OfficerStat,
  SlaBreachRow,
} from "@/lib/types";

const STALE = 2 * 60 * 1000;

export function useOverview() {
  return useQuery({
    queryKey: qk.analytics("overview"),
    queryFn: async () =>
      (await http.get<AnalyticsOverview>("/analytics/overview")).data,
    staleTime: STALE,
  });
}

export function useOfficerStats() {
  return useQuery({
    queryKey: qk.analytics("officers"),
    queryFn: async () =>
      (await http.get<OfficerStat[]>("/analytics/officers")).data,
    staleTime: STALE,
  });
}

export function useNameTotals(section: "departments" | "categories" | "wards") {
  return useQuery({
    queryKey: qk.analytics(section),
    queryFn: async () =>
      (await http.get<NameTotalStat[]>(`/analytics/${section}`)).data,
    staleTime: STALE,
  });
}

export function useSlaBreaches() {
  return useQuery({
    queryKey: qk.analytics("sla"),
    queryFn: async () =>
      (await http.get<SlaBreachRow[]>("/analytics/sla")).data,
    staleTime: STALE,
  });
}

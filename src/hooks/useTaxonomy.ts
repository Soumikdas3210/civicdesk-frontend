"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { Category, Department, Tag, Ward } from "@/lib/types";

const HOUR = 60 * 60 * 1000;

export function useWards() {
  return useQuery({
    queryKey: qk.wards,
    queryFn: async () => (await http.get<Ward[]>("/wards")).data,
    staleTime: HOUR,
  });
}

export function useCategories(opts?: { includeInactive?: boolean }) {
  const includeInactive = opts?.includeInactive ?? false;
  return useQuery({
    queryKey: qk.categories({ includeInactive }),
    queryFn: async () =>
      (
        await http.get<Category[]>("/categories", {
          params: includeInactive ? { includeInactive: true } : undefined,
        })
      ).data,
    staleTime: HOUR,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: qk.departments,
    queryFn: async () => (await http.get<Department[]>("/departments")).data,
    staleTime: HOUR,
  });
}

export function useTags() {
  return useQuery({
    queryKey: qk.tags,
    queryFn: async () => (await http.get<Tag[]>("/tags")).data,
    staleTime: HOUR,
  });
}
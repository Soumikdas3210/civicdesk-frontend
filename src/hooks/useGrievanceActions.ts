"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { AuditLogEntry, Grievance, StaffUser } from "@/lib/types";
import type { Priority } from "@/lib/constants";

function useInvalidateGrievance(grievanceId: string) {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: qk.grievance(grievanceId) });
    await queryClient.invalidateQueries({ queryKey: qk.history(grievanceId) });
    await queryClient.invalidateQueries({
      queryKey: qk.eligibleOfficers(grievanceId),
    });
    await queryClient.invalidateQueries({ queryKey: ["grievances"] });
  };
}

export function useEligibleOfficers(grievanceId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.eligibleOfficers(grievanceId),
    queryFn: async () => {
      const res = await http.get<StaffUser[]>(
        `/grievances/${grievanceId}/eligible-officers`,
      );
      return res.data;
    },
    enabled: enabled && Boolean(grievanceId),
  });
}

export function useAssign(grievanceId: string) {
  const invalidate = useInvalidateGrievance(grievanceId);
  return useMutation({
    mutationFn: async (officerId?: string) => {
      const res = await http.patch<Grievance>(
        `/grievances/${grievanceId}/assign`,
        officerId ? { officerId } : {},
      );
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useRecategorize(grievanceId: string) {
  const invalidate = useInvalidateGrievance(grievanceId);
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await http.patch<Grievance>(
        `/grievances/${grievanceId}/category`,
        { categoryId },
      );
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useEscalate(grievanceId: string) {
  const invalidate = useInvalidateGrievance(grievanceId);
  return useMutation({
    mutationFn: async (input: {
      targetPriority?: Priority;
      notifyAdmin?: boolean;
      reason?: string;
    }) => {
      const res = await http.patch<Grievance>(
        `/grievances/${grievanceId}/escalate`,
        input,
      );
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useHistory(grievanceId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.history(grievanceId),
    queryFn: async () => {
      const res = await http.get<AuditLogEntry[]>(
        `/grievances/${grievanceId}/history`,
      );
      return res.data;
    },
    enabled: enabled && Boolean(grievanceId),
  });
}
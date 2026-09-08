"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { Grievance, GrievanceAction } from "@/lib/types";

export function useChangeStatus(grievanceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: GrievanceAction) => {
      const res = await http.patch<Grievance>(
        `/grievances/${grievanceId}/status`,
        { action },
      );
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: qk.grievance(grievanceId),
      });
      await queryClient.invalidateQueries({ queryKey: ["grievances"] });
      await queryClient.invalidateQueries({
        queryKey: ["history", grievanceId],
      });
    },
  });
}
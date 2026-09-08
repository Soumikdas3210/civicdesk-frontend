"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { CreateMessageInput } from "@/lib/schemas/message";
import type { Message } from "@/lib/types";

export function useMessages(grievanceId: string) {
  return useQuery({
    queryKey: qk.messages(grievanceId),
    queryFn: async () => {
      const res = await http.get<Message[]>(
        `/grievances/${grievanceId}/messages`,
      );
      return res.data;
    },
    enabled: Boolean(grievanceId),
  });
}

export function usePostMessage(grievanceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMessageInput) => {
      const res = await http.post<Message>(
        `/grievances/${grievanceId}/messages`,
        input,
      );
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: qk.messages(grievanceId),
      });
      await queryClient.invalidateQueries({
        queryKey: qk.grievance(grievanceId),
      });
      await queryClient.invalidateQueries({ queryKey: ["grievances"] });
    },
  });
}
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { Role } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  isActive: boolean;
  departmentId: string | null;
};

export function useCurrentUser() {
  return useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      const res = await http.get<CurrentUser>("/auth/me");
      return res.data;
    },
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000,
  });
}
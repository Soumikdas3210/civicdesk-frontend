"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Role } from "@/lib/roles";

type RoleGateProps = {
  allow: Role[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export default function RoleGate({
  allow,
  fallback = null,
  children,
}: RoleGateProps) {
  const { data: user } = useCurrentUser();
  return <>{user && allow.includes(user.role) ? children : fallback}</>;
}
"use client";

import { useCurrentRole } from "@/lib/session";
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
  const role = useCurrentRole();
  return <>{allow.includes(role) ? children : fallback}</>;
}
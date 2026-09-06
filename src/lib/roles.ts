export type Role = "citizen" | "officer" | "admin";

export type NavItem = {
  href: string;
  label: string;
};

export const NAV: Record<Role, NavItem[]> = {
  citizen: [
    { href: "/grievances", label: "My complaints" },
    { href: "/grievances/new", label: "Report a problem" },
    { href: "/notifications", label: "Notifications" },
  ],
  officer: [
    { href: "/grievances", label: "Complaints" },
    { href: "/notifications", label: "Notifications" },
  ],
  admin: [
    { href: "/grievances", label: "Complaints" },
    { href: "/notifications", label: "Notifications" },
    { href: "/analytics", label: "Analytics" },
    { href: "/admin/departments", label: "Departments" },
    { href: "/admin/wards", label: "Wards" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/sla-policies", label: "SLA policies" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/tags", label: "Tags" },
    { href: "/admin/canned-responses", label: "Canned responses" },
    { href: "/admin/escalation-rules", label: "Escalation rules" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  citizen: "Citizen",
  officer: "Officer",
  admin: "Admin",
};
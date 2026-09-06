"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV } from "@/lib/roles";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data: user } = useCurrentUser();
  const pathname = usePathname();

  if (!user) return null;

  const items = NAV[user.role];

  return (
    <nav aria-label="Sections" className="p-3">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/grievances" && pathname.startsWith(`${item.href}/`));

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-ctl px-3 text-secondary font-semibold transition-colors duration-150",
                  active
                    ? "bg-primary-50 text-primary-600"
                    : "text-n-700 hover:bg-n-100",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
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
                  "relative flex min-h-11 items-center rounded-ctl px-3 text-secondary transition-colors duration-150",
                  active
                    ? "bg-primary-100 font-bold text-primary-700 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-full before:bg-primary-600"
                    : "font-semibold text-n-700 hover:bg-n-100 hover:text-n-900",
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
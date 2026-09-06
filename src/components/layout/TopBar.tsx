"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import NotificationBell from "@/components/engagement/NotificationBell";
import { ROLE_LABEL } from "@/lib/roles";
import { CURRENT_USER } from "@/lib/session";

export default function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-15 items-center gap-3 border-b border-n-200 bg-surface px-4">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open sections menu"
        className="-ml-2 inline-flex size-11 items-center justify-center rounded-ctl text-n-700 transition-colors duration-150 hover:bg-n-100 app:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <h1 className="text-card-title">
        <Link href="/grievances">CivicDesk</Link>
      </h1>

      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <p className="text-secondary text-n-500">
          <span className="font-semibold text-n-900">{CURRENT_USER.name}</span>
          <span aria-hidden="true"> · </span>
          {ROLE_LABEL[CURRENT_USER.role]}
        </p>
      </div>
    </header>
  );
}
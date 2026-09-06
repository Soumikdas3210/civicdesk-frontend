"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import NotificationBell from "@/components/engagement/NotificationBell";
import Button from "@/components/ui/Button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { signOut } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";

export default function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { data: user } = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await signOut();
    queryClient.clear();
    router.replace("/login");
  }

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
        {user && (
          <p className="hidden text-secondary text-n-500 sm:block">
            <span className="font-semibold text-n-900">{user.fullName}</span>
            <span aria-hidden="true"> · </span>
            {ROLE_LABEL[user.role]}
          </p>
        )}
        <Button variant="ghost" onClick={() => void handleSignOut()}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
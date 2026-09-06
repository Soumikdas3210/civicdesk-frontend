"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <TopBar onOpenMenu={() => setMenuOpen(true)} />

      <div className="flex">
        <aside className="hidden w-[210px] shrink-0 border-r border-n-200 bg-surface app:block">
          <div className="sticky top-15">
            <Sidebar />
          </div>
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-40 app:hidden">
            <button
              type="button"
              aria-label="Close sections menu"
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-n-900/50"
            />
            <div className="absolute inset-y-0 left-0 w-[260px] bg-surface shadow-xl">
              <div className="flex h-15 items-center justify-between border-b border-n-200 px-4">
                <span className="text-card-title">Sections</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close sections menu"
                  className="-mr-2 inline-flex size-11 items-center justify-center rounded-ctl text-n-500 hover:bg-n-100"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-page px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
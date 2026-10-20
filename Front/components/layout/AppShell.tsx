"use client";

import { ConfigModal } from "@/components/config/ConfigModal";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        <footer className="border-t border-line px-4 py-4 text-center font-mono text-[10px] text-slate-600 md:px-8">
          RepuSense · Radar de Reputación en Crisis · NoCountry S10-26 Equipo 18
        </footer>
      </div>
      <ConfigModal />
    </div>
  );
}

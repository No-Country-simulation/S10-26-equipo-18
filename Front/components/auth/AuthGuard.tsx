"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { RadarIcon } from "@/components/ui/icons";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const vendedorId = useAppSelector((s) => s.auth.vendedorId);

  useEffect(() => {
    if (hydrated && !vendedorId) {
      router.replace("/login");
    }
  }, [hydrated, vendedorId, router]);

  if (!hydrated || !vendedorId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-slate-400">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute h-full w-full animate-pulse-ring rounded-full border border-primary/40" />
          <RadarIcon className="h-8 w-8 animate-pulse text-primary" />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest">
          Inicializando radar...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

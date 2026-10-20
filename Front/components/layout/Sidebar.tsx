"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav";
import { ConfigIcon, RadarIcon } from "@/components/ui/icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { abrirConfig } from "@/store/slices/uiSlice";
import { VENDEDORES } from "@/lib/constants";

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const vendedorId = useAppSelector((s) => s.auth.vendedorId);
  const vendedor = VENDEDORES.find((v) => v.id === vendedorId);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-sidebar/95 md:flex">
      <div className="flex items-center gap-3 border-b border-line px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-subtle-glow">
          <RadarIcon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-grotesk text-lg font-bold tracking-tight text-white">
              RepuSense
            </span>
            <span className="rounded-full border border-primary/30 bg-teal-950/60 px-1.5 py-0.5 font-mono text-[9px] font-medium text-primary">
              v2.4
            </span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Radar de reputación
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Operación
        </p>
        {NAV_ITEMS.map((item) => {
          const activo =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                activo
                  ? "border border-primary/30 bg-primary/10 text-primary"
                  : "border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Sistema
          </p>
          <button
            onClick={() => dispatch(abrirConfig())}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800/50 hover:text-slate-200"
          >
            <ConfigIcon className="h-4 w-4" />
            Configuración
          </button>
        </div>
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-lg border border-line bg-bg px-3 py-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
            style={{
              backgroundColor: (vendedor?.color ?? "#14b8a6") + "22",
              color: vendedor?.color ?? "#2dd4bf",
            }}
          >
            {vendedor?.iniciales ?? "??"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-200">
              {vendedor?.nombre ?? "Sin sesión"}
            </p>
            <p className="truncate font-mono text-[10px] text-slate-500">
              {vendedor?.cargo ?? "—"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

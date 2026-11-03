"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav";
import {
  ConfigIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  RadarIcon,
} from "@/components/ui/icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { abrirConfig, toggleSidebar } from "@/store/slices/uiSlice";
import { VENDEDORES } from "@/lib/constants";

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const vendedorId = useAppSelector((s) => s.auth.vendedorId);
  const vendedor = VENDEDORES.find((v) => v.id === vendedorId);
  const colapsado = useAppSelector((s) => s.ui.sidebarColapsado);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-sidebar/95 transition-all duration-300 md:flex",
        colapsado ? "w-[72px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-line",
          colapsado ? "justify-center px-2 py-5" : "gap-3 px-5 py-5",
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-subtle-glow">
          <RadarIcon className="h-5 w-5" />
        </div>
        {!colapsado && (
          <div className="min-w-0">
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
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {!colapsado && (
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Operación
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const activo =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={colapsado ? item.label : undefined}
              className={cn(
                "group flex items-center rounded-lg text-sm font-medium transition",
                colapsado ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                activo
                  ? "border border-primary/30 bg-primary/10 text-primary"
                  : "border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
              )}
            >
              <Icon className="h-4 w-4" />
              {!colapsado && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        <div className="pt-3">
          {!colapsado && (
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Sistema
            </p>
          )}
          <button
            onClick={() => dispatch(abrirConfig())}
            title={colapsado ? "Configuración" : undefined}
            className={cn(
              "flex w-full items-center rounded-lg text-sm font-medium text-slate-400 transition hover:bg-slate-800/50 hover:text-slate-200",
              colapsado ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
            )}
          >
            <ConfigIcon className="h-4 w-4" />
            {!colapsado && <span>Configuración</span>}
          </button>
        </div>
      </nav>

      <div className="border-t border-line p-2">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className={cn(
            "mb-2 flex w-full items-center rounded-lg text-slate-400 transition hover:bg-slate-800/50 hover:text-slate-200",
            colapsado ? "justify-center px-2 py-2" : "gap-2 px-2 py-2",
          )}
          title={colapsado ? "Expandir sidebar" : "Minimizar sidebar"}
          aria-label={colapsado ? "Expandir sidebar" : "Minimizar sidebar"}
        >
          {colapsado ? (
            <PanelLeftOpenIcon className="h-4 w-4" />
          ) : (
            <PanelLeftCloseIcon className="h-4 w-4" />
          )}
          {!colapsado && <span className="text-xs">Minimizar</span>}
        </button>
        <div
          className={cn(
            "flex items-center rounded-lg border border-line bg-bg",
            colapsado ? "justify-center px-1 py-1.5" : "gap-3 px-3 py-2.5",
          )}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
            style={{
              backgroundColor: (vendedor?.color ?? "#14b8a6") + "22",
              color: vendedor?.color ?? "#2dd4bf",
            }}
            title={colapsado ? vendedor?.nombre : undefined}
          >
            {vendedor?.iniciales ?? "??"}
          </span>
          {!colapsado && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">
                {vendedor?.nombre ?? "Sin sesión"}
              </p>
              <p className="truncate font-mono text-[10px] text-slate-500">
                {vendedor?.cargo ?? "—"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

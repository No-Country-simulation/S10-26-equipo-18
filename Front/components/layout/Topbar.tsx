"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "./nav";
import { cn } from "@/lib/cn";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { abrirConfig } from "@/store/slices/uiSlice";
import { STORAGE_KEY } from "@/components/auth/AuthHydrator";
import { ConfigIcon, LogoutIcon, RadarIcon } from "@/components/ui/icons";
import { VENDEDORES } from "@/lib/constants";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vendedorId = useAppSelector((s) => s.auth.vendedorId);
  const vendedor = VENDEDORES.find((v) => v.id === vendedorId);

  const actual =
    NAV_ITEMS.find((i) =>
      i.href === "/" ? pathname === "/" : pathname.startsWith(i.href),
    ) ?? NAV_ITEMS[0];

  function cerrarSesion() {
    dispatch(logout());
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-sidebar/90 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 md:hidden">
            <RadarIcon className="h-5 w-5 text-primary" />
            <span className="font-grotesk text-base font-bold text-white">
              RepuSense
            </span>
          </div>
          <h1 className="hidden font-grotesk text-xl font-bold tracking-tight text-white md:block">
            {actual.href === "/" ? "Panel de Control" : actual.label}
          </h1>
          <p className="mt-0.5 hidden text-xs text-slate-400 md:block">
            {actual.descripcion}
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-line bg-slate-900/80 px-3 py-1.5 font-mono text-xs text-slate-300 lg:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span>
              ESTADO: <strong className="text-primary">ACTIVO</strong>
            </span>
          </div>
          <button
            onClick={() => dispatch(abrirConfig())}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-slate-900/80 text-slate-300 transition hover:text-primary md:hidden"
            aria-label="Configuración"
          >
            <ConfigIcon className="h-4 w-4" />
          </button>
          {vendedor ? (
            <div className="hidden items-center gap-2 rounded-lg border border-line bg-bg px-3 py-1.5 sm:flex">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: vendedor.color + "22",
                  color: vendedor.color,
                }}
              >
                {vendedor.iniciales}
              </span>
              <span className="text-xs text-slate-300">{vendedor.nombre}</span>
            </div>
          ) : null}
          <button
            onClick={cerrarSesion}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-slate-900/80 text-slate-400 transition hover:text-rose-400"
            aria-label="Cerrar sesión"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-line/60 px-4 py-2 md:hidden">
        {NAV_ITEMS.map((item) => {
          const activo =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition",
                activo
                  ? "bg-primary/10 text-primary"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

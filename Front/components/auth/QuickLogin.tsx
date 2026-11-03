"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setVendedor } from "@/store/slices/authSlice";
import { VENDEDORES } from "@/lib/constants";
import { ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { STORAGE_KEY } from "./AuthHydrator";

export function QuickLogin() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [ingresando, setIngresando] = useState<string | null>(null);

  function entrar(id: string) {
    if (ingresando) return;
    setIngresando(id);
    dispatch(setVendedor(id));
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // noop
    }
    router.replace("/");
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
          Acceso rápido
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        Elegí un vendedor para entrar al radar con un solo clic.
      </p>

      <div className="mt-3 space-y-2">
        {VENDEDORES.map((v) => {
          const activo = ingresando === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => entrar(v.id)}
              disabled={ingresando !== null}
              aria-label={`Ingresar como ${v.nombre}, ${v.cargo}`}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border border-line bg-bg px-3 py-2.5 text-left transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-wait",
                activo && "border-primary/50 bg-primary/10",
              )}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  backgroundColor: v.color + "22",
                  color: v.color,
                }}
              >
                {v.iniciales}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-200">
                  {v.nombre}
                </span>
                <span className="block truncate text-[11px] text-slate-400">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                    Rol
                  </span>{" "}
                  · {v.cargo}
                </span>
                <span className="block truncate font-mono text-[10px] text-slate-500">
                  {v.email}
                </span>
              </span>
              <ChevronRightIcon
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-primary",
                  activo && "animate-pulse text-primary",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

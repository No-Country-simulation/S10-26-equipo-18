"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { cerrarConfig } from "@/store/slices/uiSlice";
import { setVendedor } from "@/store/slices/authSlice";
import { VENDEDORES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { CheckIcon, XIcon } from "@/components/ui/icons";
import { STORAGE_KEY } from "@/components/auth/AuthHydrator";
import { reiniciarMock } from "@/store/api/mockBaseQuery";

const REGLAS = [
  { label: "Calificación máxima", value: "≤ 3.5 ★" },
  { label: "Reseñas mínimas", value: "≥ 10" },
  { label: "Categorías IA", value: "6 clases" },
  { label: "Auto-draft de email", value: "Activado" },
];

export function ConfigModal() {
  const open = useAppSelector((s) => s.ui.configOpen);
  const vendedorId = useAppSelector((s) => s.auth.vendedorId);
  const dispatch = useAppDispatch();

  if (!open) return null;

  const usandoApi = Boolean(process.env.NEXT_PUBLIC_API_URL);

  function elegir(id: string) {
    dispatch(setVendedor(id));
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // noop
    }
  }

  function restablecer() {
    reiniciarMock();
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => dispatch(cerrarConfig())}
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-grotesk text-lg font-bold text-white">
              Configuración del Radar
            </h2>
            <p className="text-xs text-slate-400">
              Operador, reglas de captura y conexión de datos
            </p>
          </div>
          <button
            onClick={() => dispatch(cerrarConfig())}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          <section>
            <p className="label">Identidad del operador</p>
            <div className="space-y-2">
              {VENDEDORES.map((v) => {
                const activo = v.id === vendedorId;
                return (
                  <button
                    key={v.id}
                    onClick={() => elegir(v.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition",
                      activo
                        ? "border-primary/40 bg-primary/10"
                        : "border-line bg-bg hover:border-slate-600",
                    )}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: v.color + "22",
                        color: v.color,
                      }}
                    >
                      {v.iniciales}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-slate-200">
                        {v.nombre}
                      </span>
                      <span className="block font-mono text-[11px] text-slate-500">
                        {v.email}
                      </span>
                    </span>
                    {activo ? (
                      <CheckIcon className="h-4 w-4 text-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <p className="label">Reglas de captura del radar</p>
            <div className="grid grid-cols-2 gap-2">
              {REGLAS.map((r) => (
                <div
                  key={r.label}
                  className="rounded-lg border border-line bg-bg px-3 py-2"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    {r.label}
                  </p>
                  <p className="font-grotesk text-sm font-semibold text-slate-200">
                    {r.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="label">Conexión de datos</p>
            <div className="flex items-center justify-between rounded-lg border border-line bg-bg px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    usandoApi ? "bg-emerald-400" : "bg-amber-400",
                  )}
                />
                <span className="text-sm text-slate-200">
                  {usandoApi ? "Backend conectado" : "Modo demo (datos mock)"}
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">
                {usandoApi
                  ? process.env.NEXT_PUBLIC_API_URL
                  : "NEXT_PUBLIC_API_URL no definida"}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Al definir <span className="font-mono text-slate-400">NEXT_PUBLIC_API_URL</span>{" "}
              RTK Query deja de usar los datos mock y consulta la API real.
            </p>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-4">
          <Button variant="secondary" size="sm" onClick={restablecer}>
            Restablecer datos demo
          </Button>
          <Button size="sm" onClick={() => dispatch(cerrarConfig())}>
            Listo
          </Button>
        </div>
      </div>
    </div>
  );
}

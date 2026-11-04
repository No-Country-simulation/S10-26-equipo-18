"use client";

import type { Scan, ScanEstado } from "@/lib/types";
import { formatFechaHora } from "@/lib/format";
import { cn } from "@/lib/cn";

const ESTADO_SCAN: Record<
  ScanEstado,
  { label: string; className: string }
> = {
  completado: {
    label: "Completado",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  en_progreso: {
    label: "En progreso",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  fallido: {
    label: "Fallido",
    className: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  },
};

function formatRango(scan: Scan): string {
  const min = scan.ratingMin.toFixed(1);
  const max = scan.ratingMax.toFixed(1);
  return `${min}–${max}★ · ≥${scan.resenasMin}`;
}

export function ScanHistory({ scans }: { scans: Scan[] }) {
  if (scans.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Todavía no hay escaneos ejecutados.
      </p>
    );
  }
  return (
    <div className="custom-scroll -mx-1 overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-slate-500">
            <th className="px-3 py-2.5 font-medium">Fecha</th>
            <th className="px-3 py-2.5 font-medium">Ciudad</th>
            <th className="px-3 py-2.5 font-medium">Rubro</th>
            <th className="px-3 py-2.5 font-medium">Plataformas</th>
            <th className="px-3 py-2.5 font-medium">Filtros</th>
            <th className="px-3 py-2.5 font-medium">Estado</th>
            <th className="px-3 py-2.5 text-right font-medium">Nuevos</th>
            <th className="px-3 py-2.5 text-right font-medium">Actualizados</th>
            <th className="px-3 py-2.5 text-right font-medium">Duración</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {scans.map((s) => {
            const estado = ESTADO_SCAN[s.estado];
            return (
              <tr key={s.id} className="transition hover:bg-slate-900/40">
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-400">
                  {formatFechaHora(s.fecha)}
                </td>
                <td className="px-3 py-2.5 text-slate-200">{s.ciudad}</td>
                <td className="px-3 py-2.5 text-slate-300">{s.rubro}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {s.plataformas.map((p) => (
                      <span
                        key={p}
                        className="rounded border border-line bg-bg px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-400">
                  {formatRango(s)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 font-mono text-[10px]",
                      estado.className,
                    )}
                  >
                    {estado.label}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-primary">
                  +{s.nuevos}
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sky-400">
                  {s.actualizados}
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-400">
                  {s.duracionSeg === null ? "—" : `${s.duracionSeg}s`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

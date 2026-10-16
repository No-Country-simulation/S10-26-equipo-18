"use client";

import type { Scan } from "@/lib/types";
import { formatFechaHora } from "@/lib/format";

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
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-slate-500">
            <th className="px-3 py-2.5 font-medium">Fecha</th>
            <th className="px-3 py-2.5 font-medium">Ciudad</th>
            <th className="px-3 py-2.5 font-medium">Rubro</th>
            <th className="px-3 py-2.5 font-medium">Plataformas</th>
            <th className="px-3 py-2.5 font-medium">Filtros</th>
            <th className="px-3 py-2.5 text-right font-medium">Nuevos</th>
            <th className="px-3 py-2.5 text-right font-medium">Actualizados</th>
            <th className="px-3 py-2.5 text-right font-medium">Duración</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {scans.map((s) => (
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
                ≤{s.ratingMax}★ · ≥{s.resenasMin}
              </td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-primary">
                +{s.nuevos}
              </td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sky-400">
                {s.actualizados}
              </td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-400">
                {s.duracionSeg}s
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { ScanResult } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { CheckIcon, RadarIcon } from "@/components/ui/icons";

export interface LogLine {
  id: number;
  hora: string;
  texto: string;
  tipo: "info" | "ok" | "warn";
}

const TONO: Record<LogLine["tipo"], string> = {
  info: "text-slate-400",
  ok: "text-primary",
  warn: "text-rose-400",
};

export function RadarMonitor({
  logs,
  running,
  result,
}: {
  logs: LogLine[];
  running: boolean;
  result: ScanResult | null;
}) {
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="card flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <RadarIcon
            className={cn("h-4 w-4 text-primary", running && "animate-spin")}
          />
          <span className="font-grotesk text-sm font-semibold text-white">
            Monitor de ejecución
          </span>
        </div>
        <span className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              running ? "animate-pulse bg-primary" : "bg-slate-600",
            )}
          />
          {running ? "ESCANEANDO" : "EN ESPERA"}
        </span>
      </div>

      {running ? (
        <div className="h-1 w-full overflow-hidden bg-slate-800">
          <div className="h-full w-1/3 animate-slide bg-primary" />
        </div>
      ) : null}

      <div className="custom-scroll flex-1 space-y-1.5 overflow-y-auto bg-bg p-4 font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-slate-600">
            Configurá los parámetros y lanzá el escaneo radar para ver la
            actividad en vivo.
          </p>
        ) : (
          logs.map((l) => (
            <div key={l.id} className="flex gap-3">
              <span className="shrink-0 text-slate-600">{l.hora}</span>
              <span className={TONO[l.tipo]}>{l.texto}</span>
            </div>
          ))
        )}
        <div ref={fin} />
      </div>

      {result ? (
        <div className="border-t border-line bg-surface p-4">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <CheckIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Escaneo completado</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-line bg-bg px-3 py-2">
              <p className="font-mono text-[10px] uppercase text-slate-500">
                Nuevos
              </p>
              <p className="font-grotesk text-lg font-bold tabular-nums text-primary">
                +{result.nuevos}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-bg px-3 py-2">
              <p className="font-mono text-[10px] uppercase text-slate-500">
                Actualizados
              </p>
              <p className="font-grotesk text-lg font-bold tabular-nums text-sky-400">
                {result.actualizados}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-bg px-3 py-2">
              <p className="font-mono text-[10px] uppercase text-slate-500">
                Total
              </p>
              <p className="font-grotesk text-lg font-bold tabular-nums text-white">
                {result.total}
              </p>
            </div>
          </div>
          <Link href="/leads" className="mt-3 block">
            <Button className="w-full">Ver leads capturados</Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

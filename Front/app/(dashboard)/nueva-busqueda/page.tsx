"use client";

import { useRef, useState } from "react";
import { useCreateScanMutation } from "@/store/api/leadsApi";
import { CIUDADES, PLATAFORMAS, RUBROS } from "@/lib/constants";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RadarMonitor, type LogLine } from "@/components/search/RadarMonitor";
import type { ScanResult } from "@/lib/types";
import { cn } from "@/lib/cn";
import { RadarIcon } from "@/components/ui/icons";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hora = () =>
  new Date().toLocaleTimeString("es-AR", { hour12: false });

export default function NuevaBusquedaPage() {
  const [ciudad, setCiudad] = useState("Buenos Aires");
  const [rubro, setRubro] = useState("Restaurantes");
  const [plataformas, setPlataformas] = useState<string[]>(["Google Maps"]);
  const [ratingMax, setRatingMax] = useState(3.5);
  const [resenasMin, setResenasMin] = useState(20);

  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const idRef = useRef(0);

  const [createScan] = useCreateScanMutation();

  function push(texto: string, tipo: LogLine["tipo"] = "info") {
    idRef.current += 1;
    setLogs((l) => [...l, { id: idRef.current, hora: hora(), texto, tipo }]);
  }

  function togglePlataforma(p: string) {
    setPlataformas((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  async function lanzar() {
    if (running) return;
    setRunning(true);
    setResult(null);
    setLogs([]);
    idRef.current = 0;

    push(`[INIT] Configurando radar · ${ciudad} · ${rubro}`);
    await sleep(350);
    push(
      `[NET] Conectando con ${plataformas.join(" + ") || "Google Maps"}...`,
    );
    await sleep(450);
    push(
      `[SCAN] Buscando negocios con ≤ ${ratingMax.toFixed(1)}★ y ≥ ${resenasMin} reseñas`,
    );
    await sleep(500);

    try {
      const res = await createScan({
        ciudad,
        rubro,
        plataformas: plataformas.length ? plataformas : ["Google Maps"],
        ratingMax,
        resenasMin,
      }).unwrap();

      push("[AI] Extrayendo reseñas negativas recientes...");
      await sleep(450);
      push("[AI] Clasificando en 6 categorías de dolor (LLM)...");
      await sleep(450);
      push("[AI] Redactando draft de primer contacto...");
      await sleep(400);
      push(
        `[OK] ${res.nuevos} leads nuevos · ${res.actualizados} actualizados · ${res.total} en total`,
        "ok",
      );
      setResult(res);
    } catch {
      push("[ERR] El escaneo falló. Reintentá en unos segundos.", "warn");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="Parámetros del escaneo"
          subtitle="Definí dónde y qué buscar en el radar"
        />

        <div className="mt-5 space-y-5">
          <div>
            <p className="label">Ciudad</p>
            <div className="flex flex-wrap gap-2">
              {CIUDADES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCiudad(c)}
                  disabled={running}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
                    ciudad === c
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-line bg-bg text-slate-400 hover:text-slate-200",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Rubro</p>
            <div className="flex flex-wrap gap-2">
              {RUBROS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRubro(r)}
                  disabled={running}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
                    rubro === r
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-line bg-bg text-slate-400 hover:text-slate-200",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Plataformas de reseñas</p>
            <div className="flex flex-wrap gap-2">
              {PLATAFORMAS.map((p) => {
                const activo = plataformas.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlataforma(p)}
                    disabled={running}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
                      activo
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-line bg-bg text-slate-400 hover:text-slate-200",
                    )}
                  >
                    <span
                      className={cn(
                        "h-3 w-3 rounded border",
                        activo
                          ? "border-primary bg-primary"
                          : "border-slate-600",
                      )}
                    />
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="label mb-0">Calificación máxima</p>
              <span className="font-mono text-sm text-primary">
                ≤ {ratingMax.toFixed(1)} ★
              </span>
            </div>
            <input
              type="range"
              min={1.8}
              max={4}
              step={0.1}
              value={ratingMax}
              disabled={running}
              onChange={(e) => setRatingMax(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Solo negocios por debajo de este umbral entran al radar.
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="label mb-0">Reseñas mínimas</p>
              <span className="font-mono text-sm text-primary">
                ≥ {resenasMin}
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={resenasMin}
              disabled={running}
              onChange={(e) => setResenasMin(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Evita negocios sin volumen suficiente de opiniones.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={lanzar} disabled={running} className="flex-1">
              <RadarIcon
                className={cn("h-4 w-4", running && "animate-spin")}
              />
              {running ? "Escaneando..." : "Lanzar escaneo radar"}
            </Button>
            <Button
              variant="secondary"
              disabled={running}
              onClick={() => {
                setLogs([]);
                setResult(null);
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      <RadarMonitor logs={logs} running={running} result={result} />
    </div>
  );
}

import type { Scan, ScanEstado } from "@/lib/types";

/** Contrato real de `GET /api/scans` y `GET /api/scans/{id}` (snake_case). */
export interface ApiScan {
  id: string;
  ciudad: string;
  rubro: string;
  plataformas: string[] | null;
  rating_min: string | number | null;
  rating_max: string | number | null;
  resenas_min: number | null;
  estado: string | null;
  fecha: string;
  nuevos: number | null;
  actualizados: number | null;
  total: number | null;
  duracion_seg: number | null;
}

const ESTADOS: ScanEstado[] = ["completado", "en_progreso", "fallido"];

function numero(valor: string | number | null | undefined, porDefecto = 0): number {
  if (valor === null || valor === undefined) return porDefecto;
  const parseado = typeof valor === "string" ? Number.parseFloat(valor) : valor;
  return Number.isFinite(parseado) ? parseado : porDefecto;
}

export function mapApiScan(apiScan: ApiScan): Scan {
  return {
    id: apiScan.id,
    ciudad: apiScan.ciudad,
    rubro: apiScan.rubro,
    plataformas:
      Array.isArray(apiScan.plataformas) && apiScan.plataformas.length > 0
        ? apiScan.plataformas
        : ["Google Maps"],
    ratingMin: numero(apiScan.rating_min, 1.5),
    ratingMax: numero(apiScan.rating_max, 3.5),
    resenasMin: numero(apiScan.resenas_min, 0),
    fecha: apiScan.fecha,
    nuevos: numero(apiScan.nuevos),
    actualizados: numero(apiScan.actualizados),
    total: numero(apiScan.total),
    estado: ESTADOS.includes(apiScan.estado as ScanEstado)
      ? (apiScan.estado as ScanEstado)
      : "en_progreso",
    duracionSeg: apiScan.duracion_seg ?? null,
  };
}

export function mapApiScans(apiScans: ApiScan[]): Scan[] {
  return apiScans
    .map(mapApiScan)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

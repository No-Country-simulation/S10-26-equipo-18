import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import {
  SCANS,
  calcularStats,
  construirListado,
  LEADS,
} from "@/lib/mock/dataset";
import type { Lead, LeadEstado, LeadQuery, Scan } from "@/lib/types";

let leads: Lead[] = LEADS.map((l) => ({ ...l }));
let scans: Scan[] = SCANS.map((s) => ({ ...s }));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function notFound(message: string): { error: FetchBaseQueryError } {
  return {
    error: { status: 404, data: message },
  };
}

export const mockBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args) => {
  const { url, method = "GET", params, body } =
    typeof args === "string" ? ({ url: args } as FetchArgs) : args;

  await delay(180 + Math.random() * 220);

  if (url === "leads" && method === "GET") {
    return { data: construirListado(leads, (params ?? {}) as LeadQuery) };
  }

  if (url === "dashboard" && method === "GET") {
    return { data: calcularStats(leads) };
  }

  if (url === "scans" && method === "GET") {
    return { data: scans };
  }

  if (url === "scans" && method === "POST") {
    const req = body as {
      ciudad: string;
      rubro: string;
      plataformas: string[];
      ratingMax: number;
      resenasMin: number;
    };
    const nuevos = 18 + Math.floor(Math.random() * 30);
    const actualizados = Math.floor(Math.random() * 9);
    const scan: Scan = {
      id: `scan-${Date.now()}`,
      ciudad: req.ciudad,
      rubro: req.rubro,
      plataformas: req.plataformas,
      ratingMax: req.ratingMax,
      resenasMin: req.resenasMin,
      fecha: new Date().toISOString(),
      nuevos,
      actualizados,
      total: nuevos + actualizados,
      estado: "completado",
      duracionSeg: 90 + Math.floor(Math.random() * 120),
    };
    scans = [scan, ...scans];
    return {
      data: { scan, nuevos, actualizados, total: nuevos + actualizados },
    };
  }

  const match = url?.match(/^leads\/(.+)$/);
  if (match) {
    const id = match[1];
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) return notFound(`Lead ${id} no encontrado`);

    if (method === "GET") {
      return { data: leads[index] };
    }
    if (method === "PUT" || method === "PATCH") {
      const cambios = (body ?? {}) as Partial<Lead>;
      leads[index] = { ...leads[index], ...cambios };
      if (cambios.estado && cambios.estado !== "nuevo") {
        leads[index].actualizado = true;
      }
      return { data: leads[index] };
    }
  }

  return notFound(`Endpoint mock no implementado: ${method} ${url}`);
};

export function reiniciarMock() {
  leads = LEADS.map((l) => ({ ...l }));
  scans = SCANS.map((s) => ({ ...s }));
}

export type { LeadEstado };

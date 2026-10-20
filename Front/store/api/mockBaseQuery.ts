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
import type {
  Lead,
  LeadEstado,
  LeadQuery,
  Scan,
  ScanRequest,
} from "@/lib/types";

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
    const req = body as ScanRequest;

    let respuesta: { leads?: Lead[]; error?: string };
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      respuesta = await res.json();
      if (!res.ok) {
        return {
          error: {
            status: res.status,
            data: respuesta.error ?? "El scraper falló.",
          },
        };
      }
    } catch (e) {
      return {
        error: {
          status: 599,
          data: `No se pudo contactar el scraper: ${String(e)}`,
        },
      };
    }

    const entrantes = respuesta.leads ?? [];
    let nuevos = 0;
    let actualizados = 0;
    const inicio = Date.now();

    for (const entrante of entrantes) {
      const index = leads.findIndex(
        (l) =>
          l.nombre.toLowerCase() === entrante.nombre.toLowerCase() &&
          l.ciudad === entrante.ciudad,
      );
      if (index >= 0) {
        leads[index] = {
          ...leads[index],
          rating: entrante.rating,
          numResenas: entrante.numResenas,
          problema: entrante.problema,
          confianzaIA: entrante.confianzaIA,
          reviewsNegativas: entrante.reviewsNegativas,
          draft: entrante.draft,
          actualizado: true,
          ultimoEscaneo: entrante.ultimoEscaneo,
        };
        actualizados += 1;
      } else {
        leads = [{ ...entrante, estado: "nuevo", vendedor: null }, ...leads];
        nuevos += 1;
      }
    }

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
      duracionSeg: Math.round((Date.now() - inicio) / 1000),
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

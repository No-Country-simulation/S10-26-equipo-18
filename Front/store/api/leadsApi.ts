import {
  createApi,
  fetchBaseQuery,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { mockBaseQuery } from "./mockBaseQuery";
import { aplicarFiltros } from "@/lib/mock/dataset";
import type {
  DashboardStats,
  FiltrosResponse,
  Lead,
  LeadListResponse,
  LeadQuery,
  ReanalyzeResponse,
  Scan,
  ScanRequest,
  ScanResult,
  ScanStartResponse,
} from "@/lib/types";
import { mapApiLeadToLead, mapApiLeadsToLeads, type ApiLead } from "@/lib/mappers/leads";
import { mapApiScan, mapApiScans, type ApiScan } from "@/lib/mappers/scans";
import { mapApiDashboard } from "@/lib/mappers/dashboard";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const USING_BACKEND = Boolean(API_URL);

const API_BASE = API_URL ? `${API_URL.replace(/\/+$/, "")}/api` : "";
const SCAN_POLL_MS = 2500;
const SCAN_TIMEOUT_MS = 6 * 60 * 1000;

const realBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE || "/api",
});

const activeBaseQuery = USING_BACKEND ? realBaseQuery : mockBaseQuery;

type QueryError = { error: FetchBaseQueryError };

function customError(message: string): QueryError {
  return { error: { status: "CUSTOM_ERROR", error: message } };
}

function esperar(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function respuestaError(res: Response): Promise<QueryError["error"]> {
  let data: unknown = res.statusText;
  try {
    data = await res.json();
  } catch {
    /* el cuerpo no era JSON */
  }
  return { status: res.status, data };
}

/** Lee el mensaje de error de FastAPI (`detail`) o de RTK Query. */
export function mensajeDeError(error: unknown): string {
  const datos = (error as { data?: unknown })?.data;
  if (typeof datos === "string") return datos;
  if (datos && typeof datos === "object") {
    const detalle = (datos as { detail?: unknown; error?: unknown }).detail ??
      (datos as { error?: unknown }).error;
    if (typeof detalle === "string") return detalle;
    if (Array.isArray(detalle)) {
      return detalle
        .map((item) =>
          typeof item === "object" && item && "msg" in item
            ? String((item as { msg: unknown }).msg)
            : String(item),
        )
        .join(" · ");
    }
  }
  const mensaje = (error as { error?: unknown })?.error;
  if (typeof mensaje === "string") return mensaje;
  return "El escaneo falló. Reintentá en unos segundos.";
}

/**
 * Flujo asíncrono del backend:
 * POST /api/scans → 202 { id, estado: "en_progreso" } y luego polling a
 * GET /api/scans/{id} hasta un estado terminal.
 */
async function ejecutarEscaneoReal(
  body: ScanRequest,
  signal: AbortSignal,
): Promise<{ data: ScanResult } | QueryError> {
  const payload = {
    ciudad: body.ciudad.trim(),
    rubro: body.rubro.trim(),
    max_resultados: Math.min(5, Math.max(1, body.maxResultados ?? 2)),
    rating_min: body.ratingMin ?? 1.5,
    rating_max: body.ratingMax,
    resenas_min: Math.max(0, Math.floor(body.resenasMin)),
  };

  try {
    const post = await fetch(`${API_BASE}/scans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });

    if (!post.ok) return { error: await respuestaError(post) };

    const inicio = (await post.json()) as ScanStartResponse;
    const limite = Date.now() + SCAN_TIMEOUT_MS;
    let scan: Scan | null = null;

    while (!scan || scan.estado === "en_progreso") {
      if (Date.now() > limite) {
        return customError(
          "El escaneo superó el tiempo máximo de espera (6 minutos).",
        );
      }

      const get = await fetch(`${API_BASE}/scans/${inicio.id}`, {
        signal,
        cache: "no-store",
      });
      if (!get.ok) return { error: await respuestaError(get) };

      scan = mapApiScan((await get.json()) as ApiScan);

      if (scan.estado === "en_progreso") {
        await esperar(SCAN_POLL_MS, signal);
      }
    }

    if (scan.estado === "fallido") {
      return customError(
        "El escaneo terminó con estado fallido. Revisá los logs del backend.",
      );
    }

    return {
      data: {
        scan,
        nuevos: scan.nuevos,
        actualizados: scan.actualizados,
        total: scan.total,
      },
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return customError("Escaneo cancelado.");
    }
    return customError(
      error instanceof Error
        ? error.message
        : "No se pudo contactar el backend.",
    );
  }
}

export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery: activeBaseQuery,
  tagTypes: ["Leads", "Lead", "Dashboard", "Scans", "Filtros"],
  endpoints: (builder) => ({
    getLeads: builder.query<LeadListResponse, LeadQuery | void>({
      query: (params) => {
        if (!USING_BACKEND) {
          return { url: "leads", params: params ?? {} };
        }
        // El backend solo filtra por ciudad, rubro y estado.
        const query: Record<string, string> = {};
        if (params?.ciudad) query.ciudad = params.ciudad;
        if (params?.rubro) query.rubro = params.rubro;
        if (params?.estado) query.estado = params.estado;
        return { url: "leads/", params: query };
      },
      transformResponse: (
        response: unknown,
        _meta: unknown,
        arg: LeadQuery | void,
      ) => {
        if (!USING_BACKEND) return response as LeadListResponse;

        const crudos: ApiLead[] = Array.isArray(response)
          ? (response as ApiLead[])
          : Array.isArray((response as { value?: unknown })?.value)
            ? ((response as { value: ApiLead[] }).value)
            : [];

        // Filtros que el backend no soporta (search, problema, severidad,
        // canal, orden) se aplican del lado del cliente.
        const items = aplicarFiltros(
          mapApiLeadsToLeads(crudos),
          (arg ?? {}) as LeadQuery,
        );

        return {
          items,
          total: items.length,
          nuevos: items.filter((lead) => lead.estado === "nuevo").length,
          criticos: items.filter((lead) => lead.rating <= 2.0).length,
        } satisfies LeadListResponse;
      },
      providesTags: ["Leads"],
    }),

    getLead: builder.query<Lead, string>({
      query: (id) => `leads/${id}`,
      transformResponse: (response: unknown) => {
        if (!USING_BACKEND) return response as Lead;
        return mapApiLeadToLead(response as ApiLead);
      },
      providesTags: (_result, _error, id) => [{ type: "Lead", id }],
    }),

    getFiltros: builder.query<FiltrosResponse, void>({
      async queryFn(_arg, api, extraOptions) {
        if (!USING_BACKEND) {
          return { data: { ciudades: [], rubros: [] } };
        }
        const resultado = await realBaseQuery(
          { url: "leads/filtros", method: "GET" },
          api,
          extraOptions,
        );
        if (resultado.error) return { error: resultado.error };
        const datos = (resultado.data ?? {}) as Partial<FiltrosResponse>;
        return {
          data: {
            ciudades: datos.ciudades ?? [],
            rubros: datos.rubros ?? [],
          },
        };
      },
      providesTags: ["Filtros"],
    }),

    getDashboard: builder.query<DashboardStats, void>({
      async queryFn(_arg, api, extraOptions) {
        if (!USING_BACKEND) {
          const mock = await mockBaseQuery(
            { url: "dashboard", method: "GET" },
            api,
            extraOptions,
          );
          if (mock.error) return { error: mock.error };
          return { data: mock.data as DashboardStats };
        }
        const resultado = await realBaseQuery(
          { url: "dashboard", method: "GET" },
          api,
          extraOptions,
        );
        if (resultado.error) return { error: resultado.error };
        return { data: mapApiDashboard(resultado.data) };
      },
      providesTags: ["Dashboard"],
    }),

    getScans: builder.query<Scan[], void>({
      async queryFn(_arg, api, extraOptions) {
        if (!USING_BACKEND) {
          const mock = await mockBaseQuery(
            { url: "scans", method: "GET" },
            api,
            extraOptions,
          );
          if (mock.error) return { error: mock.error };
          return { data: mock.data as Scan[] };
        }
        const resultado = await realBaseQuery(
          { url: "scans", method: "GET" },
          api,
          extraOptions,
        );
        if (resultado.error) return { error: resultado.error };
        const datos = Array.isArray(resultado.data)
          ? (resultado.data as ApiScan[])
          : [];
        return { data: mapApiScans(datos) };
      },
      providesTags: ["Scans"],
    }),

    updateLead: builder.mutation<Lead, { id: string; cambios: Partial<Lead> }>({
      query: ({ id, cambios }) => ({
        url: `leads/${id}`,
        method: "PATCH",
        body: cambios.estado ? { estado: cambios.estado } : cambios,
      }),
      transformResponse: (response: unknown) => {
        if (!USING_BACKEND) return response as Lead;
        return mapApiLeadToLead(response as ApiLead);
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Lead", id },
        "Leads",
        "Dashboard",
      ],
    }),

    createScan: builder.mutation<ScanResult, ScanRequest>({
      async queryFn(body, api, extraOptions) {
        if (!USING_BACKEND) {
          const mock = await mockBaseQuery(
            { url: "scans", method: "POST", body },
            api,
            extraOptions,
          );
          if (mock.error) return { error: mock.error };
          return { data: mock.data as ScanResult };
        }
        return ejecutarEscaneoReal(body, api.signal);
      },
      invalidatesTags: ["Scans", "Dashboard", "Leads", "Filtros"],
    }),

    reanalyzeLead: builder.mutation<ReanalyzeResponse, string>({
      query: (id) => ({ url: `leads/${id}/reanalyze`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Lead", id },
        "Leads",
        "Dashboard",
      ],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadQuery,
  useGetFiltrosQuery,
  useGetDashboardQuery,
  useGetScansQuery,
  useUpdateLeadMutation,
  useCreateScanMutation,
  useReanalyzeLeadMutation,
} = leadsApi;

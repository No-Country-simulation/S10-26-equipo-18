import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { mockBaseQuery } from "./mockBaseQuery";
import type {
  DashboardStats,
  Lead,
  LeadListResponse,
  LeadQuery,
  Scan,
  ScanRequest,
  ScanResult,
} from "@/lib/types";
import { mapApiLeadToLead, mapApiLeadsToLeads } from "@/lib/mappers/leads";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const realBaseQuery = fetchBaseQuery({
  baseUrl: API_URL ? `${API_URL}/api` : "/api",
});

// Para /leads usamos backend real si está configurado
const leadsBaseQuery = API_URL ? realBaseQuery : mockBaseQuery;
// Para dashboard/scans/createScan seguimos usando mock para no romper el flujo actual
const mockOnlyBaseQuery = mockBaseQuery;

export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery: leadsBaseQuery,
  tagTypes: ["Leads", "Lead", "Dashboard", "Scans", "Filtros"],
  endpoints: (builder) => ({
    getLeads: builder.query<LeadListResponse, LeadQuery | void>({
      query: (params) => {
        console.log("[API] getLeads called with params:", params, "API_URL:", API_URL);
        if (!API_URL) {
          return { url: "leads", params: params ?? {} };
        }
        const query: Record<string, string> = {};
        if (params) {
          if (params.ciudad) query.ciudad = params.ciudad;
          if (params.rubro) query.rubro = params.rubro;
          if (params.estado) query.estado = params.estado;
        }
        return { url: "leads/", params: query };
      },
      transformResponse: (response: unknown) => {
        console.log("[API] getLeads raw response:", response);
        if (!API_URL) {
          return response as LeadListResponse;
        }
        if (Array.isArray(response)) {
          const items = mapApiLeadsToLeads(response as any[]);
          console.log("[API] getLeads mapped items:", items);
          return {
            items,
            total: items.length,
            nuevos: items.filter((l) => l.estado === "nuevo").length,
            criticos: items.filter((l) => l.rating <= 2.0).length,
          } as LeadListResponse;
        }
        const resp = response as any;
        if (resp?.value && Array.isArray(resp.value)) {
          const items = mapApiLeadsToLeads(resp.value);
          return {
            items,
            total: resp.Count ?? items.length,
            nuevos: items.filter((l) => l.estado === "nuevo").length,
            criticos: items.filter((l) => l.rating <= 2.0).length,
          } as LeadListResponse;
        }
        return response as LeadListResponse;
      },
      providesTags: ["Leads"],
    }),
    getLead: builder.query<Lead, string>({
      query: (id) => {
        console.log("[API] getLead called with id:", id, "API_URL:", API_URL);
        return !API_URL ? `leads/${id}` : `leads/${id}`;
      },
      transformResponse: (response: unknown) => {
        console.log("[API] getLead raw response:", response);
        if (!API_URL) return response as Lead;
        return mapApiLeadToLead(response as any);
      },
      providesTags: (_result, _error, id) => [{ type: "Lead", id }],
    }),
    getFiltros: builder.query<{ ciudades: string[]; rubros: string[] }, void>({
      query: () => {
        console.log("[API] getFiltros called, API_URL:", API_URL);
        return !API_URL ? "leads/filtros-mock" : "leads/filtros";
      },
      transformResponse: (response: unknown) => {
        console.log("[API] getFiltros raw response:", response);
        return response as { ciudades: string[]; rubros: string[] };
      },
      providesTags: ["Filtros"],
    }),
    getDashboard: builder.query<DashboardStats, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQueryFn) => {
        console.log("[API] getDashboard using mockBaseQuery");
        return baseQueryFn({ url: "dashboard", method: "GET" }, _api, _extraOptions);
      },
      providesTags: ["Dashboard"],
    }),
    getScans: builder.query<Scan[], void>({
      queryFn: async (_arg, _api, _extraOptions, baseQueryFn) => {
        console.log("[API] getScans using mockBaseQuery");
        return baseQueryFn({ url: "scans", method: "GET" }, _api, _extraOptions);
      },
      providesTags: ["Scans"],
    }),
    updateLead: builder.mutation<Lead, { id: string; cambios: Partial<Lead> }>({
      query: ({ id, cambios }) => {
        console.log("[API] updateLead called with:", { id, cambios }, "API_URL:", API_URL);
        if (!API_URL) {
          return {
            url: `leads/${id}`,
            method: "PUT",
            body: cambios,
          };
        }
        if (cambios.estado) {
          return {
            url: `leads/${id}`,
            method: "PATCH",
            body: { estado: cambios.estado },
          };
        }
        return {
          url: `leads/${id}`,
          method: "PATCH",
          body: cambios,
        };
      },
      transformResponse: (response: unknown) => {
        console.log("[API] updateLead raw response:", response);
        if (!API_URL) return response as Lead;
        return mapApiLeadToLead(response as any);
      },
      invalidatesTags: ["Leads", "Dashboard"],
    }),
    createScan: builder.mutation<ScanResult, ScanRequest>({
      queryFn: async (body, _api, _extraOptions, baseQueryFn) => {
        console.log("[API] createScan using mockBaseQuery");
        return baseQueryFn({ url: "scans", method: "POST", body }, _api, _extraOptions);
      },
      invalidatesTags: ["Scans", "Dashboard", "Leads"],
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
} = leadsApi;

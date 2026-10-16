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

const baseQuery = process.env.NEXT_PUBLIC_API_URL
  ? fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_URL })
  : mockBaseQuery;

export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery,
  tagTypes: ["Leads", "Lead", "Dashboard", "Scans"],
  endpoints: (builder) => ({
    getLeads: builder.query<LeadListResponse, LeadQuery | void>({
      query: (params) => ({ url: "leads", params: params ?? {} }),
      providesTags: ["Leads"],
    }),
    getLead: builder.query<Lead, string>({
      query: (id) => `leads/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Lead", id }],
    }),
    getDashboard: builder.query<DashboardStats, void>({
      query: () => "dashboard",
      providesTags: ["Dashboard"],
    }),
    getScans: builder.query<Scan[], void>({
      query: () => "scans",
      providesTags: ["Scans"],
    }),
    updateLead: builder.mutation<Lead, { id: string; cambios: Partial<Lead> }>({
      query: ({ id, cambios }) => ({
        url: `leads/${id}`,
        method: "PUT",
        body: cambios,
      }),
      invalidatesTags: ["Leads", "Dashboard"],
    }),
    createScan: builder.mutation<ScanResult, ScanRequest>({
      query: (body) => ({ url: "scans", method: "POST", body }),
      invalidatesTags: ["Scans", "Dashboard", "Leads"],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadQuery,
  useGetDashboardQuery,
  useGetScansQuery,
  useUpdateLeadMutation,
  useCreateScanMutation,
} = leadsApi;

export type Problema =
  | "atencion"
  | "precios"
  | "higiene"
  | "demoras"
  | "calidad"
  | "citas";

export type LeadEstado = "nuevo" | "contactado" | "convertido" | "perdido";

export type Severidad = "critica" | "riesgo" | "vigilancia";

export type Canal = "email" | "telefono" | "web" | "linkedin";

export type ScanEstado = "completado" | "en_progreso" | "fallido";

export interface ReviewNegativa {
  autor: string;
  /** El backend guarda `fecha = null` a propósito: la fecha extraída no es confiable. */
  fecha: string | null;
  texto: string;
  estrellas: number;
}

export interface Draft {
  asunto: string;
  cuerpo: string;
}

export interface Lead {
  id: string;
  nombre: string;
  rubro: string;
  ciudad: string;
  fuente: string;
  rating: number;
  numResenas: number;
  telefono: string | null;
  web: string | null;
  email: string | null;
  linkedin: string | null;
  /** `null` cuando Gemini todavía no clasificó el problema ("sin analizar"). */
  problema: Problema | null;
  confianzaIA: number;
  reviewsNegativas: ReviewNegativa[];
  /** `null` cuando el backend no generó un borrador todavía. */
  draft: Draft | null;
  estado: LeadEstado;
  actualizado: boolean;
  ultimoEscaneo: string | null;
  vendedor: string | null;
}

export interface Scan {
  id: string;
  ciudad: string;
  rubro: string;
  plataformas: string[];
  ratingMin: number;
  ratingMax: number;
  resenasMin: number;
  fecha: string;
  nuevos: number;
  actualizados: number;
  total: number;
  estado: ScanEstado;
  duracionSeg: number | null;
}

export interface Vendedor {
  id: string;
  nombre: string;
  iniciales: string;
  email: string;
  cargo: string;
  color: string;
}

export interface LeadQuery {
  search?: string;
  ciudad?: string;
  rubro?: string;
  problema?: string;
  estado?: string;
  severidad?: string;
  canal?: string;
  sort?: string;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  nuevos: number;
  criticos: number;
}

export interface DashboardStats {
  totalLeads: number;
  nuevos: number;
  criticos: number;
  riesgo: number;
  vigilancia: number;
  conEmail: number;
  conTelefono: number;
  conWeb: number;
  contactosTotales: number;
  tasaAbordaje: number;
  porProblema: { problema: Problema; cantidad: number }[];
  porCiudad: { ciudad: string; cantidad: number }[];
  porRubro: { rubro: string; cantidad: number }[];
  porSeveridad: { severidad: Severidad; cantidad: number }[];
}

export interface FiltrosResponse {
  ciudades: string[];
  rubros: string[];
}

export interface ScanRequest {
  ciudad: string;
  barrio?: string;
  rubro: string;
  plataformas: string[];
  ratingMax: number;
  /** Opcional: el backend usa 1.5 por defecto. */
  ratingMin?: number;
  resenasMin: number;
  /** El backend acepta entre 1 y 10. Por defecto 2. */
  maxResultados?: number;
}

/** Respuesta inmediata (HTTP 202) de `POST /api/scans`. */
export interface ScanStartResponse {
  id: string;
  estado: string;
  mensaje: string;
}

export interface ScanResult {
  scan: Scan;
  nuevos: number;
  actualizados: number;
  total: number;
}

/** Respuesta exitosa de `POST /api/leads/{id}/reanalyze`. */
export interface ReanalyzeResponse {
  estado: string;
  lead_id?: string;
  problema?: Problema | null;
  confianzaIA?: number;
  draft?: Draft | null;
  mensaje?: string;
}

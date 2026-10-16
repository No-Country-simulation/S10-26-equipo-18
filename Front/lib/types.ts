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

export interface ReviewNegativa {
  autor: string;
  fecha: string;
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
  problema: Problema;
  confianzaIA: number;
  reviewsNegativas: ReviewNegativa[];
  draft: Draft;
  estado: LeadEstado;
  actualizado: boolean;
  ultimoEscaneo: string;
  vendedor: string | null;
}

export interface Scan {
  id: string;
  ciudad: string;
  rubro: string;
  plataformas: string[];
  ratingMax: number;
  resenasMin: number;
  fecha: string;
  nuevos: number;
  actualizados: number;
  total: number;
  estado: "completado" | "en_progreso" | "fallido";
  duracionSeg: number;
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

export interface ScanRequest {
  ciudad: string;
  rubro: string;
  plataformas: string[];
  ratingMax: number;
  resenasMin: number;
}

export interface ScanResult {
  scan: Scan;
  nuevos: number;
  actualizados: number;
  total: number;
}

import type { LeadEstado, Problema, Severidad, Vendedor } from "./types";

export interface ProblemaMeta {
  key: Problema;
  label: string;
  short: string;
  color: string;
  chip: string;
}

export const PROBLEMAS: ProblemaMeta[] = [
  {
    key: "atencion",
    label: "Atención al Cliente",
    short: "Mala atención",
    color: "#f43f5e",
    chip: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  },
  {
    key: "precios",
    label: "Precios Altos",
    short: "Precios",
    color: "#f97316",
    chip: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  },
  {
    key: "higiene",
    label: "Problemas de Higiene",
    short: "Higiene",
    color: "#eab308",
    chip: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  },
  {
    key: "demoras",
    label: "Demoras / Lentitud",
    short: "Demoras",
    color: "#0ea5e9",
    chip: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  {
    key: "calidad",
    label: "Calidad Deficiente",
    short: "Calidad",
    color: "#8b5cf6",
    chip: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  {
    key: "citas",
    label: "Caos de Citas / Agenda",
    short: "Citas",
    color: "#14b8a6",
    chip: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  },
];

export const PROBLEMA_MAP: Record<Problema, ProblemaMeta> = PROBLEMAS.reduce(
  (acc, p) => ({ ...acc, [p.key]: p }),
  {} as Record<Problema, ProblemaMeta>,
);

export interface SeveridadMeta {
  key: Severidad;
  label: string;
  color: string;
  chip: string;
}

export const SEVERIDAD_MAP: Record<Severidad, SeveridadMeta> = {
  critica: {
    key: "critica",
    label: "Crítica",
    color: "#f43f5e",
    chip: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  },
  riesgo: {
    key: "riesgo",
    label: "Riesgo",
    color: "#f59e0b",
    chip: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  vigilancia: {
    key: "vigilancia",
    label: "Vigilancia",
    color: "#10b981",
    chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
};

export const ESTADOS: { key: LeadEstado; label: string; chip: string }[] = [
  {
    key: "nuevo",
    label: "Nuevo",
    chip: "bg-teal-500/10 text-teal-300 border-teal-500/30",
  },
  {
    key: "contactado",
    label: "Contactado",
    chip: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  },
  {
    key: "convertido",
    label: "Convertido",
    chip: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  },
  {
    key: "perdido",
    label: "Perdido",
    chip: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  },
];

export const ESTADO_MAP = ESTADOS.reduce(
  (acc, e) => ({ ...acc, [e.key]: e }),
  {} as Record<LeadEstado, (typeof ESTADOS)[number]>,
);

export const CIUDADES = [
  "Buenos Aires",
  "Bogotá",
  "Medellín",
  "Cali",
  "CDMX",
  "Guadalajara",
  "Lima",
  "Santiago",
];

export const RUBROS = [
  "Restaurantes",
  "Clínicas Dentales",
  "Hoteles Boutique",
  "Centros Estéticos",
  "Gimnasios",
  "Veterinarias",
];

export const PLATAFORMAS = ["Google Maps", "TripAdvisor", "Yelp"];

export const VENDEDORES: Vendedor[] = [
  {
    id: "ven-01",
    nombre: "Valeria Ríos",
    iniciales: "VR",
    email: "valeria.rios@repusense.io",
    cargo: "Consultora de reputación",
    color: "#14b8a6",
  },
  {
    id: "ven-02",
    nombre: "Martín Salas",
    iniciales: "MS",
    email: "martin.salas@repusense.io",
    cargo: "Ejecutivo B2B",
    color: "#8b5cf6",
  },
  {
    id: "ven-03",
    nombre: "Camila Duarte",
    iniciales: "CD",
    email: "camila.duarte@repusense.io",
    cargo: "Prospección outbound",
    color: "#0ea5e9",
  },
];

export const CANALES: { key: string; label: string }[] = [
  { key: "email", label: "Con email" },
  { key: "telefono", label: "Con teléfono" },
  { key: "web", label: "Con sitio web" },
  { key: "linkedin", label: "Con LinkedIn" },
];

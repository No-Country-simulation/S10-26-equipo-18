import type { Draft, Lead, LeadEstado, Problema, ReviewNegativa } from "@/lib/types";
import { VENDEDORES } from "@/lib/constants";

/** Contrato real de `GET /api/leads/`, `GET /api/leads/{id}` (snake_case). */
export interface ApiResena {
  autor: string | null;
  fecha: string | null;
  texto: string;
  estrellas: number;
}

export interface ApiLead {
  id: string;
  nombre: string;
  rubro: string;
  ciudad: string;
  fuente: string;
  rating: string | number;
  num_resenas: number;
  telefono: string | null;
  web: string | null;
  email: string | null;
  linkedin: string | null;
  problema_ia: string | null;
  confianza_ia: number | null;
  estado_analisis?: string | null;
  estado: string | null;
  vendedor_id: string | null;
  creado_en?: string | null;
  ultimo_escaneo: string | null;
  draft_asunto?: string | null;
  draft_cuerpo?: string | null;
  resenas?: ApiResena[];
}

const PROBLEMAS_VALIDOS: Problema[] = [
  "atencion",
  "precios",
  "higiene",
  "demoras",
  "calidad",
  "citas",
];

const ESTADOS_VALIDOS: LeadEstado[] = [
  "nuevo",
  "contactado",
  "convertido",
  "perdido",
];

/** El seed del backend usa usuarios demo; el front usa vendedores del mock. */
const VENDEDOR_DEMO: Record<string, string> = {
  "usr-001": "ven-01",
  "usr-002": "ven-02",
  "usr-003": "ven-03",
};

function parseProblema(valor: string | null): Problema | null {
  if (!valor) return null;
  return PROBLEMAS_VALIDOS.includes(valor as Problema)
    ? (valor as Problema)
    : null;
}

function parseRating(valor: string | number): number {
  const numero = typeof valor === "string" ? Number.parseFloat(valor) : valor;
  return Number.isFinite(numero) ? numero : 0;
}

function parseEstado(valor: string | null): LeadEstado {
  return ESTADOS_VALIDOS.includes(valor as LeadEstado)
    ? (valor as LeadEstado)
    : "nuevo";
}

function parseVendedor(vendedorId: string | null): string | null {
  if (!vendedorId) return null;
  if (VENDEDOR_DEMO[vendedorId]) return VENDEDOR_DEMO[vendedorId];
  return VENDEDORES.some((v) => v.id === vendedorId) ? vendedorId : null;
}

function parseDraft(apiLead: ApiLead): Draft | null {
  const asunto = apiLead.draft_asunto?.trim();
  const cuerpo = apiLead.draft_cuerpo?.trim();
  if (!asunto && !cuerpo) return null;
  return { asunto: asunto ?? "", cuerpo: cuerpo ?? "" };
}

function parseResenas(resenas?: ApiResena[]): ReviewNegativa[] {
  if (!Array.isArray(resenas)) return [];
  return resenas
    .filter((resena) => Boolean(resena?.texto?.trim()))
    .map((resena) => ({
      autor: resena.autor?.trim() || "Usuario anónimo",
      fecha: resena.fecha ?? null,
      texto: resena.texto,
      estrellas: resena.estrellas ?? 0,
    }));
}

export function mapApiLeadToLead(apiLead: ApiLead): Lead {
  return {
    id: apiLead.id,
    nombre: apiLead.nombre,
    rubro: apiLead.rubro,
    ciudad: apiLead.ciudad,
    fuente: apiLead.fuente,
    rating: parseRating(apiLead.rating),
    numResenas: apiLead.num_resenas ?? 0,
    telefono: apiLead.telefono,
    web: apiLead.web,
    email: apiLead.email,
    linkedin: apiLead.linkedin,
    problema: parseProblema(apiLead.problema_ia),
    confianzaIA: apiLead.confianza_ia ?? 0,
    reviewsNegativas: parseResenas(apiLead.resenas),
    draft: parseDraft(apiLead),
    estado: parseEstado(apiLead.estado),
    // El backend no expone "actualizado" por lead: no lo inventamos.
    actualizado: false,
    ultimoEscaneo: apiLead.ultimo_escaneo ?? null,
    vendedor: parseVendedor(apiLead.vendedor_id),
  };
}

export function mapApiLeadsToLeads(apiLeads: ApiLead[]): Lead[] {
  return apiLeads.map(mapApiLeadToLead);
}

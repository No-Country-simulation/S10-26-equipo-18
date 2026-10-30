import type { Lead, Problema, ReviewNegativa, Draft } from "@/lib/types";
import { VENDEDORES } from "@/lib/constants";

interface ApiLead {
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
  resenas?: ReviewNegativa[];
  reviewsNegativas?: ReviewNegativa[];
}

const PROBLEMA_MAP: Record<string, Problema> = {
  atencion: "atencion",
  precios: "precios",
  higiene: "higiene",
  demoras: "demoras",
  calidad: "calidad",
  citas: "citas",
};

function getVendedorId(vendedorId: string | null): string | null {
  if (!vendedorId) return null;
  // Mapeo para datos de demo del backend
  if (vendedorId === "usr-001") return "ven-01";
  if (vendedorId === "usr-002") return "ven-02";
  if (vendedorId === "usr-003") return "ven-03";
  const vendedor = VENDEDORES.find((v) => v.id === vendedorId);
  console.log("[MAPPER] getVendedorId:", vendedorId, "found:", vendedor?.nombre);
  return vendedor ? vendedor.id : null;
}

function buildDraft(apiLead: ApiLead): Draft {
  if (apiLead.draft_asunto && apiLead.draft_cuerpo) {
    console.log("[MAPPER] Using draft from backend for", apiLead.id);
    return {
      asunto: apiLead.draft_asunto,
      cuerpo: apiLead.draft_cuerpo,
    };
  }
  console.log("[MAPPER] Using fallback draft for", apiLead.id);
  const asunto = `${apiLead.nombre}: propuesta para recuperar la reputación online`;
  const cuerpo = `Hola, equipo de ${apiLead.nombre}:\n\nRevisando su negocio en ${apiLead.ciudad}, detectamos oportunidades para mejorar su reputación online.\n\nNos gustaría compartirles un diagnóstico sin costo.\n\nSaludos cordiales,\nEquipo RepuSense`;
  return { asunto, cuerpo };
}

export function mapApiLeadToLead(apiLead: ApiLead): Lead {
  console.log("[MAPPER] Mapping lead:", apiLead.id, apiLead);
  const rating = typeof apiLead.rating === "string" 
    ? parseFloat(apiLead.rating) 
    : apiLead.rating;

  const problema = apiLead.problema_ia && PROBLEMA_MAP[apiLead.problema_ia] 
    ? PROBLEMA_MAP[apiLead.problema_ia] 
    : "atencion";

  const reviewsNegativas = apiLead.reviewsNegativas || apiLead.resenas || [];
  console.log("[MAPPER] reviewsNegativas count:", reviewsNegativas.length);

  const mapped = {
    id: apiLead.id,
    nombre: apiLead.nombre,
    rubro: apiLead.rubro,
    ciudad: apiLead.ciudad,
    fuente: apiLead.fuente,
    rating: isNaN(rating) ? 0 : rating,
    numResenas: apiLead.num_resenas || 0,
    telefono: apiLead.telefono,
    web: apiLead.web,
    email: apiLead.email,
    linkedin: apiLead.linkedin,
    problema,
    confianzaIA: apiLead.confianza_ia || 0,
    reviewsNegativas,
    draft: buildDraft(apiLead),
    estado: (apiLead.estado as Lead["estado"]) || "nuevo",
    actualizado: apiLead.estado !== "nuevo" && apiLead.estado !== null,
    ultimoEscaneo: apiLead.ultimo_escaneo || new Date().toISOString(),
    vendedor: getVendedorId(apiLead.vendedor_id),
  };
  console.log("[MAPPER] Mapped lead:", mapped);
  return mapped;
}

export function mapApiLeadsToLeads(apiLeads: ApiLead[]): Lead[] {
  console.log("[MAPPER] Mapping leads array, count:", apiLeads.length);
  return apiLeads.map(mapApiLeadToLead);
}

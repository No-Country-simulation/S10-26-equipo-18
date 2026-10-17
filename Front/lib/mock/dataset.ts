import type {
  DashboardStats,
  Draft,
  Lead,
  LeadEstado,
  LeadListResponse,
  Problema,
  Scan,
  Severidad,
} from "../types";
import { CIUDADES, PROBLEMAS, RUBROS } from "../constants";
import { clasificarSeveridad } from "../format";
import rawGenerado from "./leads.generated.json";

const REVIEW_TEXTOS: Record<Problema, string> = {
  atencion:
    "El recepcionista nos atendió con desprecio y tardaron más de una hora.",
  precios:
    "Me cobraron un recargo excesivo no informado en ningún lado. Malísima experiencia.",
  higiene: "Los baños estaban clausurados y todo el lugar con muy mal olor.",
  demoras: "Tardaron 45 minutos después del turno asignado. Nadie se disculpó.",
  calidad:
    "La calidad no se parece en nada a lo que muestran en sus redes sociales.",
  citas:
    "Imposible sacar turno: por WhatsApp te clavan el visto y por teléfono te cortan.",
};

const SITUACION: Record<Problema, string> = {
  higiene:
    "se registran menciones críticas sobre la limpieza del establecimiento, el factor #1 que detiene a clientes nuevos antes de visitarlos",
  citas:
    "los clientes experimentan dificultades constantes para coordinar, agendar o respetar sus citas",
  atencion:
    "varias opiniones recientes señalan inconformidades con la atención al cliente, lo cual impacta directamente en las recomendaciones públicas",
  precios:
    "aparecen quejas recurrentes sobre la relación precio-calidad y cobros percibidos como excesivos",
  demoras:
    "se repiten comentarios sobre demoras prolongadas en la atención",
  calidad:
    "señalan inconsistencias en la calidad del servicio o del producto final",
};

const RUBRO_SINGULAR: Record<string, string> = {
  Restaurantes: "Restaurante",
  "Clínicas Dentales": "Clínica Dental",
  "Hoteles Boutique": "Hotel Boutique",
  "Centros Estéticos": "Centro Estético",
  Gimnasios: "Gimnasio",
  Veterinarias: "Veterinaria",
};

const NOMBRE_TEMPLATES = [
  "{S} Central {Ciudad}",
  "Grupo Profesional {S}",
  "{S} Plaza Mayor",
  "{S} del Norte",
  "{S} Premier {Ciudad}",
  "Servicios Integrales {S}",
  "Centro {S} El Roble",
  "{S} Tradicional {Ciudad}",
  "Especialistas en {S}",
  "{S} & Asociados {Ciudad}",
  "{S} San José",
  "{S} Los Andes",
  "{S} La Estación",
  "{S} Horizonte",
];

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function slug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 28);
}

function buildDraft(lead: {
  nombre: string;
  rubro: string;
  ciudad: string;
  rating: number;
  problema: Problema;
}): Draft {
  const rubroLower = lead.rubro.toLowerCase();
  const asuntos = [
    `${lead.nombre}: propuesta para recuperar la reputación online en ${lead.ciudad}`,
    `Diagnóstico de reputación para ${lead.nombre} (${lead.ciudad})`,
    `Recuperemos las estrellas de ${lead.nombre}`,
  ];
  const asunto = asuntos[lead.nombre.length % asuntos.length];
  const cuerpo = `Hola, equipo de ${lead.nombre}:\n\nMi nombre es Valeria Ríos y soy consultora en reputación de marcas locales. Revisando los principales negocios de ${rubroLower} en ${lead.ciudad}, detectamos que hoy cuentan con una calificación promedio de ${lead.rating.toFixed(
    1,
  )}★ y que ${SITUACION[lead.problema]}.\n\nEn RepuSense trabajamos directamente con dueños y gerentes para revertir malas rachas, gestionar profesionalmente las quejas públicas y volver a captar clientes que hoy eligen a la competencia.\n\n¿Tendrían 10 minutos esta semana para una llamada breve? Les compartiré un informe diagnóstico sin costo.\n\nSaludos cordiales,\nValeria Ríos — Equipo RepuSense`;
  return { asunto, cuerpo };
}

function buildReviews(
  problema: Problema,
  count: number,
  fecha: string,
  rng: () => number,
) {
  const otros = PROBLEMAS.map((p) => p.key).filter((p) => p !== problema);
  return Array.from({ length: count }, (_, i) => {
    const usarOtro = i > 0 && rng() > 0.6;
    const cat = usarOtro ? pick(rng, otros) : problema;
    return {
      autor: `Usuario Anónimo ${i + 1}`,
      fecha,
      texto: REVIEW_TEXTOS[cat],
      estrellas: rng() > 0.55 ? 1 : 2,
    };
  });
}

interface SeedLead {
  id: string;
  nombre: string;
  rubro: string;
  ciudad: string;
  rating: number;
  numResenas: number;
  telefono: string | null;
  web: string | null;
  email: string | null;
  linkedin: string | null;
  problema: Problema;
  confianzaIA: number;
  fuente: string;
}

const SEED: SeedLead[] = [
  { id: "lead-bue-001", nombre: "Restaurantes Tradicional Buenos Aires", rubro: "Restaurantes", ciudad: "Buenos Aires", rating: 2.8, numResenas: 285, telefono: "+54 11 547 2131", web: null, email: null, linkedin: null, problema: "higiene", confianzaIA: 85, fuente: "Google Maps" },
  { id: "lead-bue-002", nombre: "Restaurantes San José", rubro: "Restaurantes", ciudad: "Buenos Aires", rating: 2.2, numResenas: 21, telefono: "+54 11 575 3074", web: null, email: null, linkedin: null, problema: "higiene", confianzaIA: 85, fuente: "Google Maps" },
  { id: "lead-bue-003", nombre: "Centro de Restaurantes El Roble", rubro: "Restaurantes", ciudad: "Buenos Aires", rating: 2.4, numResenas: 309, telefono: "+54 11 591 3568", web: "https://www.centroderestauranteselroble.com", email: "contacto@centroderestauranteselroble.com", linkedin: null, problema: "citas", confianzaIA: 85, fuente: "Google Maps" },
  { id: "lead-bue-004", nombre: "Restaurantes & Asociados Buenos Aires", rubro: "Restaurantes", ciudad: "Buenos Aires", rating: 2.2, numResenas: 223, telefono: "+54 11 517 3069", web: "https://www.restaurantesasociadosbuenosaires.com", email: null, linkedin: "https://linkedin.com/company/restaurantesasociadosbuenosaires", problema: "atencion", confianzaIA: 80, fuente: "Google Maps" },
  { id: "lead-bue-005", nombre: "Especialistas en Restaurantes del Norte", rubro: "Restaurantes", ciudad: "Buenos Aires", rating: 2.5, numResenas: 295, telefono: "+54 11 411 6979", web: "https://www.especialistasenrestaurantesdelnorte.com", email: "contacto@especialistasenrestaurantesdelnorte.com", linkedin: "https://linkedin.com/company/especialistasenrestaurantesdelnorte", problema: "higiene", confianzaIA: 85, fuente: "Google Maps" },
  { id: "lead-bue-006", nombre: "Restaurantes Los Andes", rubro: "Restaurantes", ciudad: "Buenos Aires", rating: 2.0, numResenas: 144, telefono: "+54 11 492 2255", web: "https://www.restauranteslosandes.com", email: "contacto@restauranteslosandes.com", linkedin: null, problema: "higiene", confianzaIA: 85, fuente: "Google Maps" },
  { id: "lead-bue-007", nombre: "Grupo Profesional Restaurantes", rubro: "Restaurantes", ciudad: "Buenos Aires", rating: 2.1, numResenas: 206, telefono: "+54 11 410 2289", web: "https://www.grupoprofesionalrestaurantes.com", email: null, linkedin: null, problema: "higiene", confianzaIA: 85, fuente: "Google Maps" },
  { id: "lead-bue-008", nombre: "Restaurantes Plaza Mayor", rubro: "Restaurantes", ciudad: "Buenos Aires", rating: 2.6, numResenas: 234, telefono: "+54 11 492 6999", web: "https://www.restaurantesplazamayor.com", email: "contacto@restaurantesplazamayor.com", linkedin: "https://linkedin.com/company/restaurantesplazamayor", problema: "citas", confianzaIA: 85, fuente: "Google Maps" },
  { id: "lead-bue-009", nombre: "Restaurantes Premier Buenos Aires", rubro: "Restaurantes", ciudad: "Buenos Aires", rating: 2.8, numResenas: 244, telefono: "+54 11 420 1490", web: "https://www.restaurantespremierbuenosaires.com", email: "contacto@restaurantespremierbuenosaires.com", linkedin: "https://linkedin.com/company/restaurantespremierbuenosaires", problema: "higiene", confianzaIA: 85, fuente: "Google Maps" },
  { id: "lead-bue-010", nombre: "Servicios Integrales Restaurantes", rubro: "Restaurantes", ciudad: "Buenos Aires", rating: 3.1, numResenas: 71, telefono: "+54 11 500 9198", web: "https://www.serviciosintegralesrestaurantes.com", email: "contacto@serviciosintegralesrestaurantes.com", linkedin: null, problema: "higiene", confianzaIA: 85, fuente: "Google Maps" },
];

const ESTADOS_CYCLE = [
  "nuevo",
  "nuevo",
  "nuevo",
  "contactado",
  "nuevo",
  "nuevo",
  "contactado",
  "convertido",
  "nuevo",
  "perdido",
] as const;

const VENDEDORES_IDS = ["ven-01", "ven-02", "ven-03"];

function generarLeads(): Lead[] {
  const rng = makeRng(20261016);
  const leads: Lead[] = [];
  const total = 214;

  const seedLeads: Lead[] = SEED.map((s, i) => {
    const fecha = "2026-10-16";
    return {
      ...s,
      estado: i % 7 === 0 ? "contactado" : "nuevo",
      actualizado: false,
      ultimoEscaneo: fecha,
      vendedor: i % 7 === 0 ? VENDEDORES_IDS[i % VENDEDORES_IDS.length] : null,
      reviewsNegativas: buildReviews(s.problema, 3 + (i % 2), fecha, rng),
      draft: buildDraft(s),
    };
  });
  leads.push(...seedLeads);

  const ciudades = CIUDADES;
  const rubros = RUBROS;
  let n = 0;
  while (leads.length < total) {
    const ciudad = ciudades[n % ciudades.length];
    const rubro = rubros[Math.floor(n / ciudades.length) % rubros.length];
    const singular = RUBRO_SINGULAR[rubro] ?? rubro;
    const template = NOMBRE_TEMPLATES[n % NOMBRE_TEMPLATES.length];
    const nombre = template
      .replace("{S}", singular)
      .replace("{Ciudad}", ciudad);

    const rating = Math.round((1.8 + rng() * 1.6) * 10) / 10;
    const numResenas = 10 + Math.floor(rng() * 320);
    const problema = pick(rng, PROBLEMAS).key;
    const confianzaIA = 78 + Math.floor(rng() * 15);
    const tieneWeb = rng() > 0.45;
    const dominio = slug(nombre);
    const web = tieneWeb ? `https://www.${dominio}.com` : null;
    const email = tieneWeb && rng() > 0.35 ? `contacto@${dominio}.com` : null;
    const telefono = rng() > 0.15 ? `+54 11 ${100 + Math.floor(rng() * 899)} ${1000 + Math.floor(rng() * 8999)}` : null;
    const linkedin = rng() > 0.65 ? `https://linkedin.com/company/${dominio}` : null;
    const fuente = rng() > 0.8 ? (rng() > 0.5 ? "TripAdvisor" : "Yelp") : "Google Maps";
    const estadoIdx = Math.floor(rng() * ESTADOS_CYCLE.length);
    const estado = ESTADOS_CYCLE[estadoIdx];
    const dias = Math.floor(rng() * 28);
    const fecha = new Date(Date.UTC(2026, 9, 16 - dias))
      .toISOString()
      .slice(0, 10);

    leads.push({
      id: `lead-gen-${String(n + 1).padStart(3, "0")}`,
      nombre,
      rubro,
      ciudad,
      fuente,
      rating,
      numResenas,
      telefono,
      web,
      email,
      linkedin,
      problema,
      confianzaIA,
      reviewsNegativas: buildReviews(problema, 3 + Math.floor(rng() * 2), fecha, rng),
      draft: buildDraft({ nombre, rubro, ciudad, rating, problema }),
      estado,
      actualizado: estado !== "nuevo" || rng() > 0.85,
      ultimoEscaneo: fecha,
      vendedor:
        estado === "nuevo" ? null : VENDEDORES_IDS[Math.floor(rng() * VENDEDORES_IDS.length)],
    });
    n++;
  }

  return leads;
}

const GENERADO = rawGenerado as unknown as Lead[];

/**
 * El scraper entrega todos los leads en estado "nuevo" (no gestiona pipeline).
 * Para poder probar la UI completa asignamos, de forma determinista, algunos
 * estados y vendedores. Si el dataset ya trae estados variados, se respeta.
 */
function enriquecerPipeline(leads: Lead[]): Lead[] {
  if (leads.some((l) => l.estado && l.estado !== "nuevo")) return leads;
  const vendedores = ["ven-01", "ven-02", "ven-03"];
  return leads.map((lead, i) => {
    const r = (i * 7) % 10;
    let estado: LeadEstado = "nuevo";
    if (r === 3 || r === 8) estado = "contactado";
    else if (r === 6) estado = "convertido";
    else if (r === 9) estado = "perdido";
    return {
      ...lead,
      estado,
      actualizado: estado !== "nuevo",
      vendedor: estado === "nuevo" ? null : vendedores[i % vendedores.length],
    };
  });
}

/** Deriva el historial de escaneos agrupando los leads del scraper por ciudad + rubro. */
function derivarScans(leads: Lead[]): Scan[] {
  const grupos = new Map<string, Lead[]>();
  for (const lead of leads) {
    const key = `${lead.ciudad}||${lead.rubro}`;
    const lista = grupos.get(key) ?? [];
    lista.push(lead);
    grupos.set(key, lista);
  }
  return [...grupos.entries()].map(([key, lista], i) => {
    const [ciudad, rubro] = key.split("||");
    const plataformas = [...new Set(lista.map((l) => l.fuente))];
    const fecha = lista
      .map((l) => l.ultimoEscaneo)
      .sort()
      .at(-1);
    return {
      id: `scan-${String(i + 1).padStart(3, "0")}`,
      ciudad,
      rubro,
      plataformas,
      ratingMax: 3.5,
      resenasMin: 10,
      fecha: fecha ? `${fecha}T09:00:00` : new Date().toISOString(),
      nuevos: lista.length,
      actualizados: 0,
      total: lista.length,
      estado: "completado" as const,
      duracionSeg: 60 + lista.length * 9,
    };
  });
}

const SCRAPED: Lead[] = enriquecerPipeline(GENERADO);

/**
 * Fuente de datos de la app:
 * 1) Si existe el JSON generado por el scraper (npm run scrape), se usa ese.
 * 2) Si no, se cae al dataset sintético de respaldo.
 */
export const LEADS: Lead[] = SCRAPED.length > 0 ? SCRAPED : generarLeads();

export const SCANS: Scan[] = derivarScans(LEADS);

export function aplicarFiltros(leads: Lead[], query: {
  search?: string;
  ciudad?: string;
  rubro?: string;
  problema?: string;
  estado?: string;
  severidad?: string;
  canal?: string;
  sort?: string;
}): Lead[] {
  let resultado = [...leads];
  const q = query.search?.trim().toLowerCase();
  if (q) {
    resultado = resultado.filter(
      (l) =>
        l.nombre.toLowerCase().includes(q) ||
        l.ciudad.toLowerCase().includes(q) ||
        l.rubro.toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q),
    );
  }
  if (query.ciudad) resultado = resultado.filter((l) => l.ciudad === query.ciudad);
  if (query.rubro) resultado = resultado.filter((l) => l.rubro === query.rubro);
  if (query.problema) resultado = resultado.filter((l) => l.problema === query.problema);
  if (query.estado) resultado = resultado.filter((l) => l.estado === query.estado);
  if (query.severidad)
    resultado = resultado.filter(
      (l) => clasificarSeveridad(l.rating) === query.severidad,
    );
  if (query.canal) {
    const canal = query.canal;
    resultado = resultado.filter((l) => {
      if (canal === "email") return Boolean(l.email);
      if (canal === "telefono") return Boolean(l.telefono);
      if (canal === "web") return Boolean(l.web);
      if (canal === "linkedin") return Boolean(l.linkedin);
      return true;
    });
  }

  const sort = query.sort ?? "rating-asc";
  resultado.sort((a, b) => {
    switch (sort) {
      case "rating-desc":
        return b.rating - a.rating;
      case "resenas-desc":
        return b.numResenas - a.numResenas;
      case "nombre":
        return a.nombre.localeCompare(b.nombre);
      case "confianza":
        return b.confianzaIA - a.confianzaIA;
      default:
        return a.rating - b.rating;
    }
  });
  return resultado;
}

export function construirListado(
  leads: Lead[],
  query: Parameters<typeof aplicarFiltros>[1],
): LeadListResponse {
  const items = aplicarFiltros(leads, query);
  return {
    items,
    total: items.length,
    nuevos: items.filter((l) => l.estado === "nuevo").length,
    criticos: items.filter((l) => clasificarSeveridad(l.rating) === "critica")
      .length,
  };
}

export function calcularStats(leads: Lead[]): DashboardStats {
  const severidad = { critica: 0, riesgo: 0, vigilancia: 0 };
  let conEmail = 0;
  let conTelefono = 0;
  let conWeb = 0;

  for (const l of leads) {
    severidad[clasificarSeveridad(l.rating)]++;
    if (l.email) conEmail++;
    if (l.telefono) conTelefono++;
    if (l.web) conWeb++;
  }

  const contar = (key: keyof Lead) => {
    const map = new Map<string, number>();
    for (const l of leads) {
      const valor = String(l[key]);
      map.set(valor, (map.get(valor) ?? 0) + 1);
    }
    return map;
  };

  const porProblema = contar("problema");
  const porCiudad = contar("ciudad");
  const porRubro = contar("rubro");

  const nuevos = leads.filter((l) => l.estado === "nuevo").length;
  const abordados = leads.filter((l) => l.estado !== "nuevo").length;
  const contactosTotales = leads.filter((l) => l.email || l.telefono).length;

  return {
    totalLeads: leads.length,
    nuevos,
    criticos: severidad.critica,
    riesgo: severidad.riesgo,
    vigilancia: severidad.vigilancia,
    conEmail,
    conTelefono,
    conWeb,
    contactosTotales,
    tasaAbordaje: Math.round((abordados / leads.length) * 100),
    porProblema: PROBLEMAS.map((p) => ({
      problema: p.key,
      cantidad: porProblema.get(p.key) ?? 0,
    })).sort((a, b) => b.cantidad - a.cantidad),
    porCiudad: [...porCiudad.entries()]
      .map(([ciudad, cantidad]) => ({ ciudad, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad),
    porRubro: [...porRubro.entries()]
      .map(([rubro, cantidad]) => ({ rubro, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad),
    porSeveridad: (Object.keys(severidad) as Severidad[]).map((s) => ({
      severidad: s,
      cantidad: severidad[s],
    })),
  };
}

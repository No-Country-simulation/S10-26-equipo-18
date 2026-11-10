import {
  CANALES,
  ESTADO_MAP,
  PROBLEMA_MAP,
  SEVERIDAD_MAP,
  VENDEDORES,
} from "./constants";
import { clasificarSeveridad } from "./format";
import type {
  Lead,
  LeadEstado,
  LeadQuery,
  Problema,
  Severidad,
} from "./types";

/**
 * CSV pensado para abrirse en Excel en español: separador `;`, decimales con
 * coma, BOM UTF-8 y encabezado/sumario tipo reporte.
 */
const DELIMITADOR = ";";
const MAX_QUEJA = 180;

const COLUMNAS = [
  "N°",
  "Negocio",
  "Rubro",
  "Ciudad",
  "Fuente",
  "Calificación",
  "Reseñas",
  "Severidad",
  "Problema detectado",
  "Confianza IA (%)",
  "Teléfono",
  "Email",
  "Sitio web",
  "LinkedIn",
  "Estado",
  "Vendedor",
  "Último escaneo",
  "Reseñas negativas",
  "Queja destacada",
] as const;

const ORDEN_LABELS: Record<string, string> = {
  "rating-asc": "Prioridad: peor calificación",
  "rating-desc": "Mejor calificación",
  "resenas-desc": "Más reseñas",
  confianza: "Mayor confianza IA",
  nombre: "Nombre (A-Z)",
};

export interface OpcionesCsv {
  /** Nombre del archivo. Por defecto `repusense-leads-AAAA-MM-DD.csv`. */
  nombre?: string;
  /** Filtros activos en la pantalla al momento de exportar. */
  filtros?: LeadQuery;
  /** Fecha de generación (útil en pruebas). */
  generadoEn?: Date;
}

function celda(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor).replace(/\s+/g, " ").trim();
  if (texto.includes(DELIMITADOR) || texto.includes('"')) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function fila(
  valores: ReadonlyArray<string | number | null | undefined>,
): string {
  return valores.map(celda).join(DELIMITADOR);
}

function numero(valor: number, decimales = 0): string {
  return valor.toFixed(decimales).replace(".", ",");
}

function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "Sin fecha";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fechaHora(d: Date): string {
  const fecha = d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${fecha} ${hora}`;
}

function fechaArchivo(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function problemaLabel(lead: Lead): string {
  if (!lead.problema) return "Sin analizar";
  return PROBLEMA_MAP[lead.problema]?.label ?? "Sin analizar";
}

function vendedorLabel(lead: Lead): string {
  if (!lead.vendedor) return "";
  return (
    VENDEDORES.find((v) => v.id === lead.vendedor)?.nombre ?? lead.vendedor
  );
}

function quejaDestacada(lead: Lead): string {
  const texto = lead.reviewsNegativas[0]?.texto;
  if (!texto) return "";
  const limpia = texto.replace(/\s+/g, " ").trim();
  return limpia.length > MAX_QUEJA
    ? `${limpia.slice(0, MAX_QUEJA - 1).trimEnd()}…`
    : limpia;
}

function describirFiltros(filtros?: LeadQuery): string {
  if (!filtros) return "Sin filtros";

  const partes: string[] = [];
  if (filtros.search) partes.push(`Búsqueda: ${filtros.search}`);
  if (filtros.ciudad) partes.push(`Ciudad: ${filtros.ciudad}`);
  if (filtros.rubro) partes.push(`Rubro: ${filtros.rubro}`);
  if (filtros.problema) {
    const label =
      PROBLEMA_MAP[filtros.problema as Problema]?.label ?? filtros.problema;
    partes.push(`Problema: ${label}`);
  }
  if (filtros.severidad) {
    const label =
      SEVERIDAD_MAP[filtros.severidad as Severidad]?.label ?? filtros.severidad;
    partes.push(`Severidad: ${label}`);
  }
  if (filtros.estado) {
    const label =
      ESTADO_MAP[filtros.estado as LeadEstado]?.label ?? filtros.estado;
    partes.push(`Estado: ${label}`);
  }
  if (filtros.canal) {
    const label =
      CANALES.find((c) => c.key === filtros.canal)?.label ?? filtros.canal;
    partes.push(`Canal: ${label}`);
  }

  return partes.length > 0 ? partes.join(" · ") : "Sin filtros";
}

export function leadsToCsv(leads: Lead[], opciones: OpcionesCsv = {}): string {
  const generado = opciones.generadoEn ?? new Date();

  const criticos = leads.filter(
    (l) => clasificarSeveridad(l.rating) === "critica",
  ).length;
  const riesgo = leads.filter(
    (l) => clasificarSeveridad(l.rating) === "riesgo",
  ).length;
  const vigilancia = leads.filter(
    (l) => clasificarSeveridad(l.rating) === "vigilancia",
  ).length;
  const sinAnalizar = leads.filter((l) => !l.problema).length;
  const conEmail = leads.filter((l) => Boolean(l.email)).length;
  const conTelefono = leads.filter((l) => Boolean(l.telefono)).length;

  const lineas: string[] = [
    fila(["REPUSENSE · RADAR DE REPUTACIÓN EN CRISIS"]),
    fila(["Reporte de leads"]),
    fila(["Generado", fechaHora(generado)]),
    fila(["Total de leads", leads.length]),
    fila(["Filtros aplicados", describirFiltros(opciones.filtros)]),
  ];

  if (opciones.filtros?.sort) {
    lineas.push(
      fila([
        "Orden",
        ORDEN_LABELS[opciones.filtros.sort] ?? opciones.filtros.sort,
      ]),
    );
  }

  lineas.push("", fila(COLUMNAS));

  leads.forEach((lead, indice) => {
    const severidad = clasificarSeveridad(lead.rating);
    lineas.push(
      fila([
        indice + 1,
        lead.nombre,
        lead.rubro,
        lead.ciudad,
        lead.fuente,
        numero(lead.rating, 1),
        lead.numResenas,
        SEVERIDAD_MAP[severidad].label,
        problemaLabel(lead),
        lead.problema ? lead.confianzaIA : "—",
        lead.telefono,
        lead.email,
        lead.web,
        lead.linkedin,
        ESTADO_MAP[lead.estado]?.label ?? lead.estado,
        vendedorLabel(lead),
        fechaCorta(lead.ultimoEscaneo),
        lead.reviewsNegativas.length,
        quejaDestacada(lead),
      ]),
    );
  });

  lineas.push(
    "",
    fila(["RESUMEN EJECUTIVO"]),
    fila(["Críticos", criticos]),
    fila(["En riesgo", riesgo]),
    fila(["En vigilancia", vigilancia]),
    fila(["Sin analizar", sinAnalizar]),
    fila(["Con email", conEmail]),
    fila(["Con teléfono", conTelefono]),
  );

  return lineas.join("\r\n");
}

export function descargarCsv(leads: Lead[], opciones: OpcionesCsv = {}) {
  const generado = opciones.generadoEn ?? new Date();
  const csv = leadsToCsv(leads, { ...opciones, generadoEn: generado });
  const nombre =
    opciones.nombre ?? `repusense-leads-${fechaArchivo(generado)}.csv`;

  // BOM para que Excel respete las tildes y la ñ.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombre;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

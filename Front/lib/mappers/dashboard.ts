import type { DashboardStats, Problema, Severidad } from "@/lib/types";

const PROBLEMAS: Problema[] = [
  "atencion",
  "precios",
  "higiene",
  "demoras",
  "calidad",
  "citas",
];

const SEVERIDADES: Severidad[] = ["critica", "riesgo", "vigilancia"];

function numero(valor: unknown): number {
  const parseado = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(parseado) ? parseado : 0;
}

function lista(valor: unknown): Record<string, unknown>[] {
  return Array.isArray(valor) ? (valor as Record<string, unknown>[]) : [];
}

/**
 * `GET /api/dashboard` ya responde en camelCase, pero normalizamos para
 * garantizar que existan las seis categorías y las tres severidades aunque
 * el backend agregue o quite claves en el futuro.
 */
export function mapApiDashboard(raw: unknown): DashboardStats {
  const data = (raw ?? {}) as Record<string, unknown>;

  const problemas = new Map<string, number>();
  for (const item of lista(data.porProblema)) {
    const clave = String(item.problema ?? "");
    problemas.set(clave, numero(item.cantidad));
  }

  const severidades = new Map<string, number>();
  for (const item of lista(data.porSeveridad)) {
    const clave = String(item.severidad ?? "");
    severidades.set(clave, numero(item.cantidad));
  }

  return {
    totalLeads: numero(data.totalLeads),
    nuevos: numero(data.nuevos),
    criticos: numero(data.criticos),
    riesgo: numero(data.riesgo),
    vigilancia: numero(data.vigilancia),
    conEmail: numero(data.conEmail),
    conTelefono: numero(data.conTelefono),
    conWeb: numero(data.conWeb),
    contactosTotales: numero(data.contactosTotales),
    tasaAbordaje: numero(data.tasaAbordaje),
    porProblema: PROBLEMAS.map((problema) => ({
      problema,
      cantidad: problemas.get(problema) ?? 0,
    })),
    porCiudad: lista(data.porCiudad)
      .map((item) => ({
        ciudad: String(item.ciudad ?? ""),
        cantidad: numero(item.cantidad),
      }))
      .filter((item) => item.ciudad.length > 0)
      .sort((a, b) => b.cantidad - a.cantidad),
    porRubro: lista(data.porRubro)
      .map((item) => ({
        rubro: String(item.rubro ?? ""),
        cantidad: numero(item.cantidad),
      }))
      .filter((item) => item.rubro.length > 0)
      .sort((a, b) => b.cantidad - a.cantidad),
    porSeveridad: SEVERIDADES.map((severidad) => ({
      severidad,
      cantidad: severidades.get(severidad) ?? 0,
    })),
  };
}

import type { Lead, Severidad } from "./types";

/**
 * Mismos umbrales que usa `GET /api/dashboard` en el backend para que el
 * semáforo del tablero y las insignias del listado digan lo mismo.
 */
export function clasificarSeveridad(rating: number): Severidad {
  if (rating <= 2.0) return "critica";
  if (rating <= 3.0) return "riesgo";
  return "vigilancia";
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatNumero(n: number): string {
  return new Intl.NumberFormat("es-AR").format(n);
}

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "Fecha no disponible";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function tieneContacto(lead: Lead): boolean {
  return Boolean(lead.email || lead.telefono);
}

export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

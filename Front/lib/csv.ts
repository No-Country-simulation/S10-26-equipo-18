import type { Lead } from "./types";

const COLUMNAS: { key: keyof Lead; label: string }[] = [
  { key: "nombre", label: "Negocio" },
  { key: "rubro", label: "Rubro" },
  { key: "ciudad", label: "Ciudad" },
  { key: "rating", label: "Rating" },
  { key: "numResenas", label: "Reseñas" },
  { key: "problema", label: "Problema IA" },
  { key: "confianzaIA", label: "Confianza IA" },
  { key: "telefono", label: "Teléfono" },
  { key: "email", label: "Email" },
  { key: "web", label: "Web" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "estado", label: "Estado" },
  { key: "fuente", label: "Fuente" },
];

function escapar(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  if (/[",\n;]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function leadsToCsv(leads: Lead[]): string {
  const headers = COLUMNAS.map((c) => c.label).join(",");
  const filas = leads.map((l) =>
    COLUMNAS.map((c) => escapar(l[c.key])).join(","),
  );
  return [headers, ...filas].join("\n");
}

export function descargarCsv(leads: Lead[], nombre = "repusense-leads.csv") {
  const csv = leadsToCsv(leads);
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

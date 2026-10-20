"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetFiltros, setFiltro } from "@/store/slices/uiSlice";
import {
  CANALES,
  CIUDADES,
  ESTADOS,
  PROBLEMAS,
  RUBROS,
  SEVERIDAD_MAP,
} from "@/lib/constants";
import type { LeadQuery } from "@/lib/types";
import { SearchIcon, XIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";

function Select({
  valor,
  onChange,
  children,
  label,
}: {
  valor: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="input py-2"
    >
      {children}
    </select>
  );
}

export function LeadFilters({ total }: { total: number }) {
  const filtros = useAppSelector((s) => s.ui.filtros);
  const dispatch = useAppDispatch();

  const set = (key: keyof LeadQuery) => (value: string) =>
    dispatch(setFiltro({ key, value }));

  const hayFiltros =
    filtros.ciudad ||
    filtros.rubro ||
    filtros.problema ||
    filtros.estado ||
    filtros.severidad ||
    filtros.canal ||
    filtros.search;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={filtros.search ?? ""}
            onChange={(e) => set("search")(e.target.value)}
            placeholder="Buscar por negocio, ciudad o email..."
            className="input pl-9"
          />
        </div>
        <span className="hidden shrink-0 rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-slate-400 sm:block">
          {total} resultados
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <Select label="Ciudad" valor={filtros.ciudad ?? ""} onChange={set("ciudad")}>
          <option value="">Todas las ciudades</option>
          {CIUDADES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select label="Rubro" valor={filtros.rubro ?? ""} onChange={set("rubro")}>
          <option value="">Todos los rubros</option>
          {RUBROS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Select
          label="Problema"
          valor={filtros.problema ?? ""}
          onChange={set("problema")}
        >
          <option value="">Todos los problemas</option>
          {PROBLEMAS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </Select>
        <Select
          label="Severidad"
          valor={filtros.severidad ?? ""}
          onChange={set("severidad")}
        >
          <option value="">Toda severidad</option>
          {Object.values(SEVERIDAD_MAP).map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </Select>
        <Select label="Estado" valor={filtros.estado ?? ""} onChange={set("estado")}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </Select>
        <Select label="Canal" valor={filtros.canal ?? ""} onChange={set("canal")}>
          <option value="">Cualquier canal</option>
          {CANALES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Select label="Orden" valor={filtros.sort ?? "rating-asc"} onChange={set("sort")}>
          <option value="rating-asc">Prioridad: peor calificación</option>
          <option value="rating-desc">Mejor calificación</option>
          <option value="resenas-desc">Más reseñas</option>
          <option value="confianza">Mayor confianza IA</option>
          <option value="nombre">Nombre (A-Z)</option>
        </Select>
        {hayFiltros ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(resetFiltros())}
          >
            <XIcon className="h-3.5 w-3.5" />
            Limpiar filtros
          </Button>
        ) : null}
      </div>
    </div>
  );
}

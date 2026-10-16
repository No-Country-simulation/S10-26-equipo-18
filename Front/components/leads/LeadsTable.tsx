"use client";

import type { Lead } from "@/lib/types";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { PainBadge } from "@/components/ui/PainBadge";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import {
  ChevronRightIcon,
  GlobeIcon,
  LinkedinIcon,
  MailIcon,
  PhoneIcon,
} from "@/components/ui/icons";
import { formatNumero } from "@/lib/format";
import { cn } from "@/lib/cn";

function CanalIcon({
  activo,
  children,
}: {
  activo: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className={cn(activo ? "text-primary" : "text-slate-700")}>
      {children}
    </span>
  );
}

export function LeadsTable({
  leads,
  onSelect,
}: {
  leads: Lead[];
  onSelect: (id: string) => void;
}) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm text-slate-400">
          No hay leads que coincidan con los filtros.
        </p>
        <p className="font-mono text-xs text-slate-600">
          Probá ajustar los criterios de búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="custom-scroll overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-slate-500">
            <th className="px-3 py-3 font-medium">Negocio</th>
            <th className="px-3 py-3 font-medium">Calificación</th>
            <th className="px-3 py-3 text-right font-medium">Reseñas</th>
            <th className="px-3 py-3 font-medium">Problema IA</th>
            <th className="px-3 py-3 font-medium">Canales</th>
            <th className="px-3 py-3 font-medium">Confianza</th>
            <th className="px-3 py-3 font-medium">Estado</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onSelect(lead.id)}
              className="group cursor-pointer transition hover:bg-slate-900/40"
            >
              <td className="px-3 py-3">
                <p className="font-medium text-slate-100">{lead.nombre}</p>
                <p className="text-xs text-slate-500">
                  {lead.rubro} · {lead.ciudad}
                </p>
              </td>
              <td className="px-3 py-3">
                <RatingBadge rating={lead.rating} />
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-400">
                {formatNumero(lead.numResenas)}
              </td>
              <td className="px-3 py-3">
                <PainBadge problema={lead.problema} short />
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <CanalIcon activo={Boolean(lead.email)}>
                    <MailIcon className="h-4 w-4" />
                  </CanalIcon>
                  <CanalIcon activo={Boolean(lead.telefono)}>
                    <PhoneIcon className="h-4 w-4" />
                  </CanalIcon>
                  <CanalIcon activo={Boolean(lead.web)}>
                    <GlobeIcon className="h-4 w-4" />
                  </CanalIcon>
                  <CanalIcon activo={Boolean(lead.linkedin)}>
                    <LinkedinIcon className="h-4 w-4" />
                  </CanalIcon>
                </div>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${lead.confianzaIA}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-slate-400">
                    {lead.confianzaIA}%
                  </span>
                </div>
              </td>
              <td className="px-3 py-3">
                <EstadoBadge estado={lead.estado} />
              </td>
              <td className="px-3 py-3 text-right">
                <ChevronRightIcon className="ml-auto h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

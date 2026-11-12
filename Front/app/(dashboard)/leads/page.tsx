"use client";

import { useGetLeadsQuery } from "@/store/api/leadsApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { seleccionarLead } from "@/store/slices/uiSlice";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DownloadIcon } from "@/components/ui/icons";
import { descargarCsv } from "@/lib/csv";
import { formatNumero } from "@/lib/format";

export default function LeadsPage() {
  const filtros = useAppSelector((s) => s.ui.filtros);
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching } = useGetLeadsQuery(filtros);

  // Items traídos del backend. Orden prioritario:
  // 1) estado === "nuevo" (los leads recién traídos saltan a la cabeza)
  // 2) dentro del mismo estado, fecha de escaneo descendente (los más recientes primero)
  const items = data
    ? [...(data.items ?? {})].sort(
        (a, b) => {
          // Prioridad 1: ¿son nuevos?
          const aNuevo = a.estado === "nuevo";
          const bNuevo = b.estado === "nuevo";
          if (aNuevo && !bNuevo) return -1;
          if (!aNuevo && bNuevo) return 1;
          // Empate en nuevo: ordenar por fecha de escaneo (los más recientes primero)
          const aDate = a.ultimoEscaneo ?? '';
          const bDate = b.ultimoEscaneo ?? '';
          if (aDate > bDate) return -1;
          if (aDate < bDate) return 1;
          return 0;
        },
      )
    : [];

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-grotesk text-lg font-bold text-white">
              Explorador de leads
            </h2>
            <p className="text-xs text-slate-400">
              {data
                ? `${formatNumero(data.total)} negocios · ${formatNumero(
                    data.nuevos,
                  )} nuevos · ${formatNumero(data.criticos)} en crisis crítica`
                : "Cargando resultados..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => descargarCsv(items, { filtros })}
              disabled={items.length === 0}
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <LeadFilters total={data?.total ?? 0} />
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-bg" />
            ))}
          </div>
        ) : (
          <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
            <LeadsTable
              leads={items}
              onSelect={(id) => dispatch(seleccionarLead(id))}
            />
          </div>
        )}
      </Card>

      <LeadDrawer />
    </div>
  );
}

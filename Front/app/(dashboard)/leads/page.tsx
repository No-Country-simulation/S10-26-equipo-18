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

  const items = data?.items ?? [];

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
              onClick={() => descargarCsv(items)}
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

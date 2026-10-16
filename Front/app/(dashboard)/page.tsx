"use client";

import Link from "next/link";
import {
  useGetDashboardQuery,
  useGetScansQuery,
} from "@/store/api/leadsApi";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProblemBarChart } from "@/components/charts/ProblemBarChart";
import { SeverityDonut } from "@/components/charts/SeverityDonut";
import { ScanHistory } from "@/components/dashboard/ScanHistory";
import { SEVERIDAD_MAP } from "@/lib/constants";
import { formatNumero } from "@/lib/format";
import { AlertIcon, MailIcon, RadarIcon, SparklesIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export default function RadarPage() {
  const { data: stats, isLoading, isError } = useGetDashboardQuery();
  const { data: scans = [] } = useGetScansQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card h-28 animate-pulse bg-surface/60" />
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <Card>
        <p className="text-sm text-rose-400">
          No se pudieron cargar las métricas del radar.
        </p>
      </Card>
    );
  }

  const maxCiudad = Math.max(...stats.porCiudad.map((c) => c.cantidad), 1);
  const contactabilidad = [
    { label: "Con email", valor: stats.conEmail, color: "bg-primary" },
    { label: "Con teléfono", valor: stats.conTelefono, color: "bg-sky-400" },
    { label: "Con sitio web", valor: stats.conWeb, color: "bg-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden p-6">
        <div className="absolute -right-8 -top-8 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
              Radar operativo activo
            </span>
            <h2 className="mt-1 font-grotesk text-2xl font-bold text-white">
              {formatNumero(stats.totalLeads)} oportunidades detectadas
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Negocios locales con calificación baja y reseñas críticas en las
              últimas semanas. Priorizá por severidad y convertí el diagnóstico
              en el primer contacto.
            </p>
          </div>
          <Link href="/nueva-busqueda" className="shrink-0">
            <Button>
              <RadarIcon className="h-4 w-4" />
              Lanzar escaneo radar
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Leads totales"
          value={formatNumero(stats.totalLeads)}
          hint={
            <span>
              <span className="font-mono text-primary">
                {formatNumero(stats.nuevos)}
              </span>{" "}
              nuevos para contactar
            </span>
          }
          dot
        />
        <KpiCard
          label="En crisis crítica"
          value={formatNumero(stats.criticos)}
          accent="text-rose-500"
          icon={<AlertIcon className="h-4 w-4" />}
          hint={
            <span>
              <span className="font-mono text-rose-400">
                {Math.round((stats.criticos / stats.totalLeads) * 100)}%
              </span>{" "}
              en máxima urgencia
            </span>
          }
        />
        <KpiCard
          label="Contacto directo"
          value={formatNumero(stats.contactosTotales)}
          accent="text-sky-400"
          icon={<MailIcon className="h-4 w-4" />}
          hint="Listos para cold outreach"
        />
        <KpiCard
          label="Pipeline efectivo"
          value={formatNumero(stats.totalLeads - stats.nuevos)}
          accent="text-emerald-400"
          icon={<SparklesIcon className="h-4 w-4" />}
          hint={
            <span>
              Tasa de abordaje:{" "}
              <strong className="text-emerald-300">{stats.tasaAbordaje}%</strong>
            </span>
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Distribución de problemas detectados"
            subtitle="Clasificación semántica de reseñas negativas por IA"
          />
          <div className="mt-4">
            <ProblemBarChart data={stats.porProblema} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Semáforo de severidad"
            subtitle="Prioridad comercial por calificación"
          />
          <SeverityDonut data={stats.porSeveridad} />
          <div className="mt-2 space-y-2">
            {stats.porSeveridad.map((s) => (
              <div
                key={s.severidad}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-slate-300">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: SEVERIDAD_MAP[s.severidad].color }}
                  />
                  {SEVERIDAD_MAP[s.severidad].label}
                </span>
                <span className="font-mono tabular-nums text-slate-400">
                  {s.cantidad}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Top ciudades" subtitle="Volumen de leads por plaza" />
          <div className="mt-4 space-y-3">
            {stats.porCiudad.slice(0, 6).map((c) => (
              <div key={c.ciudad}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-300">{c.ciudad}</span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {c.cantidad}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(c.cantidad / maxCiudad) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Rubros monitoreados"
            subtitle="Categorías activas en el radar"
          />
          <div className="mt-4 space-y-2">
            {stats.porRubro.map((r) => (
              <div
                key={r.rubro}
                className="flex items-center justify-between rounded-lg border border-line bg-bg px-3 py-2"
              >
                <span className="text-sm text-slate-300">{r.rubro}</span>
                <span className="font-mono text-sm tabular-nums text-primary">
                  {r.cantidad}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Contactabilidad"
            subtitle="Canales disponibles por lead"
          />
          <div className="mt-4 space-y-4">
            {contactabilidad.map((c) => (
              <div key={c.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-300">{c.label}</span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {c.valor}/{stats.totalLeads}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={cn("h-full rounded-full", c.color)}
                    style={{
                      width: `${(c.valor / stats.totalLeads) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-line bg-bg px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Reseñas negativas analizadas
              </p>
              <p className="font-grotesk text-lg font-bold tabular-nums text-white">
                {formatNumero(stats.totalLeads * 3)}+
              </p>
            </div>
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Escaneos recientes"
          subtitle="Historial de ejecuciones del radar"
          right={
            <Link href="/nueva-busqueda">
              <Button variant="secondary" size="sm">
                Nuevo escaneo
              </Button>
            </Link>
          }
        />
        <div className="mt-3">
          <ScanHistory scans={scans} />
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  useGetLeadQuery,
  useUpdateLeadMutation,
} from "@/store/api/leadsApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { seleccionarLead } from "@/store/slices/uiSlice";
import { ESTADOS, VENDEDORES } from "@/lib/constants";
import { clasificarSeveridad, formatFecha, formatNumero } from "@/lib/format";
import { SEVERIDAD_MAP } from "@/lib/constants";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { PainBadge } from "@/components/ui/PainBadge";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Button } from "@/components/ui/Button";
import {
  CheckIcon,
  ExternalIcon,
  GlobeIcon,
  LinkedinIcon,
  MailIcon,
  PhoneIcon,
  SparklesIcon,
  StarIcon,
  XIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function LeadDrawer() {
  const id = useAppSelector((s) => s.ui.selectedLeadId);
  const dispatch = useAppDispatch();
  const { data: lead, isFetching } = useGetLeadQuery(id ?? "", { skip: !id });
  const [updateLead, { isLoading: guardando }] = useUpdateLeadMutation();
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setCopiado(false);
  }, [id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dispatch(seleccionarLead(null));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  if (!id) return null;

  const sev = lead ? SEVERIDAD_MAP[clasificarSeveridad(lead.rating)] : null;

  function copiarDraft() {
    if (!lead) return;
    const texto = `Asunto: ${lead.draft.asunto}\n\n${lead.draft.cuerpo}`;
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => dispatch(seleccionarLead(null))}
      />
      <aside className="custom-scroll relative flex h-full w-full max-w-xl animate-fade-in flex-col overflow-y-auto border-l border-line bg-surface shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              Ficha de prospección
            </p>
            <h2 className="font-grotesk text-lg font-bold text-white">
              {lead?.nombre ?? "Cargando..."}
            </h2>
            {lead ? (
              <p className="mt-0.5 text-xs text-slate-400">
                {lead.rubro} · {lead.ciudad} ·{" "}
                <span className="font-mono">{lead.fuente}</span>
              </p>
            ) : null}
          </div>
          <button
            onClick={() => dispatch(seleccionarLead(null))}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {isFetching && !lead ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-bg" />
            ))}
          </div>
        ) : null}

        {lead ? (
          <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <RatingBadge rating={lead.rating} />
              <PainBadge problema={lead.problema} />
              <EstadoBadge estado={lead.estado} />
              <span className="font-mono text-xs text-slate-500">
                {formatNumero(lead.numResenas)} reseñas · escaneado{" "}
                {formatFecha(lead.ultimoEscaneo)}
              </span>
            </div>

            <section className="rounded-xl border border-line bg-bg p-4">
              <div className="mb-3 flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-primary" />
                <h3 className="font-grotesk text-sm font-semibold text-white">
                  Diagnóstico IA
                </h3>
              </div>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Dolor principal:{" "}
                  <span className="text-slate-200">
                    {lead.problema === "atencion"
                      ? "Atención al cliente"
                      : lead.problema}
                  </span>
                </span>
                <span className="font-mono text-slate-400">
                  Confianza {lead.confianzaIA}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${lead.confianzaIA}%`,
                    backgroundColor: sev?.color,
                  }}
                />
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                Severidad detectada:{" "}
                <span style={{ color: sev?.color }}>{sev?.label}</span> ·
                clasificación semántica de {lead.reviewsNegativas.length} reseñas
                negativas.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-grotesk text-sm font-semibold text-white">
                Contacto
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <ContactoFila
                  icon={<PhoneIcon className="h-4 w-4" />}
                  label="Teléfono"
                  valor={lead.telefono}
                  href={lead.telefono ? `tel:${lead.telefono}` : undefined}
                />
                <ContactoFila
                  icon={<MailIcon className="h-4 w-4" />}
                  label="Email"
                  valor={lead.email}
                  href={lead.email ? `mailto:${lead.email}` : undefined}
                />
                <ContactoFila
                  icon={<GlobeIcon className="h-4 w-4" />}
                  label="Sitio web"
                  valor={lead.web}
                  href={lead.web ?? undefined}
                />
                <ContactoFila
                  icon={<LinkedinIcon className="h-4 w-4" />}
                  label="LinkedIn"
                  valor={lead.linkedin}
                  href={lead.linkedin ?? undefined}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-2 font-grotesk text-sm font-semibold text-white">
                Reseñas negativas
              </h3>
              <div className="space-y-2">
                {lead.reviewsNegativas.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-line bg-bg p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-500">
                        {r.autor}
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: r.estrellas }).map((_, s) => (
                          <StarIcon key={s} className="h-3 w-3" />
                        ))}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-slate-300">
                      “{r.texto}”
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-grotesk text-sm font-semibold text-white">
                  <MailIcon className="h-4 w-4 text-primary" />
                  Draft de primer contacto
                </h3>
                <Button size="sm" variant="secondary" onClick={copiarDraft}>
                  {copiado ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5" /> Copiado
                    </>
                  ) : (
                    "Copiar"
                  )}
                </Button>
              </div>
              <p className="mb-2 text-xs font-medium text-primary">
                {lead.draft.asunto}
              </p>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-slate-300">
                {lead.draft.cuerpo}
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-grotesk text-sm font-semibold text-white">
                Estado del pipeline
              </h3>
              <div className="flex flex-wrap gap-2">
                {ESTADOS.map((e) => {
                  const activo = lead.estado === e.key;
                  return (
                    <button
                      key={e.key}
                      disabled={guardando}
                      onClick={() =>
                        updateLead({ id: lead.id, cambios: { estado: e.key } })
                      }
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
                        activo
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-line bg-bg text-slate-400 hover:text-slate-200",
                      )}
                    >
                      {e.label}
                    </button>
                  );
                })}
              </div>
              {lead.vendedor ? (
                <p className="mt-2 font-mono text-[11px] text-slate-500">
                  Asignado a:{" "}
                  {VENDEDORES.find((v) => v.id === lead.vendedor)?.nombre ??
                    lead.vendedor}
                </p>
              ) : null}
            </section>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function ContactoFila({
  icon,
  label,
  valor,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  valor: string | null;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-bg px-3 py-2">
      <span className={valor ? "text-primary" : "text-slate-600"}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {valor ? (
          href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 truncate text-xs text-slate-200 hover:text-primary"
            >
              {valor}
              <ExternalIcon className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <p className="truncate text-xs text-slate-200">{valor}</p>
          )
        ) : (
          <p className="text-xs text-slate-600">No disponible</p>
        )}
      </div>
    </div>
  );
}

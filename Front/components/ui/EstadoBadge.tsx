import { Chip } from "./Chip";
import { ESTADO_MAP } from "@/lib/constants";
import type { LeadEstado } from "@/lib/types";

export function EstadoBadge({ estado }: { estado: LeadEstado }) {
  const meta = ESTADO_MAP[estado];
  if (!meta) return null;
  return <Chip className={meta.chip}>{meta.label}</Chip>;
}

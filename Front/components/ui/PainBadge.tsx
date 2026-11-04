import { Chip } from "./Chip";
import { PROBLEMA_MAP } from "@/lib/constants";
import type { Problema } from "@/lib/types";

export function PainBadge({
  problema,
  short = false,
}: {
  problema: Problema | null;
  short?: boolean;
}) {
  if (!problema) {
    return (
      <Chip className="border-slate-600/40 bg-slate-700/10 text-slate-400">
        Sin analizar
      </Chip>
    );
  }
  const meta = PROBLEMA_MAP[problema];
  if (!meta) return null;
  return (
    <Chip className={meta.chip}>
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {short ? meta.short : meta.label}
    </Chip>
  );
}

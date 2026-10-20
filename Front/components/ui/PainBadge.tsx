import { Chip } from "./Chip";
import { PROBLEMA_MAP } from "@/lib/constants";
import type { Problema } from "@/lib/types";

export function PainBadge({
  problema,
  short = false,
}: {
  problema: Problema;
  short?: boolean;
}) {
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

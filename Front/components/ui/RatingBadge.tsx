import { Chip } from "./Chip";
import { clasificarSeveridad, formatRating } from "@/lib/format";
import { SEVERIDAD_MAP } from "@/lib/constants";
import { StarIcon } from "./icons";

export function RatingBadge({ rating }: { rating: number }) {
  const sev = SEVERIDAD_MAP[clasificarSeveridad(rating)];
  return (
    <Chip className={sev.chip}>
      <StarIcon className="h-3 w-3" />
      <span className="font-grotesk tabular-nums">{formatRating(rating)}</span>
      <span className="hidden sm:inline">{sev.label}</span>
    </Chip>
  );
}

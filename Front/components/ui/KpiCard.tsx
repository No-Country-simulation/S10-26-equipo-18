import { cn } from "@/lib/cn";

export function KpiCard({
  label,
  value,
  hint,
  icon,
  accent = "text-primary",
  dot,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: string;
  dot?: boolean;
}) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-400">
        <span>{label}</span>
        {icon ? (
          <span className={accent}>{icon}</span>
        ) : dot ? (
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        ) : null}
      </div>
      <div className={cn("mt-3 font-grotesk text-3xl font-bold tabular-nums", accent)}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

import { cn } from "@/lib/cn";
//nuevo boton

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("card p-5", className)}>{children}</div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div>
        <h3 className="font-grotesk text-base font-semibold text-white">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

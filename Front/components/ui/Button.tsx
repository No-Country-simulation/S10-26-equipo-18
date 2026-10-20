import { cn } from "@/lib/cn";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const variantes = {
    primary:
      "bg-primary hover:bg-primary-glow text-[#06201d] font-semibold shadow-teal-glow",
    secondary:
      "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-line",
    ghost: "text-slate-300 hover:bg-slate-800/60",
    danger: "bg-rose-500 hover:bg-rose-400 text-white font-semibold",
  };
  const tamanos = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variantes[variant],
        tamanos[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

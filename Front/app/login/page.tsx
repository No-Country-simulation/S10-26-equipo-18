import { LoginForm } from "@/components/auth/LoginForm";
import { RadarAnimation } from "@/components/auth/RadarAnimation";
import { RadarIcon } from "@/components/ui/icons";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-subtle-glow">
              <RadarIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-grotesk text-2xl font-bold tracking-tight text-white">
                RepuSense
              </h1>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                Radar de reputación en crisis
              </p>
            </div>
          </div>

          <h2 className="font-grotesk text-xl font-semibold text-white">
            Acceso de operadores
          </h2>
          <p className="mb-6 mt-1 text-sm text-slate-400">
            Detectá negocios locales en crisis reputacional y convertí el
            diagnóstico en el primer contacto.
          </p>

          <LoginForm />
        </div>
      </div>

      <div className="relative hidden items-center justify-center overflow-hidden border-l border-line bg-surface lg:flex">
        <RadarAnimation />
      </div>
    </div>
  );
}

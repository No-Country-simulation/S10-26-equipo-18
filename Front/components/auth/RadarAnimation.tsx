const BLIPS = [
  { top: "28%", left: "62%", delay: "0s" },
  { top: "58%", left: "34%", delay: "0.8s" },
  { top: "44%", left: "72%", delay: "1.6s" },
  { top: "70%", left: "52%", delay: "2.2s" },
];

export function RadarAnimation() {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-10">
      <div className="relative aspect-square w-full max-w-md">
        <div className="absolute inset-0 rounded-full border border-primary/10" />
        <div className="absolute inset-[12%] rounded-full border border-primary/10" />
        <div className="absolute inset-[26%] rounded-full border border-primary/15" />
        <div className="absolute inset-[40%] rounded-full border border-primary/15" />
        <div className="absolute inset-[54%] rounded-full border border-primary/20" />

        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary/10" />
        <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-primary/10" />

        <div
          className="absolute inset-0 animate-radar-sweep rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(45,212,191,0.35) 0deg, rgba(45,212,191,0.08) 45deg, transparent 90deg)",
          }}
        />

        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-teal-glow" />

        {BLIPS.map((b, i) => (
          <span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-primary-glow/70"
            style={{ top: b.top, left: b.left, animationDelay: b.delay }}
          >
            <span
              className="absolute inset-0 animate-pulse-ring rounded-full border border-primary-glow"
              style={{ animationDelay: b.delay }}
            />
          </span>
        ))}
      </div>

      <div className="absolute bottom-10 left-10 font-mono text-[11px] text-slate-500">
        <p className="text-primary">[RADAR_STANDBY_OK]</p>
        <p>escaneando reputación de negocios locales...</p>
        <p className="text-slate-600">
          6 categorías IA · Google Maps · TripAdvisor · Yelp
        </p>
      </div>
    </div>
  );
}

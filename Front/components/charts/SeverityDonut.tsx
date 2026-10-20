"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Severidad } from "@/lib/types";
import { SEVERIDAD_MAP } from "@/lib/constants";

export function SeverityDonut({
  data,
}: {
  data: { severidad: Severidad; cantidad: number }[];
}) {
  const chartData = data.map((d) => ({
    name: SEVERIDAD_MAP[d.severidad].label,
    value: d.cantidad,
    color: SEVERIDAD_MAP[d.severidad].color,
  }));
  const total = chartData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={3}
            stroke="none"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#0a0f1c",
              border: "1px solid #1e293b",
              borderRadius: 10,
              fontSize: 12,
              color: "#e2e8f0",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-grotesk text-2xl font-bold tabular-nums text-white">
          {total}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          leads
        </span>
      </div>
    </div>
  );
}

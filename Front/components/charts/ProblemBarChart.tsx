"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Problema } from "@/lib/types";
import { PROBLEMA_MAP } from "@/lib/constants";

export function ProblemBarChart({
  data,
}: {
  data: { problema: Problema; cantidad: number }[];
}) {
  const chartData = data.map((d) => ({
    name: PROBLEMA_MAP[d.problema]?.short ?? d.problema,
    cantidad: d.cantidad,
    color: PROBLEMA_MAP[d.problema]?.color ?? "#14b8a6",
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <XAxis
          type="number"
          stroke="#475569"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#94a3b8"
          fontSize={12}
          width={86}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(148,163,184,0.08)" }}
          contentStyle={{
            background: "#0a0f1c",
            border: "1px solid #1e293b",
            borderRadius: 10,
            fontSize: 12,
            color: "#e2e8f0",
          }}
          labelStyle={{ color: "#94a3b8" }}
        />
        <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={18}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

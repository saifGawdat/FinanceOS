import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../../utils/formatters";

const GoalsProgressChart = ({ goals, limit = 6, height = 220 }) => {
  const data = useMemo(() => {
    if (!Array.isArray(goals)) return [];

    const mapped = goals.map((g) => {
      const target = Number(g?.targetAmount || 0);
      const current = Number(g?.currentAmount || 0);
      const pct = target > 0 ? Math.max(0, Math.min(100, (current / target) * 100)) : 0;
      return {
        title: g?.title || "Untitled",
        progress: Number(pct.toFixed(2)),
        current,
        target,
      };
    });

    // Sort: lowest completion first, to highlight what needs attention
    mapped.sort((a, b) => a.progress - b.progress);
    return mapped.slice(0, Math.max(1, limit));
  }, [goals, limit]);

  if (data.length === 0) {
    return <p className="text-gray-600 text-xs italic text-center py-10">No goals yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6b7280", fontSize: 12 }}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="title"
          axisLine={false}
          tickLine={false}
          width={50}
          tick={{ fill: "#9ca3af", fontSize: 10 }}
          tickFormatter={(v) => {
            const s = String(v ?? "");
            return s.length > 10 ? `${s.slice(0, 10)}…` : s;
          }}
        />
        <Tooltip
          formatter={(value, _name, props) => {
            const p = props?.payload;
            return [`${value}%  (${formatCurrency(p?.current)} / ${formatCurrency(p?.target)})`, "Progress"];
          }}
          contentStyle={{
            backgroundColor: "#0e0e12",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            fontSize: "12px",
            color: "#e5e7eb",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
          itemStyle={{ color: "#e5e7eb" }}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar
          dataKey="progress"
          fill="#3b82f6"
          radius={[10, 10, 10, 10]}
          name="Progress"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default GoalsProgressChart;


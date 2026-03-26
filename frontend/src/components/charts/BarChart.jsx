import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const BarChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6b7280", fontSize: 12 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6b7280", fontSize: 12 }}
        />
        <Tooltip
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
        <Legend
          wrapperStyle={{
            paddingTop: "20px",
            fontSize: "12px",
            color: "#9ca3af",
          }}
          iconType="circle"
        />
        <Bar
          dataKey="income"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          name="Income"
        />
        <Bar
          dataKey="expense"
          fill="#ef4444"
          radius={[4, 4, 0, 0]}
          name="Expense"
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;

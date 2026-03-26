import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const LineChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
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
        />
        <Legend
          wrapperStyle={{
            paddingTop: "20px",
            fontSize: "12px",
            color: "#9ca3af",
          }}
          iconType="circle"
        />
        <Line
          type="monotone"
          dataKey="income"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
          name="Income"
        />
        <Line
          type="monotone"
          dataKey="expense"
          stroke="#ef4444"
          strokeWidth={3}
          dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
          name="Expense"
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;

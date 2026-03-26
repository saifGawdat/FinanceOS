import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Text,
} from "recharts";

const SavingsRateChart = ({ rate }) => {
  // Normalize rate between -100 and 100 for visualization, 
  // but we'll show the actual value.
  const displayRate = Math.min(Math.max(rate, -100), 100);
  
  // Data for the gauge: [value, remaining]
  // We use a half-circle (180 degrees)
  const absoluteValue = Math.abs(displayRate);
  const data = [
    { value: absoluteValue },
    { value: 100 - absoluteValue },
  ];

  const isPositive = rate >= 0;
  const color = isPositive ? "#22c55e" : "#ef4444"; // Green vs Red

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="70%"
          startAngle={180}
          endAngle={0}
          innerRadius={60}
          outerRadius={80}
          paddingAngle={0}
          dataKey="value"
          stroke="none"
        >
          <Cell fill={color} />
          <Cell fill="rgba(255,255,255,0.05)" />
        </Pie>
        <text
          x="50%"
          y="65%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white text-3xl font-black"
        >
          {rate.toFixed(1)}%
        </text>
        <text
          x="50%"
          y="80%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-500 text-[10px] font-bold uppercase tracking-widest"
        >
          {isPositive ? "Saved" : "Overspent"}
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SavingsRateChart;

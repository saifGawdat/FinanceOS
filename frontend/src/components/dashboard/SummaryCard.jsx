import React from "react";
import { formatCurrency } from "../../utils/formatters";

const SummaryCard = ({
  title,
  amount,
  // eslint-disable-next-line no-unused-vars
  icon: Icon,
  iconColor,
  bgGradient,
  highlight,
}) => {

  const borderColorMap = {
    "from-blue-500 to-blue-500": "border-l-blue-500",
    "from-green-500 to-green-600": "border-l-green-500",
    "from-red-500 to-red-600": "border-l-red-500",
  };

  const iconBgMap = {
    "from-blue-500 to-blue-500": "bg-blue-500/10",
    "from-green-500 to-green-600": "bg-green-500/10",
    "from-red-500 to-red-600": "bg-red-500/10",
  };

  const borderColor = highlight
    ? "border-l-gray-300"
    : borderColorMap[bgGradient] || "border-l-blue-500";

  const iconBg = highlight
    ? "bg-white/10"
    : iconBgMap[bgGradient] || "bg-blue-500/10";

  return (
    <div
      className={`bg-[#0e0e12] border border-white/5 ${borderColor} border-l-4 rounded-2xl p-6 transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-black/50 w-full group`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-100">
            {formatCurrency(amount)}
          </h3>
        </div>

        <div
          className={`${iconBg} p-3 rounded-lg flex items-center justify-center`}
        >
          <Icon size={24} className={highlight ? "text-white" : iconColor} />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;

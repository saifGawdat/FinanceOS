import React from "react";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { IoArrowUp, IoArrowDown } from "react-icons/io5";

const RecentTransactions = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No recent transactions</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 min-w-full">
      {transactions.map((transaction) => (
        <div
          key={transaction._id}
          className="flex items-center justify-between p-4 bg-transparent border-b border-white/5 hover:bg-white/3 transition-all duration-300 group rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                transaction.type === "income"
                  ? "bg-blue-500/10"
                  : "bg-red-500/10"
              }`}
            >
              {transaction.type === "income" ? (
                <IoArrowUp className="text-blue-500" size={18} />
              ) : (
                <IoArrowDown className="text-red-400" size={18} />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-gray-200">
                {transaction.title}
              </h4>
              <p className="text-sm text-gray-400">
                {formatDate(transaction.date)}
              </p>
            </div>
          </div>
          <span
            className={`text-lg font-bold ${
              transaction.type === "income" ? "text-blue-500" : "text-red-400"
            }`}
          >
            {transaction.type === "income" ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RecentTransactions;

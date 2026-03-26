import React from "react";
import { IoTrash } from "react-icons/io5";
import { formatCurrency, formatDate } from "../../utils/formatters";

const TransactionList = ({ transactions, onDelete, type }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No {type} found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      {transactions.map((transaction) => (
        <div
          key={transaction._id}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/2 border-b border-white/5 hover:bg-white/4 transition-all duration-150 group gap-4"
        >
          <div className="flex-1 w-full">
            <h4 className="font-semibold text-gray-200 wrap-break-word">
              {transaction.title}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-400">
                {transaction.category}
              </span>
              <span className="text-sm text-gray-600">•</span>
              <span className="text-sm text-gray-400">
                {formatDate(transaction.date)}
              </span>
            </div>
            {transaction.description && (
              <p className="text-sm text-gray-500 mt-1 wrap-break-word">
                {transaction.description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
            <span
              className={`text-lg font-bold ${
                type === "income" ? "text-blue-500" : "text-red-400"
              }`}
            >
              {type === "income" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </span>
            <button
              onClick={() => onDelete(transaction._id)}
              className="text-gray-500 hover:text-red-400 sm:opacity-0 group-hover:opacity-100 transition-all duration-150 p-2 hover:bg-red-500/10 rounded-lg"
            >
              <IoTrash size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;

import { useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Button from "../../components/ui/Button";
import MonthYearSelector from "../../components/ui/MonthYearSelector";
import {
  useGetMonthlySummary,
  useGetAllMonthlySummaries,
  useRecalculateSummary
} from "../../hooks/queries/useMonthlySummary";
import { formatCurrency } from "../../utils/formatters";

const ProfitSummary = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("single"); // 'single' or 'all'

  // Queries
  const { data: summary, isLoading: isLoadingSingle } = useGetMonthlySummary(month, year);
  
  // Only enable the "All Summaries" query if the user is in "all" viewmode to save requests
  const { data: allSummaries = [], isLoading: isLoadingAll } = useGetAllMonthlySummaries(viewMode === "all");

  const loading = viewMode === "single" ? isLoadingSingle : isLoadingAll;

  // Mutations
  const recalculateMutation = useRecalculateSummary();
  const recalculating = recalculateMutation.isPending;

  const handleRecalculate = () => {
    setError("");
    recalculateMutation.mutate({ month, year }, {
      onSuccess: () => {
        setError("✓ Summary recalculated successfully!");
        setTimeout(() => setError(""), 3000);
      },
      onError: (err) => {
        console.error("Error recalculating:", err);
        setError("Failed to recalculate summary");
      }
    });
  };

  const handleMonthYearChange = (newMonth, newYear) => {
    setMonth(newMonth);
    setYear(newYear);
  };

  const getMonthName = (monthNum) => {
    return new Date(2000, monthNum - 1).toLocaleDateString("en-US", {
      month: "long",
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
            Profit Summary
          </h1>
          <p className="text-gray-400 mt-1">
            View monthly profit and financial overview
          </p>
        </div>

        {error && (
          <div
            className={`border px-4 py-3 rounded-xl mb-4 text-sm font-medium ${
              error.startsWith("✓")
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {error}
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="bg-[#1a1d24] p-1 rounded-2xl border border-white/6 shadow-lg mb-6 max-w-sm mx-auto md:mx-0">
          <div className="flex">
            <button
              onClick={() => setViewMode("single")}
              className={`px-6 py-2 rounded-xl font-medium transition-all flex-1 ${
                viewMode === "single"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              Single Month
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`px-6 py-2 rounded-xl font-medium transition-all flex-1 ${
                viewMode === "all"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              All Months
            </button>
          </div>
        </div>

        {viewMode === "single" ? (
          <>
            {/* Month/Year Selector */}
            <div className="bg-[#1a1d24] p-4 md:p-6 rounded-2xl border border-white/6 shadow-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex justify-center w-full md:w-auto">
                <MonthYearSelector
                  onSelect={handleMonthYearChange}
                  initialMonth={month}
                  initialYear={year}
                />
              </div>
              <Button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="w-full md:w-auto px-8"
              >
                {recalculating ? "Recalculating..." : "Recalculate"}
              </Button>
            </div>

            {loading ? (
              <div className="bg-[#1a1d24] p-12 rounded-2xl border border-white/6 shadow-lg text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading summary...</p>
              </div>
            ) : summary ? (
              <>
                {/* Profit Card */}
                <div
                  className={`p-10 rounded-2xl border border-white/6 shadow-xl mb-6 relative overflow-hidden flex flex-col justify-center items-center text-center ${
                    summary.profit >= 0
                      ? "bg-blue-500/10 border-blue-500/50"
                      : "bg-red-500/10 border-red-500/50"
                  }`}
                >
                  {/* Decorative background glow */}
                  <div
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 blur-[100px] opacity-20 pointer-events-none ${
                      summary.profit >= 0 ? "bg-blue-500" : "bg-red-500"
                    }`}
                  />

                  <p className="text-gray-400 text-lg relative z-10">
                    {getMonthName(summary.month)} {summary.year} Profit
                  </p>
                  <p
                    className={`text-6xl font-black mt-2 tracking-tight relative z-10 ${
                      summary.profit >= 0 ? "text-blue-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(Math.abs(summary.profit))}
                  </p>
                  <div
                    className={`mt-4 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider relative z-10 ${
                      summary.profit >= 0
                        ? "bg-blue-400/20 text-blue-400"
                        : "bg-red-400/20 text-red-400"
                    }`}
                  >
                    {summary.profit >= 0 ? "Net Profit" : "Net Loss"}
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-[#1a1d24] p-6 rounded-2xl border border-white/6 shadow-lg flex flex-col justify-center items-center text-center">
                    <p className="text-gray-500 text-sm font-medium">
                      Total Income
                    </p>
                    <p className="text-3xl font-bold text-blue-400 mt-2">
                      {formatCurrency(summary.totalIncome)}
                    </p>
                  </div>
                  <div className="bg-[#1a1d24] p-6 rounded-2xl border border-white/6 shadow-lg flex flex-col justify-center items-center text-center">
                    <p className="text-gray-500 text-sm font-medium">
                      Total Expenses
                    </p>
                    <p className="text-3xl font-bold text-red-400 mt-2">
                      {formatCurrency(summary.totalExpenses)}
                    </p>
                  </div>
                  <div className="bg-[#1a1d24] p-6 rounded-2xl border border-white/6 shadow-lg flex flex-col justify-center items-center text-center">
                    <p className="text-gray-500 text-sm font-medium">
                      Total Salaries
                    </p>
                    <p className="text-3xl font-bold text-gray-300 mt-2">
                      {formatCurrency(summary.totalSalaries)}
                    </p>
                  </div>
                </div>

                {/* Income Breakdown */}
                <div className="bg-[#1a1d24] p-6 rounded-2xl border border-white/6 shadow-lg mb-6 flex flex-col justify-center items-center">
                  <h3 className="text-xl font-bold text-gray-100 mb-6">
                    Income Breakdown
                  </h3>
                  <div className="grid grid-cols-1 gap-4 w-full">
                    <div className="p-5 bg-gray-500/5 border border-gray-500/10 rounded-2xl w-full text-center">
                      <p className="text-gray-400 font-medium">
                        Monthly Collections
                      </p>
                      <p className="text-3xl font-bold text-blue-400 mt-1">
                        {formatCurrency(
                          summary.incomeBreakdown.monthlyCollections,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-[#1a1d24] p-6 rounded-2xl border border-white/6 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-100 mb-6 flex justify-center">
                    Expense Breakdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries({
                      Transportation: summary.expenseBreakdown.Transportation,
                      Repair: summary.expenseBreakdown.Repair,
                      Equipment: summary.expenseBreakdown.Equipment,
                      "Regular Expenses":
                        summary.expenseBreakdown.regularExpenses,
                    }).map(([label, value]) => (
                      <div
                        key={label}
                        className="p-5 bg-white/2 border border-white/5 rounded-2xl hover:bg-white/4 transition-colors"
                      >
                        <p className="text-gray-500 text-sm font-medium mb-1">
                          {label}
                        </p>
                        <p className="text-2xl font-bold text-gray-200">
                          {formatCurrency(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#1a1d24] p-12 rounded-2xl border border-white/6 shadow text-center text-gray-500">
                No data available for this month
              </div>
            )}
          </>
        ) : (
          /* All Months View */
          <div className="bg-[#1a1d24] rounded-2xl border border-white/6 shadow-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading summaries...</p>
              </div>
            ) : allSummaries.length === 0 ? (
              <div className="p-12 text-center text-gray-500 italic">
                No summaries available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/6">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Income
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Expenses
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Salaries
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Profit/Loss
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {allSummaries.map((s) => (
                      <tr
                        key={`${s.month}-${s.year}`}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-200">
                            {getMonthName(s.month)} {s.year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-emerald-400">
                            {formatCurrency(s.totalIncome)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-red-400">
                            {formatCurrency(s.totalExpenses)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-400">
                            {formatCurrency(s.totalSalaries)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`text-sm font-black ${
                              s.profit >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {formatCurrency(Math.abs(s.profit))}
                            {s.profit >= 0 ? " ↑" : " ↓"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfitSummary;

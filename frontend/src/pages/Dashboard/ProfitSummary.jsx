import { useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import MonthYearSelector from "../../components/ui/MonthYearSelector";
import {
  useGetMonthlySummary,
  useGetAllMonthlySummaries,
  useRecalculateSummary
} from "../../hooks/queries/useMonthlySummary";
import { formatCurrency } from "../../utils/formatters";

const ProfitSummary = () => {
  const { t, i18n } = useTranslation();
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
        setError(t("performance.success_recalc"));
        setTimeout(() => setError(""), 3000);
      },
      onError: (err) => {
        console.error("Error recalculating:", err);
        setError(t("common.error_process"));
      }
    });
  };

  const handleMonthYearChange = (newMonth, newYear) => {
    setMonth(newMonth);
    setYear(newYear);
  };

  const getMonthName = (monthNum) => {
    return new Date(2000, monthNum - 1).toLocaleDateString(i18n.language === "ar" ? "ar-EG" : "en-US", {
      month: "long",
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-[1440px] mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 text-center md:text-left rtl:md:text-right">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">
              {t("performance.main_title")} <span className="text-gray-500">{t("performance.financial")}</span>
            </h1>
            <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-[0.2em]">
              {t("performance.subtitle")}
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-[#09090c] p-1 rounded-xl border border-white/5 shadow-2xl inline-flex self-center md:self-auto">
            <button
              onClick={() => setViewMode("single")}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === "single"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t("performance.period_audit")}
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === "all"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t("performance.historical")}
            </button>
          </div>
        </div>

        {error && (
          <div
            className={`border px-6 py-4 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-widest animate-pulse ${
              error.startsWith("✓")
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                : "bg-red-500/10 border-red-500/20 text-red-500"
            }`}
          >
            {error}
          </div>
        )}

        {viewMode === "single" ? (
          <div className="space-y-8">
            {/* Month/Year Selector */}
            <div className="bg-[#0e0e12] p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 rtl:mr-1 rtl:ml-0">
                  {t("common.filter")}
                </label>
                <MonthYearSelector
                  onSelect={handleMonthYearChange}
                  initialMonth={month}
                  initialYear={year}
                />
              </div>
              <Button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="w-full md:w-auto px-10 py-4 font-black uppercase tracking-[0.2em]"
              >
                {recalculating ? t("performance.calibrating") : t("performance.recalculate")}
              </Button>
            </div>

            {loading ? (
              <div className="bg-[#0e0e12] p-24 rounded-2xl border border-white/5 shadow-2xl text-center">
                <div className="w-12 h-12 border-2 border-white/5 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {t("performance.loading")}
                </p>
              </div>
            ) : summary ? (
              <>
                {/* Profit Card */}
                <div
                  className={`p-12 md:p-16 rounded-2xl border shadow-2xl relative overflow-hidden flex flex-col justify-center items-center text-center transition-all duration-500 ${
                    summary.profit >= 0
                      ? "bg-blue-600/3 border-blue-500/20"
                      : "bg-red-600/3 border-red-500/20"
                  }`}
                >
                  <div
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] blur-[150px] opacity-10 pointer-events-none ${
                      summary.profit >= 0 ? "bg-blue-500" : "bg-red-500"
                    }`}
                  />

                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] relative z-10 mb-4">
                    {t("performance.net_result", { month: getMonthName(summary?.month), year: summary?.year })}
                  </p>
                  <p
                    className={`text-7xl font-black mt-2 tracking-tighter relative z-10 transition-all ${
                      (summary?.profit || 0) >= 0 ? "text-white" : "text-red-500"
                    }`}
                  >
                    {formatCurrency(Math.abs(summary?.profit || 0))}
                  </p>
                  <div
                    className={`mt-8 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] relative z-10 border shadow-lg ${
                      (summary?.profit || 0) >= 0
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                        : "bg-red-500/10 border-red-500/20 text-red-500"
                    }`}
                  >
                    {(summary?.profit || 0) >= 0 ? t("performance.surplus") : t("performance.deficit")}
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: t("performance.stats.receipts"), value: summary?.totalIncome || 0, color: "text-blue-500" },
                    { label: t("performance.stats.burn"), value: summary?.totalExpenses || 0, color: "text-red-500" },
                    { label: t("performance.stats.payroll"), value: summary?.totalSalaries || 0, color: "text-gray-300" }
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#0e0e12] p-8 rounded-2xl border border-white/5 shadow-2xl group hover:border-white/10 transition-all flex flex-col items-center text-center">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                        {stat.label}
                      </p>
                      <p className={`text-4xl font-black ${stat.color} group-hover:scale-105 transition-transform`}>
                        {formatCurrency(stat.value)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Income Breakdown */}
                  <div className="bg-[#0e0e12] p-8 rounded-2xl border border-white/5 shadow-2xl">
                    <h3 className="text-[10px] font-black text-white mb-8 uppercase tracking-[0.3em] border-b border-white/5 pb-4 text-center">
                      {t("performance.distribution.revenue")}
                    </h3>
                    <div className="p-8 bg-[#09090c] border border-white/5 rounded-2xl text-center group">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                        {t("performance.distribution.collections")}
                      </p>
                      <p className="text-4xl font-black text-blue-500 group-hover:scale-105 transition-transform">
                        {formatCurrency(summary?.incomeBreakdown?.monthlyCollections || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Expense Breakdown */}
                  <div className="bg-[#0e0e12] p-8 rounded-2xl border border-white/5 shadow-2xl">
                    <h3 className="text-[10px] font-black text-white mb-8 uppercase tracking-[0.3em] border-b border-white/5 pb-4 text-center">
                      {t("performance.distribution.attribution")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries({
                        [t("performance.distribution.logistics")]: summary?.expenseBreakdown?.Transportation || 0,
                        [t("performance.distribution.maintenance")]: summary?.expenseBreakdown?.Repair || 0,
                        [t("performance.distribution.infrastructure")]: summary?.expenseBreakdown?.Equipment || 0,
                        [t("performance.distribution.general")]: summary?.expenseBreakdown?.regularExpenses || 0,
                      }).map(([label, value]) => (
                        <div
                          key={label}
                          className="p-6 bg-[#09090c] border border-white/5 rounded-2xl hover:bg-white/3 transition-all group"
                        >
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                            {label}
                          </p>
                          <p className="text-2xl font-black text-gray-200 group-hover:text-white transition-colors">
                            {formatCurrency(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#0e0e12] p-24 rounded-2xl border border-white/5 shadow-2xl text-center">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">
                  {t("performance.no_data")}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* All Months View */
          <div className="bg-[#0e0e12] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
            {loading ? (
              <div className="p-24 text-center">
                <div className="w-12 h-12 border-2 border-white/5 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {t("performance.loading")}
                </p>
              </div>
            ) : allSummaries.length === 0 ? (
              <div className="p-24 text-center">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">
                  {t("performance.no_historical")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-white/2 border-b border-white/5">
                      <th className="px-8 py-5 text-left rtl:text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        {t("performance.table.period")}
                      </th>
                      <th className="px-8 py-5 text-right rtl:text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        {t("performance.table.income")}
                      </th>
                      <th className="px-8 py-5 text-right rtl:text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        {t("performance.table.operational")}
                      </th>
                      <th className="px-8 py-5 text-right rtl:text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        {t("performance.table.salaries")}
                      </th>
                      <th className="px-8 py-5 text-right rtl:text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        {t("performance.table.margin")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allSummaries.map((s) => (
                      <tr
                        key={`${s.month}-${s.year}`}
                        className="hover:bg-white/2 transition-colors group"
                      >
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-sm font-bold text-white group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform inline-block uppercase tracking-tight">
                            {getMonthName(s.month)} {s.year}
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right rtl:text-left text-sm font-black text-blue-500">
                          {formatCurrency(s.totalIncome)}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right rtl:text-left text-sm font-bold text-red-500">
                          {formatCurrency(s.totalExpenses)}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right rtl:text-left text-sm font-bold text-gray-400">
                          {formatCurrency(s.totalSalaries)}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right rtl:text-left">
                          <div
                            className={`text-sm font-black inline-flex items-center gap-2 ${
                              s.profit >= 0
                                ? "text-blue-500"
                                : "text-red-500"
                            }`}
                          >
                            {formatCurrency(Math.abs(s.profit))}
                            <span className="text-[8px] uppercase">{s.profit >= 0 ? t("performance.surplus") : t("performance.deficit")}</span>
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

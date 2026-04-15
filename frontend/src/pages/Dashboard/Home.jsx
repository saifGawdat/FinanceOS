import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useTranslation } from "react-i18next";
import SummaryCard from "../../components/dashboard/SummaryCard";
import Card from "../../components/ui/Card";
import BarChart from "../../components/charts/BarChart";
import PieChart from "../../components/charts/PieChart";
import LineChart from "../../components/charts/LineChart";
import SavingsRateChart from "../../components/charts/SavingsRateChart";
import GoalsProgressChart from "../../components/charts/GoalsProgressChart";
import RecentTransactions from "../../components/dashboard/RecentTransactions";
import MonthYearSelector from "../../components/ui/MonthYearSelector";
import {
  useGetDashboardStats,
  useGetDashboardCharts,
  useGetDashboardRecent,
  useGetDashboardReceivables,
} from "../../hooks/queries/useDashboard";
import { useGetGoals } from "../../hooks/queries/useGoals";
import {
  IoCalendarOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoWalletOutline,
  IoAlertCircleOutline,
  IoReceiptOutline,
} from "react-icons/io5";

const Home = () => {
  const { t, i18n } = useTranslation();
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const { data: statsData, isLoading: isLoadingStats } = useGetDashboardStats(
    month,
    year,
  );
  const { data: chartDataData, isLoading: isLoadingCharts } =
    useGetDashboardCharts(month, year);
  const { data: recentTransactionsData, isLoading: isLoadingRecent } =
    useGetDashboardRecent(month, year);
  const { data: receivablesData, isLoading: isLoadingReceivables } =
    useGetDashboardReceivables();
  const { data: goalsData, isLoading: isLoadingGoals } = useGetGoals();

  const loading =
    isLoadingStats ||
    isLoadingCharts ||
    isLoadingRecent ||
    isLoadingGoals ||
    isLoadingReceivables;

  const stats = statsData || { totalIncome: 0, totalExpense: 0, balance: 0 };
  const chartData = chartDataData || {
    barChartData: [],
    pieChartData: [],
    lineChartData: [],
    incomePieChartData: [],
  };
  const recentTransactions = recentTransactionsData || [];
  const goals = goalsData || [];
  const receivables = receivablesData || {
    totalReceivables: 0,
    overdueReceivables: 0,
    openInvoiceCount: 0,
    overdueInvoiceCount: 0,
  };

  const savingsRate =
    stats.totalIncome > 0
      ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100
      : 0;

  useEffect(() => {
    const handleRefresh = () => {};
    window.addEventListener("refreshData", handleRefresh);
    return () => {
      window.removeEventListener("refreshData", handleRefresh);
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-white/10" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            {t("home.loading")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-5 gap-8 ">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {t("home.title")}
            </h1>
          </div>
          <p className="text-gray-500 text-sm mt-1.5 font-medium">
            {t("home.subtitle")}{" "}
            <span className="text-blue-400">
              {new Date(year, month - 1).toLocaleDateString(t("common.locale_tag", { defaultValue: i18n.language === "ar" ? "ar-EG" : "en-US" }), {
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        </div>
        <div className="bg-[#0e0e12] p-1.5 rounded-2xl border border-white/5 shadow-xl shadow-black/40">
          <MonthYearSelector
            onSelect={(m, y) => {
              setMonth(m);
              setYear(y);
            }}
            initialMonth={month}
            initialYear={year}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <SummaryCard
          title={t("home.stats.balance")}
          amount={stats.balance}
          icon={IoWalletOutline}
          iconColor="text-white"
          bgGradient="white"
          highlight={true}
        />
        <SummaryCard
          title={t("home.stats.income")}
          amount={stats.totalIncome}
          icon={IoTrendingUpOutline}
          iconColor="text-blue-400"
          bgGradient="from-blue-500 to-blue-600"
        />
        <SummaryCard
          title={t("home.stats.expenses")}
          amount={stats.totalExpense}
          icon={IoTrendingDownOutline}
          iconColor="text-red-400"
          bgGradient="from-red-500 to-red-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <SummaryCard
          title="Receivables"
          amount={receivables.totalReceivables}
          icon={IoReceiptOutline}
          iconColor="text-amber-400"
          bgGradient="from-blue-500 to-blue-500"
        />
        <SummaryCard
          title="Overdue AR"
          amount={receivables.overdueReceivables}
          icon={IoAlertCircleOutline}
          iconColor="text-orange-400"
          bgGradient="from-red-500 to-red-600"
        />
      </div>

      {/* Charts Section */}
      <div className="space-y-6 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title={t("home.charts.revenue")} subtitle={t("home.charts.revenue_sub")}>
            <BarChart data={chartData.barChartData} />
          </Card>
          <Card title={t("home.charts.distribution")} subtitle={t("home.charts.distribution_sub")}>
            <PieChart data={chartData.pieChartData} />
          </Card>
          <Card title={t("home.charts.savings")} subtitle={t("home.charts.savings_sub")}>
            <SavingsRateChart rate={savingsRate} />
          </Card>
        </div>

        <Card title={t("home.charts.growth")} subtitle={t("home.charts.growth_sub")}>
          <LineChart data={chartData.lineChartData} />
        </Card>
      </div>

      {/* Bottom Grid: Recent Transactions & New Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card
            title={t("home.charts.recent")}
            subtitle={t("home.charts.recent_sub")}
            className="h-full"
          >
            <RecentTransactions transactions={recentTransactions} />
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card
            title={t("home.charts.sources")}
            subtitle={t("home.charts.sources_sub")}
            className="h-full"
          >
            <div className="h-full">
              <PieChart data={chartData.incomePieChartData} />
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card
            title={t("home.charts.goals")}
            subtitle={t("home.charts.goals_sub")}
            className="h-full"
          >
            <GoalsProgressChart goals={goals} limit={6} height={220} />
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <Card
          title="Receivables Pulse"
          subtitle="Open invoice count, overdue count, and outstanding exposure"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">
                Open invoices
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {receivables.openInvoiceCount}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">
                Overdue invoices
              </p>
              <p className="mt-2 text-2xl font-black text-red-400">
                {receivables.overdueInvoiceCount}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">
                Outstanding AR
              </p>
              <p className="mt-2 text-xl font-black text-blue-400">
                {new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: "GBP",
                }).format(receivables.totalReceivables || 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Home;

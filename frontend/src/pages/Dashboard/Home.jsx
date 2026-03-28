import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import SummaryCard from "../../components/dashboard/SummaryCard";
import Card from "../../components/ui/Card";
import BarChart from "../../components/charts/BarChart";
import PieChart from "../../components/charts/PieChart";
import LineChart from "../../components/charts/LineChart";
import SavingsRateChart from "../../components/charts/SavingsRateChart";
import RecentTransactions from "../../components/dashboard/RecentTransactions";
import MonthYearSelector from "../../components/ui/MonthYearSelector";
import {
  useGetDashboardStats,
  useGetDashboardCharts,
  useGetDashboardRecent,
} from "../../hooks/queries/useDashboard";
import {
  IoCalendarOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoWalletOutline,
} from "react-icons/io5";

const Home = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());


  const { data: statsData, isLoading: isLoadingStats } = useGetDashboardStats(month, year);
  const { data: chartDataData, isLoading: isLoadingCharts } = useGetDashboardCharts(month, year);
  const { data: recentTransactionsData, isLoading: isLoadingRecent } = useGetDashboardRecent(month, year);

  const loading = isLoadingStats || isLoadingCharts || isLoadingRecent;

  const stats = statsData || { totalIncome: 0, totalExpense: 0, balance: 0 };
  const chartData = chartDataData || { barChartData: [], pieChartData: [], lineChartData: [], incomePieChartData: [] };
  const recentTransactions = recentTransactionsData || [];

  const savingsRate = stats.totalIncome > 0 
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
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">Loading FinanceOS</p>
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
                Dashboard Overview
              </h1>
            </div>
            <p className="text-gray-500 text-sm mt-1.5 font-medium">
              Projected summary for{" "}
              <span className="text-blue-400">
                {new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </p>
          </div>
          <div className="bg-[#0e0e12] p-1.5 rounded-2xl border border-white/5 shadow-xl shadow-black/40">
            <MonthYearSelector
              onSelect={(m, y) => { setMonth(m); setYear(y); }}
              initialMonth={month}
              initialYear={year}
            />
          </div>
        </div>

      {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <SummaryCard
          title="Total Balance"
          amount={stats.balance}
          icon={IoWalletOutline}
          iconColor="text-white"
          bgGradient="white"
          highlight={true}
        />
        <SummaryCard
          title="Total Income"
          amount={stats.totalIncome}
          icon={IoTrendingUpOutline}
          iconColor="text-blue-400"
          bgGradient="from-blue-500 to-blue-600"
        />
        <SummaryCard
          title="Total Expenses"
          amount={stats.totalExpense}
          icon={IoTrendingDownOutline}
          iconColor="text-red-400"
          bgGradient="from-red-500 to-red-600"
        />
      </div>

      {/* Charts Section */}
      <div className="space-y-6 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Revenue vs Expenses" subtitle="Monthly flow comparison">
            <BarChart data={chartData.barChartData} />
          </Card>
          <Card title="Distribution" subtitle="Spending by category">
            <PieChart data={chartData.pieChartData} />
          </Card>
          <Card title="Savings Rate" subtitle="Percentage of income retained">
             <SavingsRateChart rate={savingsRate} />
          </Card>
        </div>

        <Card title="Financial Growth" subtitle="Income and expense timeline">
          <LineChart data={chartData.lineChartData} />
        </Card>
      </div>

      {/* Bottom Grid: Recent Transactions & New Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card title="Recent Transactions" subtitle="Latest movement across all accounts" className="h-full">
            <RecentTransactions transactions={recentTransactions} />
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card title="Income Sources" subtitle="Revenue breakdown by category" className="h-full">
            <div className="h-full">
              <PieChart data={chartData.incomePieChartData} />
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card title="Spending Rankings" subtitle="Highest expense categories" className="h-full">
            <div className="space-y-4">
              {chartData.pieChartData.slice(0, 10).map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-white/3 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-400 text-xs font-bold uppercase">{item.name}</span>
                  <span className="text-white text-sm font-black tracking-tight font-mono">
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(item.value)}
                  </span>
                </div>
              ))}
              {chartData.pieChartData.length === 0 && (
                <p className="text-gray-600 text-xs italic text-center py-10">No spending data for this period</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};


export default Home;

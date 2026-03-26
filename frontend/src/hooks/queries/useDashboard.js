import { useQuery } from "@tanstack/react-query";

import API from "../../api/axios";

// Extend queryKeys internally for dashboard data
export const dashboardKeys = {
  all: ["dashboard"],
  stats: (month, year) => ["dashboard", "stats", month, year],
  charts: (month, year) => ["dashboard", "charts", month, year],
  recent: (month, year) => ["dashboard", "recent", month, year],
};

const fetchStats = async (month, year) => {
  const { data } = await API.get("/dashboard/stats", { params: { month, year } });
  return data;
};

const fetchChartData = async (month, year) => {
  const { data } = await API.get("/dashboard/chart-data", { params: { month, year } });
  return data;
};

const fetchRecentTransactions = async (month, year) => {
  const { data } = await API.get("/dashboard/recent", { params: { month, year } });
  return data;
};

// --- Queries ---

export const useGetDashboardStats = (month, year) => {
  return useQuery({
    queryKey: dashboardKeys.stats(month, year),
    queryFn: () => fetchStats(month, year),
    staleTime: 0,
    enabled: !!month && !!year,
  });
};

export const useGetDashboardCharts = (month, year) => {
  return useQuery({
    queryKey: dashboardKeys.charts(month, year),
    queryFn: () => fetchChartData(month, year),
    staleTime: 0,
    enabled: !!month && !!year,
  });
};

export const useGetDashboardRecent = (month, year) => {
  return useQuery({
    queryKey: dashboardKeys.recent(month, year),
    queryFn: () => fetchRecentTransactions(month, year),
    staleTime: 0,
    enabled: !!month && !!year,
  });
};

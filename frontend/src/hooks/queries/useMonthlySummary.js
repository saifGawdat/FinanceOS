import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import {
  getMonthlySummary,
  getAllMonthlySummaries,
  recalculateMonthlySummary,
} from "../../api/monthlySummary";

// --- Queries ---

export const useGetMonthlySummary = (month, year) => {
  return useQuery({
    queryKey: queryKeys.monthlySummary.detail(month, year),
    queryFn: () => getMonthlySummary(month, year),
    staleTime: 0, // Enforce zero staleness for financial data
    enabled: !!month && !!year,
  });
};

export const useGetAllMonthlySummaries = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.monthlySummary.all,
    queryFn: getAllMonthlySummaries,
    staleTime: 0,
    enabled,
  });
};

// --- Mutations ---

export const useRecalculateSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ month, year }) => recalculateMonthlySummary(month, year),
    onSuccess: (_, variables) => {
      // Invalidate both the specific summary and the all-summaries list
      queryClient.invalidateQueries({
        queryKey: queryKeys.monthlySummary.detail(variables.month, variables.year),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.monthlySummary.all,
      });
    },
  });
};

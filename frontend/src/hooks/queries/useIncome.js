import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { getIncomes } from "../../api/income";
import API from "../../api/axios";

// --- Queries ---

export const useGetIncomes = ({ month, year, page = 1, limit = 10 }) => {
  return useQuery({
    queryKey: queryKeys.income.list({ month, year, page, limit }),
    queryFn: () => getIncomes(month, year, page, limit),
    staleTime: 0, // Enforce zero staleness for financial data
    keepPreviousData: true, // Smoother pagination UX
  });
};

// --- Mutations ---

export const useAddIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => API.post("/income", formData),
    onSuccess: () => {
      // Invalidate ALL income lists and the monthly dashboard summaries strictly
      queryClient.invalidateQueries({ queryKey: queryKeys.income.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummary.all });
    },
  });
};

export const useDeleteIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => API.delete(`/income/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.income.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummary.all });
    },
  });
};

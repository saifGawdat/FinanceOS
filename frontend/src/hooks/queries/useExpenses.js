import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { getExpenses } from "../../api/expense";
import API from "../../api/axios";
import {
  getExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory,
  getUniqueCategories,
  copyPreviousMonthCategories,
} from "../../api/expenseCategory";

// --- Queries ---

export const useGetExpenses = ({ month, year, page = 1, limit = 10 }) => {
  return useQuery({
    queryKey: queryKeys.expenses.list({ month, year, page, limit }),
    queryFn: () => getExpenses(month, year, page, limit),
    staleTime: 0, // Enforce zero staleness for financial data
    keepPreviousData: true, // Smoother pagination UX
  });
};

export const useGetExpenseCategories = (month, year) => {
  return useQuery({
    queryKey: queryKeys.expenses.categories(month, year),
    queryFn: () => getExpenseCategories(month, year),
    staleTime: 0,
    enabled: !!month && !!year,
  });
};

export const useGetUniqueExpenseCategories = () => {
  return useQuery({
    queryKey: queryKeys.expenses.uniqueCategories,
    queryFn: getUniqueCategories,
    staleTime: 0,
  });
};

// --- Mutations ---

export const useAddExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => API.post("/expense", formData),
    onSuccess: () => {
      // Invalidate ALL expense lists and the monthly dashboard summaries strictly
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummary.all });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => API.delete(`/expense/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummary.all });
    },
  });
};

export const useAddExpenseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExpenseCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummary.all });
    },
  });
};

export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpenseCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummary.all });
    },
  });
};

export const useCopyPreviousMonthCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ month, year }) => copyPreviousMonthCategories(month, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
};

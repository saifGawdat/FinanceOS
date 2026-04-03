import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import {
  getRecurring,
  createRecurring,
  updateRecurring,
  toggleRecurring,
  deleteRecurring,
} from "../../api/recurring";

export const useGetRecurring = () =>
  useQuery({
    queryKey: queryKeys.recurring.list(),
    queryFn: getRecurring,
    staleTime: 0,
  });

export const useCreateRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createRecurring(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all }),
  });
};

export const useUpdateRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateRecurring(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all }),
  });
};

export const useToggleRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => toggleRecurring(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all }),
  });
};

export const useDeleteRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteRecurring(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all }),
  });
};

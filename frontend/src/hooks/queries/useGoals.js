import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
} from "../../api/goals";

export const useGetGoals = () => {
  return useQuery({
    queryKey: queryKeys.goals.list(),
    queryFn: getGoals,
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.list() });
    },
  });
};

export const useGetGoalById = (id) => {
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: () => getGoalById(id),
    enabled: !!id, 
  });
};


export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, goal }) => updateGoal(id, goal),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.list() });
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.list() });
      queryClient.removeQueries({ queryKey: queryKeys.goals.detail(id) });
    },
  });
};

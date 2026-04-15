import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { invoiceAPI } from "../../api/invoice";

export const useGetInvoices = (filters) =>
  useQuery({
    queryKey: queryKeys.invoices.list(filters),
    queryFn: () => invoiceAPI.getInvoices(filters),
    staleTime: 0,
    keepPreviousData: true,
  });

export const useGetInvoice = (id) =>
  useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => invoiceAPI.getInvoice(id),
    enabled: !!id,
    staleTime: 0,
  });

export const useGetInvoiceSummary = () =>
  useQuery({
    queryKey: queryKeys.invoices.summary,
    queryFn: invoiceAPI.getSummary,
    staleTime: 0,
  });

export const useGetInvoiceAging = () =>
  useQuery({
    queryKey: queryKeys.invoices.aging,
    queryFn: invoiceAPI.getAging,
    staleTime: 0,
  });

const invalidateInvoiceData = (queryClient, invoiceId) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.income.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummary.all });
  if (invoiceId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.invoices.detail(invoiceId),
    });
  }
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invoiceAPI.createInvoice,
    onSuccess: () => invalidateInvoiceData(queryClient),
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => invoiceAPI.updateInvoice(id, payload),
    onSuccess: (_, variables) => invalidateInvoiceData(queryClient, variables.id),
  });
};

export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invoiceAPI.sendInvoice,
    onSuccess: (_, invoiceId) => invalidateInvoiceData(queryClient, invoiceId),
  });
};

export const useRecordInvoicePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => invoiceAPI.recordPayment(id, payload),
    onSuccess: (_, variables) => invalidateInvoiceData(queryClient, variables.id),
  });
};

export const useCancelInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invoiceAPI.cancelInvoice,
    onSuccess: (_, invoiceId) => invalidateInvoiceData(queryClient, invoiceId),
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionsService } from '../services/transactions'
import type { Transaction } from '../types'

export function useTransactions(clientId: string) {
  return useQuery({
    queryKey: ['transactions', clientId],
    queryFn: () => transactionsService.getByClientId(clientId),
    enabled: !!clientId,
  })
}

export function useClientKPIs(clientId: string) {
  return useQuery({
    queryKey: ['client-kpis', clientId],
    queryFn: () => transactionsService.getClientKPIs(clientId),
    enabled: !!clientId,
  })
}

export function useBalanceSummary(clientId: string) {
  return useQuery({
    queryKey: ['balance-summary', clientId],
    queryFn: () => transactionsService.getBalanceSummary(clientId),
    enabled: !!clientId,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: transactionsService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', data.client_id] })
      queryClient.invalidateQueries({ queryKey: ['client-kpis', data.client_id] })
      queryClient.invalidateQueries({ queryKey: ['balance-summary', data.client_id] })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Transaction, 'id' | 'created_at'>> }) =>
      transactionsService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', data.client_id] })
      queryClient.invalidateQueries({ queryKey: ['client-kpis', data.client_id] })
      queryClient.invalidateQueries({ queryKey: ['balance-summary', data.client_id] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: transactionsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['client-kpis'] })
      queryClient.invalidateQueries({ queryKey: ['balance-summary'] })
    },
  })
}
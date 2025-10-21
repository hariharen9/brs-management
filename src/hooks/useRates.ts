import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ratesService } from '../services/rates'
import type { Rate, WorkType, Unit } from '../types'

export function useRates() {
  return useQuery({
    queryKey: ['rates'],
    queryFn: ratesService.getAll,
  })
}

export function useClientRates(clientId: string) {
  return useQuery({
    queryKey: ['rates', 'client', clientId],
    queryFn: () => ratesService.getByClientId(clientId),
    enabled: !!clientId,
  })
}

export function useRateForTransaction(
  clientId: string,
  component: string,
  workType: WorkType,
  unit: Unit
) {
  return useQuery({
    queryKey: ['rates', 'lookup', clientId, component, workType, unit],
    queryFn: () => ratesService.getRateForTransaction(clientId, component, workType, unit),
    enabled: !!(clientId && component && workType && unit),
  })
}

export function useCreateRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ratesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rates'] })
    },
  })
}

export function useUpdateRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Rate, 'id' | 'created_at'>> }) =>
      ratesService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rates'] })
    },
  })
}

export function useDeleteRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ratesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rates'] })
    },
  })
}

export function useUniqueComponents(clientId?: string) {
  return useQuery({
    queryKey: ['unique-components', clientId || 'all'],
    queryFn: () => ratesService.getUniqueComponents(clientId),
    // Always enabled - if no clientId, get all components
  })
}

export function useAllUniqueComponents() {
  return useQuery({
    queryKey: ['unique-components', 'all'],
    queryFn: () => ratesService.getUniqueComponents(),
  })
}
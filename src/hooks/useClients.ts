import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsService } from '../services/clients'
import type { Client } from '../types'

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getAll,
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: clientsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Client, 'id' | 'created_at'>> }) =>
      clientsService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', data.id] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: clientsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useRealtimeSubscription() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Subscribe to transactions changes
    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          console.log('Transaction change detected:', payload)
          
          // Invalidate all transaction-related queries
          queryClient.invalidateQueries({ queryKey: ['transactions'] })
          queryClient.invalidateQueries({ queryKey: ['client-kpis'] })
          queryClient.invalidateQueries({ queryKey: ['balance-summary'] })
          
          // Show a toast notification (you can add a toast library later)
          console.log('Data updated in real-time!')
        }
      )
      .subscribe()

    // Subscribe to rates changes
    const ratesChannel = supabase
      .channel('rates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rates',
        },
        (payload) => {
          console.log('Rate change detected:', payload)
          queryClient.invalidateQueries({ queryKey: ['rates'] })
        }
      )
      .subscribe()

    // Subscribe to clients changes
    const clientsChannel = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
        },
        (payload) => {
          console.log('Client change detected:', payload)
          queryClient.invalidateQueries({ queryKey: ['clients'] })
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(transactionsChannel)
      supabase.removeChannel(ratesChannel)
      supabase.removeChannel(clientsChannel)
    }
  }, [queryClient])
}
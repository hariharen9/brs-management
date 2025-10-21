import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analytics'

export function useClientAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'clients'],
    queryFn: analyticsService.getClientAnalytics,
  })
}

export function useMonthlyTrends() {
  return useQuery({
    queryKey: ['analytics', 'monthly-trends'],
    queryFn: analyticsService.getMonthlyTrends,
  })
}

export function useComponentAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'components'],
    queryFn: analyticsService.getComponentAnalytics,
  })
}

export function useWorkTypeAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'work-types'],
    queryFn: analyticsService.getWorkTypeAnalytics,
  })
}

export function useOverallStats() {
  return useQuery({
    queryKey: ['analytics', 'overall-stats'],
    queryFn: analyticsService.getOverallStats,
  })
}
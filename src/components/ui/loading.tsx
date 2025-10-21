import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  )
}

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingState({ 
  message = 'Loading...', 
  size = 'md',
  className 
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4 py-8', className)}>
      <LoadingSpinner size={size} className="text-blue-600" />
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  )
}

interface TableLoadingProps {
  rows?: number
  columns?: number
}

export function TableLoading({ rows = 5, columns = 4 }: TableLoadingProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="h-4 bg-gray-200 rounded animate-pulse flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface CardLoadingProps {
  count?: number
}

export function CardLoading({ count = 4 }: CardLoadingProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
          </div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      ))}
    </div>
  )
}
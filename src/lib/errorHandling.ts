import { toast } from '../hooks/useToast'

export interface AppError {
  message: string
  code?: string
  details?: any
}

export class DatabaseError extends Error {
  code: string
  details?: any

  constructor(message: string, code: string = 'DATABASE_ERROR', details?: any) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.details = details
  }
}

export class ValidationError extends Error {
  code: string
  details?: any

  constructor(message: string, code: string = 'VALIDATION_ERROR', details?: any) {
    super(message)
    this.name = 'ValidationError'
    this.code = code
    this.details = details
  }
}

export class NetworkError extends Error {
  code: string
  details?: any

  constructor(message: string, code: string = 'NETWORK_ERROR', details?: any) {
    super(message)
    this.name = 'NetworkError'
    this.code = code
    this.details = details
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  
  return 'An unexpected error occurred'
}

export function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code)
  }
  return undefined
}

export function handleError(error: unknown, context?: string): void {
  const message = getErrorMessage(error)
  const code = getErrorCode(error)
  
  console.error(`Error${context ? ` in ${context}` : ''}:`, error)
  
  // Show user-friendly error messages
  if (error instanceof ValidationError) {
    toast({
      variant: 'destructive',
      title: 'Validation Error',
      description: message,
    })
  } else if (error instanceof NetworkError) {
    toast({
      variant: 'destructive',
      title: 'Connection Error',
      description: 'Please check your internet connection and try again.',
    })
  } else if (error instanceof DatabaseError) {
    toast({
      variant: 'destructive',
      title: 'Database Error',
      description: 'There was a problem saving your data. Please try again.',
    })
  } else if (code === 'PGRST116') {
    // Supabase: No rows returned
    toast({
      variant: 'warning',
      title: '⚠️ No Data Found',
      description: 'The requested data could not be found.',
    })
  } else if (code === '23505') {
    // PostgreSQL: Unique constraint violation
    toast({
      variant: 'destructive',
      title: '❌ Duplicate Entry',
      description: 'This record already exists.',
    })
  } else if (code === '23503') {
    // PostgreSQL: Foreign key constraint violation
    toast({
      variant: 'destructive',
      title: '🚫 Cannot Delete',
      description: 'This record is being used by other data and cannot be deleted.',
    })
  } else {
    // Generic error
    toast({
      variant: 'destructive',
      title: '❌ Error',
      description: message || 'Something went wrong. Please try again.',
    })
  }
}

export function showSuccessToast(message: string, title?: string): void {
  toast({
    variant: 'success',
    title: title || '✅ Success',
    description: message,
  })
}

export function showWarningToast(message: string, title?: string): void {
  toast({
    variant: 'warning',
    title: title || '⚠️ Warning',
    description: message,
  })
}

export function showInfoToast(message: string, title?: string): void {
  toast({
    variant: 'default',
    title: title || 'ℹ️ Info',
    description: message,
  })
}

// Utility to wrap async functions with error handling
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, context)
      return undefined
    }
  }
}

// Utility for retrying failed operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError
}
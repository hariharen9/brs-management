import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./ui/toast"
import { useToast } from "../hooks/useToast"
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  const getIcon = (variant: string) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'destructive':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getProgressBarColor = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'bg-green-400'
      case 'destructive':
        return 'bg-red-400'
      case 'warning':
        return 'bg-yellow-400'
      default:
        return 'bg-blue-400'
    }
  }

  return (
    <ToastProvider duration={4000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start space-x-3 w-full">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(variant || 'default')}
              </div>
              <div className="flex-1 grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
              <div 
                className={`toast-progress h-full ${getProgressBarColor(variant || 'default')} rounded-b-lg transition-all duration-200`}
                style={{
                  animation: 'toast-progress 4s linear forwards'
                }}
              />
            </div>
            
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
import { AlertTriangle, Trash2, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'default'
  onConfirm: () => void
  isLoading?: boolean
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  isLoading = false
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const Icon = variant === 'destructive' ? Trash2 : Info
  const iconColor = variant === 'destructive' ? 'text-red-600' : 'text-blue-600'
  const bgColor = variant === 'destructive' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] shadow-2xl border-0">
        <DialogHeader>
          <DialogTitle className={`flex items-center space-x-2 ${variant === 'destructive' ? 'text-red-600' : 'text-blue-600'}`}>
            <Icon className="w-5 h-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className={`${bgColor} rounded-xl p-4 flex items-start space-x-3`}>
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${iconColor}`} />
          <div className="text-sm">
            <p className={`font-medium ${variant === 'destructive' ? 'text-red-800' : 'text-blue-800'}`}>
              {variant === 'destructive' ? 'This action cannot be undone' : 'Please confirm your action'}
            </p>
            <p className={`${variant === 'destructive' ? 'text-red-700' : 'text-blue-700'} mt-1`}>
              {variant === 'destructive' 
                ? 'This will permanently remove the data from the system.'
                : 'Make sure you want to proceed with this action.'
              }
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-6 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-6"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
            className={`rounded-lg px-6 ${
              variant === 'destructive'
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
            } shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
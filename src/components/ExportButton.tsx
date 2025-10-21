import { Download } from 'lucide-react'
import { Button } from './ui/button'

interface ExportButtonProps {
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function ExportButton({ 
  onClick, 
  variant = 'outline', 
  size = 'default',
  className = '' 
}: ExportButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={`flex items-center space-x-1 sm:space-x-2 ${className}`}
    >
      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
      <span className="text-xs sm:text-sm">Export</span>
    </Button>
  )
}
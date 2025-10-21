import { Download } from 'lucide-react'
import { Button } from './ui/button'

interface ExportButtonProps {
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ExportButton({ 
  onClick, 
  variant = 'outline', 
  size = 'sm',
  className = '' 
}: ExportButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={`flex items-center space-x-2 ${className}`}
    >
      <Download className="w-4 h-4" />
      <span>Export</span>
    </Button>
  )
}
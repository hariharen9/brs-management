import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn } from '../lib/utils'

interface KPICardProps {
  title: string
  value: number
  icon?: React.ReactNode
  className?: string
  prefix?: string
  suffix?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
}

const colorVariants = {
  blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50',
  green: 'border-green-200 bg-gradient-to-br from-green-50 to-green-100/50',
  orange: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50',
  purple: 'border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50',
  red: 'border-red-200 bg-gradient-to-br from-red-50 to-red-100/50',
}

const iconColorVariants = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  orange: 'text-orange-600',
  purple: 'text-purple-600',
  red: 'text-red-600',
}

export function KPICard({ 
  title, 
  value, 
  icon, 
  className, 
  prefix = '', 
  suffix = '', 
  trend,
  color = 'blue'
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group"
    >
      <Card className={cn(
        'hover:shadow-xl transition-all duration-300 border-2',
        colorVariants[color],
        className
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
            {title}
          </CardTitle>
          {icon && (
            <div className={cn(
              'p-2 rounded-full bg-white/60 group-hover:bg-white/80 transition-all',
              iconColorVariants[color]
            )}>
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          <motion.div
            key={value}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="text-3xl font-bold text-gray-900"
          >
            {prefix}{value.toLocaleString()}{suffix}
          </motion.div>
          
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'flex items-center text-xs font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              <span className={cn(
                'inline-block w-0 h-0 mr-1',
                trend.isPositive 
                  ? 'border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-green-600'
                  : 'border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-600'
              )} />
              {Math.abs(trend.value)}% from last period
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
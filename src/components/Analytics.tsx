import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { TrendingUp, TrendingDown, Users, Package, Wrench, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { KPICard } from './KPICard'
import {
  useClientAnalytics,
  useMonthlyTrends,
  useComponentAnalytics,
  useWorkTypeAnalytics,
  useOverallStats
} from '../hooks/useAnalytics'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export function Analytics() {
  const { data: clientAnalytics = [], isLoading: clientLoading } = useClientAnalytics()
  const { data: monthlyTrends = [], isLoading: trendsLoading } = useMonthlyTrends()
  const { data: componentAnalytics = [], isLoading: componentLoading } = useComponentAnalytics()
  const { data: workTypeAnalytics = [], isLoading: workTypeLoading } = useWorkTypeAnalytics()
  const { data: overallStats, isLoading: statsLoading } = useOverallStats()

  const isLoading = clientLoading || trendsLoading || componentLoading || workTypeLoading || statsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your business performance
          </p>
        </div>
      </div>

      {/* Overall Stats KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Transactions"
          value={overallStats?.total_transactions || 0}
          icon={<Package className="w-4 h-4 lg:w-5 lg:h-5" />}
          color="blue"
          compact={true}
        />
        <KPICard
          title="Total Received"
          value={overallStats?.total_received || 0}
          icon={<TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" />}
          suffix=" units"
          color="green"
          compact={true}
        />
        <KPICard
          title="Total Delivered"
          value={overallStats?.total_delivered || 0}
          icon={<TrendingDown className="w-4 h-4 lg:w-5 lg:h-5" />}
          suffix=" units"
          color="orange"
          compact={true}
        />
        <KPICard
          title="Total Revenue"
          value={overallStats?.total_billed || 0}
          icon={<DollarSign className="w-4 h-4 lg:w-5 lg:h-5" />}
          prefix="₹"
          color="purple"
          compact={true}
        />
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Monthly Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'billed' ? `₹${value.toLocaleString()}` : `${value.toLocaleString()} units`,
                  name === 'received' ? 'Received' : name === 'delivered' ? 'Delivered' : 'Billed'
                ]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="received"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="Received"
              />
              <Area
                type="monotone"
                dataKey="delivered"
                stackId="1"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.6}
                name="Delivered"
              />
              <Area
                type="monotone"
                dataKey="billed"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
                name="Billed (₹)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>Client Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clientAnalytics.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="client_name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Total Billed']}
                />
                <Bar dataKey="total_billed" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Work Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-purple-600" />
              <span>Work Type Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={workTypeAnalytics as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ work_type, percent }: any) => `${work_type} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="billed_amount"
                >
                  {workTypeAnalytics.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Billed Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Component Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-orange-600" />
            <span>Top Components by Revenue</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={componentAnalytics.slice(0, 6)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="component" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'total_billed' ? `₹${value.toLocaleString()}` : `${value.toLocaleString()} units`,
                  name === 'total_billed' ? 'Total Billed' : 'Total Quantity'
                ]}
              />
              <Legend />
              <Bar dataKey="total_billed" fill="#F59E0B" name="Total Billed (₹)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total_quantity" fill="#10B981" name="Total Quantity" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Client Balance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Client Balance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={clientAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="client_name" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()} units`,
                  name === 'current_balance' ? 'Current Balance' : 
                  name === 'total_received' ? 'Total Received' : 'Total Delivered'
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total_received" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Total Received"
              />
              <Line 
                type="monotone" 
                dataKey="total_delivered" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Total Delivered"
              />
              <Line 
                type="monotone" 
                dataKey="current_balance" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="Current Balance"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Top Performing Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {clientAnalytics[0]?.client_name || 'N/A'}
              </div>
              <div className="text-blue-700">
                ₹{clientAnalytics[0]?.total_billed.toLocaleString() || 0} billed
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Most Popular Component</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {componentAnalytics[0]?.component || 'N/A'}
              </div>
              <div className="text-green-700">
                {componentAnalytics[0]?.transaction_count || 0} transactions
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-800">Average Transaction Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                ₹{overallStats?.total_transactions ? 
                  Math.round((overallStats.total_billed || 0) / overallStats.total_transactions).toLocaleString() 
                  : 0}
              </div>
              <div className="text-purple-700">
                per transaction
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
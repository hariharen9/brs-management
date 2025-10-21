import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Receipt, 
  Calendar, 
  User, 
  Package, 
  DollarSign, 
  FileText, 
  Printer,
  CheckCircle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { useTransactions } from '../hooks/useTransactions'
import { useClients } from '../hooks/useClients'

interface BillingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  dateRange?: {
    start: string
    end: string
  }
}

export function BillingModal({ open, onOpenChange, clientId, dateRange }: BillingModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'current-month' | 'last-month' | 'custom'>('current-month')
  
  const { data: clients = [] } = useClients()
  const { data: allTransactions = [] } = useTransactions(clientId)

  const client = clients.find(c => c.id === clientId)

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    let startDate: Date
    let endDate: Date = new Date()

    switch (selectedPeriod) {
      case 'current-month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        break
      case 'last-month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
        endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0)
        break
      case 'custom':
        if (dateRange) {
          startDate = new Date(dateRange.start)
          endDate = new Date(dateRange.end)
        } else {
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        }
        break
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    }

    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return transactionDate >= startDate && transactionDate <= endDate && 
             transaction.transaction_type === 'Delivered' && 
             transaction.billed_amount && transaction.billed_amount > 0
    })
  }, [allTransactions, selectedPeriod, dateRange])

  // Calculate billing summary
  const billingSummary = useMemo(() => {
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.billed_amount || 0), 0)
    const totalQuantity = filteredTransactions.reduce((sum, t) => sum + (t.qty_out || 0), 0)
    const totalWeight = filteredTransactions.reduce((sum, t) => sum + (t.weight_kg || 0), 0)
    const transactionCount = filteredTransactions.length
    const avgRate = totalQuantity > 0 ? totalAmount / totalQuantity : 0

    // Group by component
    const componentSummary = filteredTransactions.reduce((acc, transaction) => {
      const component = transaction.component
      if (!acc[component]) {
        acc[component] = {
          quantity: 0,
          weight: 0,
          amount: 0,
          transactions: 0
        }
      }
      acc[component].quantity += transaction.qty_out || 0
      acc[component].weight += transaction.weight_kg || 0
      acc[component].amount += transaction.billed_amount || 0
      acc[component].transactions += 1
      return acc
    }, {} as Record<string, { quantity: number; weight: number; amount: number; transactions: number }>)

    return {
      totalAmount,
      totalQuantity,
      totalWeight,
      transactionCount,
      avgRate,
      componentSummary
    }
  }, [filteredTransactions])

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'current-month':
        return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      case 'last-month':
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        return lastMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      case 'custom':
        return dateRange ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}` : 'Custom Period'
      default:
        return 'Current Month'
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // const handleDownload = () => {
  //   // This would trigger a PDF download - for now just show a message
  //   alert('PDF download functionality would be implemented here')
  // }

  if (!client) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] shadow-2xl border-0 p-0">
        <div className="p-4 sm:p-6 lg:p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-6">
            <DialogTitle className="flex items-center space-x-3">
              <Receipt className="w-6 h-6 text-blue-600" />
              <span>BRS Industries Bill - {client.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
          {/* Period Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Period:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'current-month', label: 'Current' },
                  { key: 'last-month', label: 'Last Month' },
                  { key: 'custom', label: 'Custom' }
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={selectedPeriod === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod(key as any)}
                    className="text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>

          {/* Billing Header */}
          <Card className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">BILLING STATEMENT</h2>
                  <div className="space-y-1 text-blue-100 text-sm sm:text-base">
                    <div className="flex items-center space-x-2">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">Client: {client.name}</span>
                    </div>
                    {client.contact_person && (
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center flex-shrink-0">•</span>
                        <span className="truncate">Contact: {client.contact_person}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">Period: {getPeriodLabel()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="text-blue-100 text-xs sm:text-sm">Total Amount</div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{formatCurrency(billingSummary.totalAmount)}</div>
                  <div className="text-blue-200 text-xs sm:text-sm">{billingSummary.transactionCount} transactions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Quantity</div>
                    <div className="text-xl font-bold">{billingSummary.totalQuantity.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Weight</div>
                    <div className="text-xl font-bold">{billingSummary.totalWeight.toLocaleString()} kg</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Avg Rate</div>
                    <div className="text-xl font-bold">{formatCurrency(billingSummary.avgRate)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Transactions</div>
                    <div className="text-xl font-bold">{billingSummary.transactionCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Component-wise Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Component-wise Billing Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mobile-table-scroll">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Weight (KG)</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Avg Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(billingSummary.componentSummary).map(([component, summary]) => (
                    <TableRow key={component}>
                      <TableCell className="font-medium">{component}</TableCell>
                      <TableCell className="text-right">{summary.transactions}</TableCell>
                      <TableCell className="text-right">{summary.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{summary.weight.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(summary.amount)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(summary.quantity > 0 ? summary.amount / summary.quantity : 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Transaction List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Detailed Transaction List</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No billable transactions found for the selected period</p>
                </div>
              ) : (
                <div className="mobile-table-scroll">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>DC No</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Lot No</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Weight (KG)</TableHead>
                      <TableHead>Work Type</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell className="font-mono text-sm">{transaction.dc_no}</TableCell>
                        <TableCell className="font-medium">{transaction.component}</TableCell>
                        <TableCell>{transaction.lot_no}</TableCell>
                        <TableCell className="text-right">{transaction.qty_out?.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {transaction.weight_kg ? `${transaction.weight_kg.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {transaction.work_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.rate_applied ? formatCurrency(transaction.rate_applied) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.billed_amount || 0)}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Billing Summary for {getPeriodLabel()}</div>
                  <div className="text-lg font-medium">
                    {billingSummary.transactionCount} transactions • {billingSummary.totalQuantity.toLocaleString()} units • {billingSummary.totalWeight.toLocaleString()} kg
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(billingSummary.totalAmount)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
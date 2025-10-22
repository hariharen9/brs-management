import { useState, useMemo } from 'react'
import {
  Calendar,
  Printer,
  X
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from './ui/dialog'
import { Button } from './ui/button'
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

  if (!client) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-6xl lg:max-w-7xl max-h-[95vh] shadow-2xl border-0 p-0 flex flex-col">
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Print-optimized Invoice */}
          <div className="bg-white print:shadow-none p-8 print:p-6" id="invoice-content">
            {/* Header - Company Info */}
            <div className="border-b-2 border-gray-900 pb-6 mb-8 print:mb-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  <img
                    src="/brs.jpeg"
                    alt="BRS Industries Logo"
                    className="w-16 h-16 object-contain"
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">BRS INDUSTRIES & SHOT-BLASTING</h1>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Processing & ShotBlasting Services</p>
                      <p>GST: 33AFYPR4654L1ZK</p>
                      <p>Phone: 9944913135, 9842211191</p>
                      <p>Email: brsshotblasting11191@gmail.com, brsindustries13135@gmail.com</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h2>
                  <div className="text-sm space-y-1">
                    <p><span className="font-semibold">Invoice #:</span> INV-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}-{client.name.substring(0, 4).toUpperCase()}</p>
                    <p><span className="font-semibold">Date:</span> {new Date().toLocaleDateString('en-IN')}</p>
                    <p><span className="font-semibold">Period:</span> {getPeriodLabel()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">BILL TO:</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-lg">{client.name}</p>
                  {client.gst_number && <p><span className="font-medium">GST:</span> {client.gst_number}</p>}
                  {client.address && <p><span className="font-medium">Address:</span> {client.address}</p>}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">INVOICE SUMMARY:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <span className="font-medium">{billingSummary.transactionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity:</span>
                    <span className="font-medium">{billingSummary.totalQuantity.toLocaleString()} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Weight:</span>
                    <span className="font-medium">{billingSummary.totalWeight.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-lg">{formatCurrency(billingSummary.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Details Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-1">TRANSACTION DETAILS:</h3>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-gray-200 rounded">
                  <p>No billable transactions found for the selected period</p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-3 border-b font-semibold">Date</th>
                        <th className="text-left p-3 border-b font-semibold">DC No</th>
                        <th className="text-left p-3 border-b font-semibold">Component</th>
                        <th className="text-left p-3 border-b font-semibold">Lot No</th>
                        <th className="text-right p-3 border-b font-semibold">Qty</th>
                        <th className="text-right p-3 border-b font-semibold">Weight (kg)</th>
                        <th className="text-left p-3 border-b font-semibold">Work Type</th>
                        <th className="text-right p-3 border-b font-semibold">Rate</th>
                        <th className="text-right p-3 border-b font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction, index) => (
                        <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-3 border-b">{formatDate(transaction.date)}</td>
                          <td className="p-3 border-b font-mono">{transaction.dc_no}</td>
                          <td className="p-3 border-b font-medium">{transaction.component}</td>
                          <td className="p-3 border-b">{transaction.lot_no}</td>
                          <td className="p-3 border-b text-right">{transaction.qty_out?.toLocaleString()}</td>
                          <td className="p-3 border-b text-right">
                            {transaction.weight_kg ? transaction.weight_kg.toLocaleString() : '-'}
                          </td>
                          <td className="p-3 border-b">{transaction.work_type === 'Both' ? 'Fettling and ShotBlasting' : transaction.work_type}</td>
                          <td className="p-3 border-b text-right">
                            {transaction.rate_applied ? formatCurrency(transaction.rate_applied) : '-'}
                          </td>
                          <td className="p-3 border-b text-right font-medium">
                            {formatCurrency(transaction.billed_amount || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Component Summary */}
            {Object.keys(billingSummary.componentSummary).length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-1">COMPONENT SUMMARY:</h3>
                <div className="border border-gray-300 rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-3 border-b font-semibold">Component</th>
                        <th className="text-right p-3 border-b font-semibold">Transactions</th>
                        <th className="text-right p-3 border-b font-semibold">Total Qty</th>
                        <th className="text-right p-3 border-b font-semibold">Total Weight (kg)</th>
                        <th className="text-right p-3 border-b font-semibold">Total Amount</th>
                        <th className="text-right p-3 border-b font-semibold">Avg Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(billingSummary.componentSummary).map(([component, summary], index) => (
                        <tr key={component} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-3 border-b font-medium">{component}</td>
                          <td className="p-3 border-b text-right">{summary.transactions}</td>
                          <td className="p-3 border-b text-right">{summary.quantity.toLocaleString()}</td>
                          <td className="p-3 border-b text-right">{summary.weight.toLocaleString()}</td>
                          <td className="p-3 border-b text-right font-medium">{formatCurrency(summary.amount)}</td>
                          <td className="p-3 border-b text-right">
                            {formatCurrency(summary.quantity > 0 ? summary.amount / summary.quantity : 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Total and Footer */}
            <div className="border-t-2 border-gray-900 pt-6">
              <div className="flex justify-between items-end mb-8">
                <div className="text-sm text-gray-600">
                  <p className="mb-2"><span className="font-semibold">Payment Terms:</span> Next 30 days</p>
                  <p><span className="font-semibold">Due Date:</span> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <div className="bg-gray-100 p-4 rounded border">
                    <div className="text-sm text-gray-600 mb-1">TOTAL AMOUNT DUE</div>
                    <div className="text-3xl font-bold text-gray-900">{formatCurrency(billingSummary.totalAmount)}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end border-t pt-6 mt-8">
                <div className="text-sm text-gray-600">
                  <p>Thank you for your business!</p>
                  <p className="mt-2">For any queries, please contact us at the above details.</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-8">
                    <p>Authorized Signature</p>
                  </div>
                  <div className="border-b border-gray-400 w-48 mb-2"></div>
                  <p className="text-xs text-gray-500">BRS Industries</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls - Hidden in print */}
          <div className="print:hidden sticky bottom-0 bg-white border-t p-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Period:</span>
                <div className="flex space-x-1">
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
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
              <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
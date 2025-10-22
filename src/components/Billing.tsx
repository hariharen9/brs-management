import { useState, useMemo } from 'react'
import { ArrowLeft, Printer, Settings, FileText, Download } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
// import { Textarea } from './ui/textarea'
import { useTransactions } from '../hooks/useTransactions'
import { useClients } from '../hooks/useClients'

interface BillingSettings {
  invoiceNumber: string
  cgstRate: number
  sgstRate: number
  paymentTerms: string
  companyName: string
  companyGst: string
  companyPhone: string
  companyEmail: string
  companyAddress: string
  bankName: string
  accountNumber: string
  ifscCode: string
  notes: string
  showLogo: boolean
  currency: string
  discountPercent: number
  showBankDetails: boolean
  showNotes: boolean
  invoiceTemplate: 'standard' | 'detailed' | 'minimal'
}

export function Billing() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId') || ''
  
  const [selectedPeriod, setSelectedPeriod] = useState<'current-month' | 'last-month' | 'custom'>('current-month')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [settings, setSettings] = useState<BillingSettings>({
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
    cgstRate: 6,
    sgstRate: 6,
    paymentTerms: 'Net 30 days',
    companyName: 'BRS INDUSTRIES & SHOT-BLASTING',
    companyGst: '33AFYPR4654L1ZK',
    companyPhone: '9944913135, 9842211191',
    companyEmail: 'brsshotblasting11191@gmail.com, brsindustries13135@gmail.com',
    companyAddress: 'Processing & ShotBlasting Services',

    bankName: 'State Bank of India',
    accountNumber: 'XXXXXXXXXXXX',
    ifscCode: 'SBIN0XXXXXX',
    notes: 'Thank you for your business!',
    showLogo: true,
    currency: 'INR',
    discountPercent: 0,
    showBankDetails: true,
    showNotes: true,
    invoiceTemplate: 'standard'
  })

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
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start)
          endDate = new Date(customDateRange.end)
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
  }, [allTransactions, selectedPeriod, customDateRange])

  // Calculate billing summary with custom GST rates and discount
  const billingSummary = useMemo(() => {
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.billed_amount || 0), 0)
    const totalQuantity = filteredTransactions.reduce((sum, t) => sum + (t.qty_out || 0), 0)
    const totalWeight = filteredTransactions.reduce((sum, t) => sum + (t.weight_kg || 0), 0)
    const transactionCount = filteredTransactions.length

    // Apply discount
    const discountAmount = totalAmount * (settings.discountPercent / 100)
    const subtotalAfterDiscount = totalAmount - discountAmount

    // GST Calculations with custom rates on discounted amount
    const cgstRate = settings.cgstRate / 100
    const sgstRate = settings.sgstRate / 100
    
    const cgstAmount = subtotalAfterDiscount * cgstRate
    const sgstAmount = subtotalAfterDiscount * sgstRate
    const totalGstAmount = cgstAmount + sgstAmount
    const totalAmountWithGst = subtotalAfterDiscount + totalGstAmount

    return {
      totalAmount,
      totalQuantity,
      totalWeight,
      transactionCount,
      discountAmount,
      subtotalAfterDiscount,
      cgstAmount,
      sgstAmount,
      totalGstAmount,
      totalAmountWithGst
    }
  }, [filteredTransactions, settings.cgstRate, settings.sgstRate, settings.discountPercent])

  const formatCurrency = (amount: number) => {
    const symbol = settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : '€'
    return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
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
        return customDateRange.start && customDateRange.end 
          ? `${formatDate(customDateRange.start)} - ${formatDate(customDateRange.end)}` 
          : 'Custom Period'
      default:
        return 'Current Month'
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // This would typically integrate with a PDF generation library
    // For now, we'll trigger the print dialog
    window.print()
  }

  const getDueDate = () => {
    const days = parseInt(settings.paymentTerms.match(/\d+/)?.[0] || '30')
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h1>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Invoice Generator</h1>
                <p className="text-gray-600">Create professional invoices for {client.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Invoice Settings</span>
            </TabsTrigger>
            <TabsTrigger value="customization" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Customization</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Printer className="w-4 h-4" />
              <span>Preview & Print</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Invoice Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={settings.invoiceNumber}
                      onChange={(e) => setSettings({ ...settings, invoiceNumber: e.target.value })}
                      placeholder="Enter invoice number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Billing Period</Label>
                    <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current-month">Current Month</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="custom">Custom Period</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPeriod === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={customDateRange.start}
                          onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={customDateRange.end}
                          onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select value={settings.paymentTerms} onValueChange={(value) => setSettings({ ...settings, paymentTerms: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Net 15 days">Net 15 days</SelectItem>
                        <SelectItem value="Net 30 days">Net 30 days</SelectItem>
                        <SelectItem value="Net 45 days">Net 45 days</SelectItem>
                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                        <SelectItem value="Cash on Delivery">Cash on Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={settings.currency} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Tax & Discount Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Tax & Discount Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cgstRate">CGST Rate (%)</Label>
                      <Input
                        id="cgstRate"
                        type="number"
                        step="0.1"
                        value={settings.cgstRate}
                        onChange={(e) => setSettings({ ...settings, cgstRate: parseFloat(e.target.value) || 0 })}
                        placeholder="6"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sgstRate">SGST Rate (%)</Label>
                      <Input
                        id="sgstRate"
                        type="number"
                        step="0.1"
                        value={settings.sgstRate}
                        onChange={(e) => setSettings({ ...settings, sgstRate: parseFloat(e.target.value) || 0 })}
                        placeholder="6"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discountPercent">Discount (%)</Label>
                    <Input
                      id="discountPercent"
                      type="number"
                      step="0.1"
                      value={settings.discountPercent}
                      onChange={(e) => setSettings({ ...settings, discountPercent: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg space-y-1">
                    <p className="text-sm text-blue-800">
                      <strong>Total GST:</strong> {settings.cgstRate + settings.sgstRate}%
                    </p>
                    {settings.discountPercent > 0 && (
                      <p className="text-sm text-green-800">
                        <strong>Discount:</strong> {settings.discountPercent}%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Company Settings */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      placeholder="Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyGst">Company GST Number</Label>
                    <Input
                      id="companyGst"
                      value={settings.companyGst}
                      onChange={(e) => setSettings({ ...settings, companyGst: e.target.value })}
                      placeholder="GST Number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Phone Number</Label>
                    <Input
                      id="companyPhone"
                      value={settings.companyPhone}
                      onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                      placeholder="Phone Number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email Address</Label>
                    <Input
                      id="companyEmail"
                      value={settings.companyEmail}
                      onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                      placeholder="Email Address"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <textarea
                      id="companyAddress"
                      value={settings.companyAddress}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettings({ ...settings, companyAddress: e.target.value })}
                      placeholder="Complete company address"
                      rows={2}
                      className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customization" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template & Display Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Template & Display</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Invoice Template</Label>
                    <Select value={settings.invoiceTemplate} onValueChange={(value: any) => setSettings({ ...settings, invoiceTemplate: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Template</SelectItem>
                        <SelectItem value="detailed">Detailed Template</SelectItem>
                        <SelectItem value="minimal">Minimal Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showLogo"
                        checked={settings.showLogo}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, showLogo: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="showLogo">Show Company Logo</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showBankDetails"
                        checked={settings.showBankDetails}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, showBankDetails: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="showBankDetails">Show Bank Details</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showNotes"
                        checked={settings.showNotes}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, showNotes: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="showNotes">Show Notes Section</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Bank Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={settings.bankName}
                      onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                      placeholder="Bank Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={settings.accountNumber}
                      onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                      placeholder="Account Number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={settings.ifscCode}
                      onChange={(e) => setSettings({ ...settings, ifscCode: e.target.value })}
                      placeholder="IFSC Code"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notes & Additional Info */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Notes & Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Invoice Notes</Label>
                    <textarea
                      id="notes"
                      value={settings.notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettings({ ...settings, notes: e.target.value })}
                      placeholder="Thank you for your business! Payment terms and conditions..."
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {/* Print Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border print:hidden">
              <div className="text-sm text-gray-600">
                <p className="font-medium">Invoice ready for {client.name}</p>
                <p>{billingSummary.transactionCount} transactions • {formatCurrency(billingSummary.totalAmountWithGst)} total</p>
                <p className="text-xs text-gray-500">Due: {getDueDate()}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Invoice
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>

            {/* Invoice Preview */}
            <div className="bg-white print:shadow-none p-8 print:p-6 shadow-lg rounded-lg" id="invoice-content">
              {/* Header */}
              <div className="border-b-2 border-gray-900 pb-6 mb-8 print:mb-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    {settings.showLogo && (
                      <img 
                        src="/brs.jpeg" 
                        alt="Company Logo" 
                        className="w-16 h-16 object-contain"
                      />
                    )}
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{settings.companyName}</h1>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{settings.companyAddress}</p>
                        <p>GST: {settings.companyGst}</p>
                        <p>Phone: {settings.companyPhone}</p>
                        <p>Email: {settings.companyEmail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h2>
                    <div className="text-sm space-y-1">
                      <p><span className="font-semibold">Invoice #:</span> {settings.invoiceNumber}</p>
                      <p><span className="font-semibold">Date:</span> {new Date().toLocaleDateString('en-IN')}</p>
                      <p><span className="font-semibold">Due Date:</span> {getDueDate()}</p>
                      <p><span className="font-semibold">Period:</span> {getPeriodLabel()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Info and Summary */}
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
                  </div>
                </div>
              </div>

              {/* Transaction Details Table */}
              {settings.invoiceTemplate !== 'minimal' && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-1">TRANSACTION DETAILS:</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left py-2 px-1">Date</th>
                          <th className="text-left py-2 px-1">Description</th>
                          <th className="text-right py-2 px-1">Qty</th>
                          <th className="text-right py-2 px-1">Weight (kg)</th>
                          <th className="text-right py-2 px-1">Rate</th>
                          <th className="text-right py-2 px-1">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-gray-200">
                            <td className="py-2 px-1">{formatDate(transaction.date)}</td>
                            <td className="py-2 px-1">Processing Service</td>
                            <td className="text-right py-2 px-1">{transaction.qty_out || 0}</td>
                            <td className="text-right py-2 px-1">{transaction.weight_kg?.toFixed(2) || '0.00'}</td>
                            <td className="text-right py-2 px-1">{formatCurrency((transaction.billed_amount || 0) / (transaction.qty_out || 1))}</td>
                            <td className="text-right py-2 px-1">{formatCurrency(transaction.billed_amount || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Billing Summary */}
              <div className="flex justify-end mb-8">
                <div className="w-full max-w-md">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(billingSummary.totalAmount)}</span>
                    </div>
                    {settings.discountPercent > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({settings.discountPercent}%):</span>
                        <span>-{formatCurrency(billingSummary.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>CGST ({settings.cgstRate}%):</span>
                      <span>{formatCurrency(billingSummary.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>SGST ({settings.sgstRate}%):</span>
                      <span>{formatCurrency(billingSummary.sgstAmount)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount:</span>
                        <span>{formatCurrency(billingSummary.totalAmountWithGst)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              {settings.showBankDetails && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">BANK DETAILS:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Bank Name:</p>
                      <p>{settings.bankName}</p>
                    </div>
                    <div>
                      <p className="font-medium">Account Number:</p>
                      <p>{settings.accountNumber}</p>
                    </div>
                    <div>
                      <p className="font-medium">IFSC Code:</p>
                      <p>{settings.ifscCode}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {settings.showNotes && settings.notes && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">NOTES:</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{settings.notes}</p>
                </div>
              )}

              {/* Payment Terms */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">Payment Terms: {settings.paymentTerms}</p>
                    <p className="text-gray-600">Thank you for your business!</p>
                  </div>
                  <div className="text-right">
                    <div className="border-t border-gray-400 pt-2 mt-8 w-32">
                      <p className="text-xs text-gray-600">Authorized Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
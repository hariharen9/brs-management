import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, File, Calendar, Filter, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ExportService, type ExportOptions } from '../services/exportService'
import { TemplateBasedExportService } from '../services/templateBasedExport'
import { useClients } from '../hooks/useClients'
import { useAllTransactions, useBalanceSummary } from '../hooks/useTransactions'
import { handleError, showSuccessToast } from '../lib/errorHandling'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultClientId?: string
}

export function ExportDialog({ open, onOpenChange, defaultClientId }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'xlsx',
    reportType: 'summary',
    clientId: defaultClientId,
    dateRange: undefined,
    includeCharts: false
  })

  const { data: clients = [] } = useClients()
  const { data: allTransactions = [] } = useAllTransactions()
  const { data: balanceSummary = [] } = useBalanceSummary(exportOptions.clientId || '')

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Prepare export data
      const exportData = {
        clients,
        transactions: allTransactions,
        balanceSummary,
        dateRange: exportOptions.dateRange
      }

      // Perform export based on format and report type
      if (exportOptions.format === 'xlsx' && exportOptions.reportType === 'template') {
        // Use template-based export for BRS template format
        await TemplateBasedExportService.exportUsingTemplate(exportData, exportOptions.clientId)
      } else {
        // Use standard export service for other formats
        switch (exportOptions.format) {
          case 'xlsx':
            await ExportService.exportToExcel(exportData, exportOptions)
            break
          case 'csv':
            await ExportService.exportToCSV(exportData, exportOptions)
            break
          case 'pdf':
            await ExportService.exportToPDF(exportData, exportOptions)
            break
        }
      }

      showSuccessToast(`${exportOptions.format.toUpperCase()} report exported successfully!`)
      onOpenChange(false)
    } catch (error) {
      handleError(error, 'exporting report')
    } finally {
      setIsExporting(false)
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'xlsx':
        return <FileSpreadsheet className="w-4 h-4 text-green-600" />
      case 'csv':
        return <FileText className="w-4 h-4 text-blue-600" />
      case 'pdf':
        return <File className="w-4 h-4 text-red-600" />
      default:
        return <Download className="w-4 h-4" />
    }
  }

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'xlsx':
        return 'Excel format with multiple sheets, formatting, and professional layout'
      case 'csv':
        return 'Comma-separated values - perfect for data analysis and import into other systems'
      case 'pdf':
        return 'Professional PDF reports - ready for printing, sharing, and presentations'
      default:
        return ''
    }
  }

  const getReportDescription = (reportType: string) => {
    switch (reportType) {
      case 'summary':
        return 'Overview of all clients with key metrics and totals'
      case 'detailed':
        return 'Comprehensive report with all data across multiple sheets'
      case 'transactions':
        return 'Detailed transaction log with filtering options'
      case 'components':
        return 'Component usage analysis and profitability report'
      case 'balance':
        return 'Current balance summary by component'
      case 'template':
        return 'Professional report matching your BRS template format with 5 sheets'
      default:
        return ''
    }
  }

  const selectedClient = clients.find(c => c.id === exportOptions.clientId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[600px] max-h-[90vh] shadow-2xl border-0 p-0 flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto min-h-0">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5 text-blue-600" />
              <span>Export Reports</span>
            </DialogTitle>
            <DialogDescription>
              Generate and download comprehensive reports in various formats
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: 'xlsx', label: 'Excel', badge: 'Recommended' },
                { key: 'csv', label: 'CSV', badge: 'Simple' },
                { key: 'pdf', label: 'PDF', badge: 'Print-ready' }
              ].map(({ key, label, badge }) => (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all duration-200 ${
                    exportOptions.format === key
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setExportOptions({ ...exportOptions, format: key as any })}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      {getFormatIcon(key)}
                      <div>
                        <div className="font-medium text-sm">{label}</div>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {badge}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-600">
                {getFormatDescription(exportOptions.format)}
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  ✅ All Report Types
                </Badge>
                {exportOptions.format === 'xlsx' && (
                  <Badge variant="outline" className="text-xs text-green-600">
                    ✨ Advanced Formatting
                  </Badge>
                )}
                {exportOptions.format === 'pdf' && (
                  <Badge variant="outline" className="text-xs text-blue-600">
                    📄 Print Ready
                  </Badge>
                )}
                {exportOptions.format === 'csv' && (
                  <Badge variant="outline" className="text-xs text-purple-600">
                    📊 Data Analysis
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Report Type</Label>
            <Select
              value={exportOptions.reportType}
              onValueChange={(value) => setExportOptions({ 
                ...exportOptions, 
                reportType: value as any 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Client Summary</span>
                  </div>
                </SelectItem>
                <SelectItem value="detailed">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Detailed Report (All Sheets)</span>
                  </div>
                </SelectItem>
                <SelectItem value="template">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    <span>BRS Template Format ✨</span>
                  </div>
                </SelectItem>
                <SelectItem value="transactions">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Transaction Log</span>
                  </div>
                </SelectItem>
                <SelectItem value="components">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4" />
                    <span>Component Analysis</span>
                  </div>
                </SelectItem>
                <SelectItem value="balance">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Balance Summary</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600">
              {getReportDescription(exportOptions.reportType)}
            </p>
          </div>

          {/* Client Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Client Filter</Label>
            <Select
              value={exportOptions.clientId || 'all'}
              onValueChange={(value) => setExportOptions({ 
                ...exportOptions, 
                clientId: value === 'all' ? undefined : value 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4" />
                    <span>All Clients</span>
                  </div>
                </SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{client.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClient && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Badge variant="outline" className="text-xs">
                  {selectedClient.name}
                </Badge>
                <span>• {allTransactions.filter(t => t.client_id === selectedClient.id).length} transactions</span>
              </div>
            )}
          </div>

          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Date Range (Optional)</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">From Date</Label>
                <Input
                  type="date"
                  value={exportOptions.dateRange?.start || ''}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    dateRange: {
                      start: e.target.value,
                      end: exportOptions.dateRange?.end || ''
                    }
                  })}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">To Date</Label>
                <Input
                  type="date"
                  value={exportOptions.dateRange?.end || ''}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    dateRange: {
                      start: exportOptions.dateRange?.start || '',
                      end: e.target.value
                    }
                  })}
                />
              </div>
            </div>
            {exportOptions.dateRange?.start && exportOptions.dateRange?.end && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Badge variant="outline" className="text-xs">
                  {new Date(exportOptions.dateRange.start).toLocaleDateString()} - {new Date(exportOptions.dateRange.end).toLocaleDateString()}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setExportOptions({ ...exportOptions, dateRange: undefined })}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Export Preview */}
          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Format:</span>
                <div className="flex items-center space-x-1">
                  {getFormatIcon(exportOptions.format)}
                  <span className="font-medium">{exportOptions.format.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Report:</span>
                <span className="font-medium capitalize">{exportOptions.reportType}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Scope:</span>
                <span className="font-medium">
                  {exportOptions.clientId ? selectedClient?.name : 'All Clients'}
                </span>
              </div>
              {exportOptions.dateRange?.start && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Period:</span>
                  <span className="font-medium">
                    {new Date(exportOptions.dateRange.start).toLocaleDateString()} - {new Date(exportOptions.dateRange.end || exportOptions.dateRange.start).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
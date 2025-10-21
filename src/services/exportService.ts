import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Client, Transaction, BalanceSummaryItem } from '../types'

export interface ExportData {
  clients: Client[]
  transactions: Transaction[]
  balanceSummary: BalanceSummaryItem[]
  dateRange?: {
    start: string
    end: string
  }
}

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'pdf'
  reportType: 'summary' | 'detailed' | 'transactions' | 'components' | 'balance' | 'template'
  clientId?: string
  dateRange?: {
    start: string
    end: string
  }
  includeCharts?: boolean
}

export class ExportService {
  private static formatCurrency(amount: number | null): string {
    if (amount === null || amount === undefined) return '₹0'
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  }

  private static formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  private static getClientName(clientId: string, clients: Client[]): string {
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'Unknown Client'
  }

  // Excel Export Methods
  static async exportToExcel(data: ExportData, options: ExportOptions): Promise<void> {
    const workbook = XLSX.utils.book_new()

    switch (options.reportType) {
      case 'summary':
        await this.createSummarySheet(workbook, data)
        break
      case 'detailed':
        await this.createDetailedReport(workbook, data, options)
        break
      case 'transactions':
        await this.createTransactionsSheet(workbook, data, options)
        break
      case 'components':
        await this.createComponentsSheet(workbook, data)
        break
      case 'balance':
        await this.createBalanceSheet(workbook, data, options)
        break
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const clientName = options.clientId ? 
      this.getClientName(options.clientId, data.clients).replace(/[^a-zA-Z0-9]/g, '_') : 
      'All_Clients'
    const filename = `BRS_${options.reportType}_${clientName}_${timestamp}.xlsx`

    // Save file
    XLSX.writeFile(workbook, filename)
  }

  private static async createSummarySheet(workbook: XLSX.WorkBook, data: ExportData) {
    const summaryData = []

    // Header
    summaryData.push(['BRS MANAGEMENT SYSTEM - CLIENT SUMMARY REPORT'])
    summaryData.push(['Generated on:', new Date().toLocaleString('en-IN')])
    summaryData.push([]) // Empty row

    // Client summary
    summaryData.push(['CLIENT', 'CONTACT PERSON', 'TOTAL TRANSACTIONS', 'TOTAL RECEIVED', 'TOTAL DELIVERED', 'CURRENT BALANCE', 'TOTAL BILLED'])

    data.clients.forEach(client => {
      const clientTransactions = data.transactions.filter(t => t.client_id === client.id)
      const totalReceived = clientTransactions
        .filter(t => t.transaction_type === 'Received')
        .reduce((sum, t) => sum + (t.qty_in || 0), 0)
      const totalDelivered = clientTransactions
        .filter(t => t.transaction_type === 'Delivered')
        .reduce((sum, t) => sum + (t.qty_out || 0), 0)
      const currentBalance = totalReceived - totalDelivered
      const totalBilled = clientTransactions
        .reduce((sum, t) => sum + (t.billed_amount || 0), 0)

      summaryData.push([
        client.name,
        client.contact_person || 'N/A',
        clientTransactions.length,
        totalReceived,
        totalDelivered,
        currentBalance,
        this.formatCurrency(totalBilled)
      ])
    })

    // Add totals row
    const grandTotalReceived = data.transactions
      .filter(t => t.transaction_type === 'Received')
      .reduce((sum, t) => sum + (t.qty_in || 0), 0)
    const grandTotalDelivered = data.transactions
      .filter(t => t.transaction_type === 'Delivered')
      .reduce((sum, t) => sum + (t.qty_out || 0), 0)
    const grandTotalBilled = data.transactions
      .reduce((sum, t) => sum + (t.billed_amount || 0), 0)

    summaryData.push([]) // Empty row
    summaryData.push([
      'GRAND TOTAL',
      '',
      data.transactions.length,
      grandTotalReceived,
      grandTotalDelivered,
      grandTotalReceived - grandTotalDelivered,
      this.formatCurrency(grandTotalBilled)
    ])

    // Add key insights
    summaryData.push([]) // Empty row
    summaryData.push(['KEY INSIGHTS'])
    summaryData.push(['Total Clients:', data.clients.length])
    summaryData.push(['Active Clients:', data.clients.filter(c => 
      data.transactions.some(t => t.client_id === c.id)
    ).length])
    summaryData.push(['Avg Transactions per Client:', Math.round(data.transactions.length / data.clients.length)])
    summaryData.push(['Total Outstanding Balance:', `${grandTotalReceived - grandTotalDelivered} units`])

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData)
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 25 }, // Client
      { width: 20 }, // Contact
      { width: 15 }, // Transactions
      { width: 15 }, // Received
      { width: 15 }, // Delivered
      { width: 15 }, // Balance
      { width: 15 }  // Billed
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Client Summary')
  }

  private static async createDetailedReport(workbook: XLSX.WorkBook, data: ExportData, options: ExportOptions) {
    // Create multiple sheets for a comprehensive report
    await this.createSummarySheet(workbook, data)
    await this.createTransactionsSheet(workbook, data, options)
    await this.createComponentsSheet(workbook, data)
    await this.createBalanceSheet(workbook, data, options)
  }

  private static async createTransactionsSheet(workbook: XLSX.WorkBook, data: ExportData, options: ExportOptions) {
    let transactions = data.transactions

    // Filter by client if specified
    if (options.clientId) {
      transactions = transactions.filter(t => t.client_id === options.clientId)
    }

    // Filter by date range if specified
    if (options.dateRange) {
      transactions = transactions.filter(t => 
        t.date >= options.dateRange!.start && t.date <= options.dateRange!.end
      )
    }

    const transactionData = []

    // Header
    const clientName = options.clientId ? 
      this.getClientName(options.clientId, data.clients) : 
      'All Clients'
    transactionData.push([`TRANSACTION REPORT - ${clientName}`])
    transactionData.push(['Generated on:', new Date().toLocaleString('en-IN')])
    if (options.dateRange) {
      transactionData.push(['Date Range:', `${this.formatDate(options.dateRange.start)} to ${this.formatDate(options.dateRange.end)}`])
    }
    transactionData.push([]) // Empty row

    // Column headers
    transactionData.push([
      'DATE', 'CLIENT', 'DC NO', 'COMPONENT', 'LOT NO', 'TYPE', 
      'QTY IN', 'QTY OUT', 'WORK TYPE', 'UNIT', 'RATE', 'BILLED AMOUNT'
    ])

    // Transaction data
    transactions.forEach(transaction => {
      transactionData.push([
        this.formatDate(transaction.date),
        this.getClientName(transaction.client_id, data.clients),
        transaction.dc_no,
        transaction.component,
        transaction.lot_no,
        transaction.transaction_type,
        transaction.qty_in || '',
        transaction.qty_out || '',
        transaction.work_type || '',
        transaction.unit || '',
        transaction.rate_applied ? this.formatCurrency(transaction.rate_applied) : '',
        transaction.billed_amount ? this.formatCurrency(transaction.billed_amount) : ''
      ])
    })

    // Summary
    const totalBilled = transactions.reduce((sum, t) => sum + (t.billed_amount || 0), 0)
    const totalReceived = transactions
      .filter(t => t.transaction_type === 'Received')
      .reduce((sum, t) => sum + (t.qty_in || 0), 0)
    const totalDelivered = transactions
      .filter(t => t.transaction_type === 'Delivered')
      .reduce((sum, t) => sum + (t.qty_out || 0), 0)

    transactionData.push([]) // Empty row
    transactionData.push(['SUMMARY'])
    transactionData.push(['Total Transactions:', transactions.length])
    transactionData.push(['Total Received:', totalReceived, 'units'])
    transactionData.push(['Total Delivered:', totalDelivered, 'units'])
    transactionData.push(['Current Balance:', totalReceived - totalDelivered, 'units'])
    transactionData.push(['Total Billed:', this.formatCurrency(totalBilled)])

    const worksheet = XLSX.utils.aoa_to_sheet(transactionData)
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 12 }, // Date
      { width: 20 }, // Client
      { width: 12 }, // DC No
      { width: 20 }, // Component
      { width: 15 }, // Lot No
      { width: 10 }, // Type
      { width: 10 }, // Qty In
      { width: 10 }, // Qty Out
      { width: 15 }, // Work Type
      { width: 10 }, // Unit
      { width: 12 }, // Rate
      { width: 15 }  // Billed Amount
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
  }

  private static async createComponentsSheet(workbook: XLSX.WorkBook, data: ExportData) {
    // Analyze components
    const componentAnalysis = new Map<string, {
      totalTransactions: number
      totalQuantity: number
      totalBilled: number
      clients: Set<string>
      avgRate: number
    }>()

    data.transactions.forEach(transaction => {
      const component = transaction.component
      if (!componentAnalysis.has(component)) {
        componentAnalysis.set(component, {
          totalTransactions: 0,
          totalQuantity: 0,
          totalBilled: 0,
          clients: new Set(),
          avgRate: 0
        })
      }

      const analysis = componentAnalysis.get(component)!
      analysis.totalTransactions++
      analysis.totalQuantity += (transaction.qty_out || transaction.qty_in || 0)
      analysis.totalBilled += (transaction.billed_amount || 0)
      analysis.clients.add(transaction.client_id)
    })

    const componentData = []

    // Header
    componentData.push(['COMPONENT ANALYSIS REPORT'])
    componentData.push(['Generated on:', new Date().toLocaleString('en-IN')])
    componentData.push([]) // Empty row

    // Column headers
    componentData.push([
      'COMPONENT', 'TOTAL TRANSACTIONS', 'TOTAL QUANTITY', 'TOTAL BILLED', 
      'CLIENTS COUNT', 'AVG RATE PER UNIT'
    ])

    // Component data
    Array.from(componentAnalysis.entries())
      .sort(([,a], [,b]) => b.totalBilled - a.totalBilled) // Sort by total billed
      .forEach(([component, analysis]) => {
        const avgRate = analysis.totalQuantity > 0 ? analysis.totalBilled / analysis.totalQuantity : 0
        componentData.push([
          component,
          analysis.totalTransactions,
          analysis.totalQuantity,
          this.formatCurrency(analysis.totalBilled),
          analysis.clients.size,
          this.formatCurrency(avgRate)
        ])
      })

    const worksheet = XLSX.utils.aoa_to_sheet(componentData)
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 25 }, // Component
      { width: 18 }, // Transactions
      { width: 15 }, // Quantity
      { width: 15 }, // Billed
      { width: 12 }, // Clients
      { width: 18 }  // Avg Rate
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Component Analysis')
  }

  private static async createBalanceSheet(workbook: XLSX.WorkBook, data: ExportData, options: ExportOptions) {
    const balanceData = []

    // Header
    const clientName = options.clientId ? 
      this.getClientName(options.clientId, data.clients) : 
      'All Clients'
    balanceData.push([`BALANCE SUMMARY - ${clientName}`])
    balanceData.push(['Generated on:', new Date().toLocaleString('en-IN')])
    balanceData.push([]) // Empty row

    // Column headers
    balanceData.push(['COMPONENT', 'RECEIVED', 'DELIVERED', 'BALANCE'])

    // Balance data
    data.balanceSummary.forEach(item => {
      balanceData.push([
        item.component,
        item.total_in,
        item.total_out,
        item.balance
      ])
    })

    const worksheet = XLSX.utils.aoa_to_sheet(balanceData)
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 25 }, // Component
      { width: 12 }, // Received
      { width: 12 }, // Delivered
      { width: 12 }  // Balance
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Balance Summary')
  }

  // CSV Export Methods
  static async exportToCSV(data: ExportData, options: ExportOptions): Promise<void> {
    let csvContent = ''
    let filename = ''

    switch (options.reportType) {
      case 'summary':
        const summaryResult = this.createSummaryCSV(data, options)
        csvContent = summaryResult.content
        filename = summaryResult.filename
        break
      case 'detailed':
        const detailedResult = this.createDetailedCSV(data, options)
        csvContent = detailedResult.content
        filename = detailedResult.filename
        break
      case 'transactions':
        const transactionResult = this.createTransactionsCSV(data, options)
        csvContent = transactionResult.content
        filename = transactionResult.filename
        break
      case 'components':
        const componentResult = this.createComponentsCSV(data, options)
        csvContent = componentResult.content
        filename = componentResult.filename
        break
      case 'balance':
        const balanceResult = this.createBalanceCSV(data, options)
        csvContent = balanceResult.content
        filename = balanceResult.filename
        break
      case 'template':
        const templateResult = this.createTemplateCSV(data, options)
        csvContent = templateResult.content
        filename = templateResult.filename
        break
      default:
        throw new Error(`CSV export not implemented for ${options.reportType}`)
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  private static createTransactionsCSV(data: ExportData, options: ExportOptions): { content: string, filename: string } {
    let transactions = data.transactions

    // Filter by client if specified
    if (options.clientId) {
      transactions = transactions.filter(t => t.client_id === options.clientId)
    }

    // Filter by date range if specified
    if (options.dateRange) {
      transactions = transactions.filter(t => 
        t.date >= options.dateRange!.start && t.date <= options.dateRange!.end
      )
    }

    const headers = [
      'Date', 'Client', 'DC No', 'Component', 'Lot No', 'Type',
      'Qty In', 'Qty Out', 'Work Type', 'Unit', 'Rate', 'Billed Amount'
    ]

    const rows = transactions.map(transaction => [
      this.formatDate(transaction.date),
      this.getClientName(transaction.client_id, data.clients),
      transaction.dc_no,
      transaction.component,
      transaction.lot_no,
      transaction.transaction_type,
      transaction.qty_in || '',
      transaction.qty_out || '',
      transaction.work_type || '',
      transaction.unit || '',
      transaction.rate_applied || '',
      transaction.billed_amount || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const timestamp = new Date().toISOString().split('T')[0]
    const clientName = options.clientId ? 
      this.getClientName(options.clientId, data.clients).replace(/[^a-zA-Z0-9]/g, '_') : 
      'All_Clients'
    const filename = `BRS_Transactions_${clientName}_${timestamp}.csv`

    return { content: csvContent, filename }
  }

  private static createSummaryCSV(data: ExportData, options: ExportOptions): { content: string, filename: string } {
    const headers = [
      'Client Name', 'Contact Person', 'Total Transactions', 'Total Received', 
      'Total Delivered', 'Current Balance', 'Total Billed'
    ]

    const rows = data.clients.map(client => {
      const clientTransactions = data.transactions.filter(t => t.client_id === client.id)
      const totalReceived = clientTransactions
        .filter(t => t.transaction_type === 'Received')
        .reduce((sum, t) => sum + (t.qty_in || 0), 0)
      const totalDelivered = clientTransactions
        .filter(t => t.transaction_type === 'Delivered')
        .reduce((sum, t) => sum + (t.qty_out || 0), 0)
      const currentBalance = totalReceived - totalDelivered
      const totalBilled = clientTransactions
        .reduce((sum, t) => sum + (t.billed_amount || 0), 0)

      return [
        client.name,
        client.contact_person || 'N/A',
        clientTransactions.length,
        totalReceived,
        totalDelivered,
        currentBalance,
        totalBilled
      ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `BRS_Client_Summary_${timestamp}.csv`

    return { content: csvContent, filename }
  }

  private static createDetailedCSV(data: ExportData, options: ExportOptions): { content: string, filename: string } {
    // For detailed CSV, we'll combine multiple data types
    let csvContent = ''
    
    // Client Summary Section
    csvContent += 'CLIENT SUMMARY\n'
    csvContent += 'Client Name,Contact Person,Total Transactions,Total Received,Total Delivered,Current Balance,Total Billed\n'
    
    data.clients.forEach(client => {
      const clientTransactions = data.transactions.filter(t => t.client_id === client.id)
      const totalReceived = clientTransactions
        .filter(t => t.transaction_type === 'Received')
        .reduce((sum, t) => sum + (t.qty_in || 0), 0)
      const totalDelivered = clientTransactions
        .filter(t => t.transaction_type === 'Delivered')
        .reduce((sum, t) => sum + (t.qty_out || 0), 0)
      const totalBilled = clientTransactions
        .reduce((sum, t) => sum + (t.billed_amount || 0), 0)

      csvContent += `"${client.name}","${client.contact_person || 'N/A'}",${clientTransactions.length},${totalReceived},${totalDelivered},${totalReceived - totalDelivered},${totalBilled}\n`
    })

    csvContent += '\n\nTRANSACTION DETAILS\n'
    csvContent += 'Date,Client,DC No,Component,Lot No,Type,Qty In,Qty Out,Work Type,Unit,Rate,Billed Amount\n'
    
    data.transactions.forEach(transaction => {
      const client = data.clients.find(c => c.id === transaction.client_id)
      csvContent += `"${this.formatDate(transaction.date)}","${client?.name || 'Unknown'}","${transaction.dc_no}","${transaction.component}","${transaction.lot_no}","${transaction.transaction_type}","${transaction.qty_in || ''}","${transaction.qty_out || ''}","${transaction.work_type || ''}","${transaction.unit || ''}","${transaction.rate_applied || ''}","${transaction.billed_amount || ''}"\n`
    })

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `BRS_Detailed_Report_${timestamp}.csv`

    return { content: csvContent, filename }
  }

  private static createComponentsCSV(data: ExportData, options: ExportOptions): { content: string, filename: string } {
    // Analyze components
    const componentAnalysis = new Map<string, {
      totalTransactions: number
      totalQuantity: number
      totalBilled: number
      clients: Set<string>
    }>()

    data.transactions.forEach(transaction => {
      const component = transaction.component
      if (!componentAnalysis.has(component)) {
        componentAnalysis.set(component, {
          totalTransactions: 0,
          totalQuantity: 0,
          totalBilled: 0,
          clients: new Set()
        })
      }

      const analysis = componentAnalysis.get(component)!
      analysis.totalTransactions++
      analysis.totalQuantity += (transaction.qty_out || transaction.qty_in || 0)
      analysis.totalBilled += (transaction.billed_amount || 0)
      analysis.clients.add(transaction.client_id)
    })

    const headers = [
      'Component', 'Total Transactions', 'Total Quantity', 'Total Billed', 
      'Clients Count', 'Avg Rate Per Unit'
    ]

    const rows = Array.from(componentAnalysis.entries())
      .sort(([,a], [,b]) => b.totalBilled - a.totalBilled)
      .map(([component, analysis]) => {
        const avgRate = analysis.totalQuantity > 0 ? analysis.totalBilled / analysis.totalQuantity : 0
        return [
          component,
          analysis.totalTransactions,
          analysis.totalQuantity,
          analysis.totalBilled,
          analysis.clients.size,
          avgRate.toFixed(2)
        ]
      })

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `BRS_Component_Analysis_${timestamp}.csv`

    return { content: csvContent, filename }
  }

  private static createBalanceCSV(data: ExportData, options: ExportOptions): { content: string, filename: string } {
    const headers = ['Component', 'Lot No', 'Total In', 'Total Out', 'Balance']

    const rows = data.balanceSummary.map(item => [
      item.component,
      item.lot_no,
      item.total_in,
      item.total_out,
      item.balance
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const timestamp = new Date().toISOString().split('T')[0]
    const clientName = options.clientId ? 
      this.getClientName(options.clientId, data.clients).replace(/[^a-zA-Z0-9]/g, '_') : 
      'All_Clients'
    const filename = `BRS_Balance_Summary_${clientName}_${timestamp}.csv`

    return { content: csvContent, filename }
  }

  private static createTemplateCSV(data: ExportData, options: ExportOptions): { content: string, filename: string } {
    // For template CSV, create a comprehensive export similar to the Excel template
    let csvContent = ''
    
    // Header
    csvContent += 'BRS MANAGEMENT SYSTEM - COMPREHENSIVE REPORT\n'
    csvContent += `Generated on: ${new Date().toLocaleString('en-IN')}\n\n`

    // Client Summary
    csvContent += 'CLIENT SUMMARY\n'
    csvContent += 'S.No,Client Name,Contact Person,Total Transactions,Total Received,Total Delivered,Current Balance,Total Billed\n'
    
    data.clients.forEach((client, index) => {
      const clientTransactions = data.transactions.filter(t => t.client_id === client.id)
      const totalReceived = clientTransactions
        .filter(t => t.transaction_type === 'Received')
        .reduce((sum, t) => sum + (t.qty_in || 0), 0)
      const totalDelivered = clientTransactions
        .filter(t => t.transaction_type === 'Delivered')
        .reduce((sum, t) => sum + (t.qty_out || 0), 0)
      const totalBilled = clientTransactions
        .reduce((sum, t) => sum + (t.billed_amount || 0), 0)

      csvContent += `${index + 1},"${client.name}","${client.contact_person || 'N/A'}",${clientTransactions.length},${totalReceived},${totalDelivered},${totalReceived - totalDelivered},${totalBilled}\n`
    })

    csvContent += '\n\nTRANSACTION DETAILS\n'
    csvContent += 'S.No,Date,Client,DC No,Component,Lot No,Type,Qty In,Qty Out,Work Type,Unit,Rate,Billed Amount\n'
    
    data.transactions.forEach((transaction, index) => {
      const client = data.clients.find(c => c.id === transaction.client_id)
      csvContent += `${index + 1},"${this.formatDate(transaction.date)}","${client?.name || 'Unknown'}","${transaction.dc_no}","${transaction.component}","${transaction.lot_no}","${transaction.transaction_type}","${transaction.qty_in || ''}","${transaction.qty_out || ''}","${transaction.work_type || ''}","${transaction.unit || ''}","${transaction.rate_applied || ''}","${transaction.billed_amount || ''}"\n`
    })

    const timestamp = new Date().toISOString().split('T')[0]
    const clientName = options.clientId ? 
      this.getClientName(options.clientId, data.clients).replace(/[^a-zA-Z0-9]/g, '_') : 
      'All_Clients'
    const filename = `BRS_Template_Report_${clientName}_${timestamp}.csv`

    return { content: csvContent, filename }
  }

  // PDF Export Methods
  static async exportToPDF(data: ExportData, options: ExportOptions): Promise<void> {
    const doc = new jsPDF()

    switch (options.reportType) {
      case 'summary':
        this.createSummaryPDF(doc, data, options)
        break
      case 'detailed':
        this.createDetailedPDF(doc, data, options)
        break
      case 'transactions':
        this.createTransactionsPDF(doc, data, options)
        break
      case 'components':
        this.createComponentsPDF(doc, data, options)
        break
      case 'balance':
        this.createBalancePDF(doc, data, options)
        break
      case 'template':
        this.createTemplatePDF(doc, data, options)
        break
      default:
        throw new Error(`PDF export not implemented for ${options.reportType}`)
    }

    // Generate filename and save
    const timestamp = new Date().toISOString().split('T')[0]
    const clientName = options.clientId ? 
      this.getClientName(options.clientId, data.clients).replace(/[^a-zA-Z0-9]/g, '_') : 
      'All_Clients'
    const filename = `BRS_${options.reportType}_${clientName}_${timestamp}.pdf`

    doc.save(filename)
  }

  private static createSummaryPDF(doc: jsPDF, data: ExportData, options: ExportOptions) {
    // Header
    doc.setFontSize(18)
    doc.text('BRS MANAGEMENT SYSTEM', 20, 20)
    doc.setFontSize(14)
    doc.text('Client Summary Report', 20, 30)
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 20, 40)

    // Prepare table data
    const tableData = data.clients.map(client => {
      const clientTransactions = data.transactions.filter(t => t.client_id === client.id)
      const totalReceived = clientTransactions
        .filter(t => t.transaction_type === 'Received')
        .reduce((sum, t) => sum + (t.qty_in || 0), 0)
      const totalDelivered = clientTransactions
        .filter(t => t.transaction_type === 'Delivered')
        .reduce((sum, t) => sum + (t.qty_out || 0), 0)
      const totalBilled = clientTransactions
        .reduce((sum, t) => sum + (t.billed_amount || 0), 0)

      return [
        client.name,
        client.contact_person || 'N/A',
        clientTransactions.length.toString(),
        totalReceived.toString(),
        totalDelivered.toString(),
        (totalReceived - totalDelivered).toString(),
        this.formatCurrency(totalBilled)
      ]
    })

    // Create table
    autoTable(doc, {
      head: [['Client', 'Contact', 'Transactions', 'Received', 'Delivered', 'Balance', 'Total Billed']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    })
  }

  private static createTransactionsPDF(doc: jsPDF, data: ExportData, options: ExportOptions) {
    let transactions = data.transactions

    // Filter by client if specified
    if (options.clientId) {
      transactions = transactions.filter(t => t.client_id === options.clientId)
    }

    // Header
    doc.setFontSize(18)
    doc.text('BRS MANAGEMENT SYSTEM', 20, 20)
    doc.setFontSize(14)
    const clientName = options.clientId ? 
      this.getClientName(options.clientId, data.clients) : 
      'All Clients'
    doc.text(`Transaction Report - ${clientName}`, 20, 30)
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 20, 40)

    // Prepare table data
    const tableData = transactions.slice(0, 50).map(transaction => [ // Limit for PDF
      this.formatDate(transaction.date),
      this.getClientName(transaction.client_id, data.clients),
      transaction.dc_no,
      transaction.component,
      transaction.transaction_type,
      (transaction.qty_in || transaction.qty_out || 0).toString(),
      transaction.billed_amount ? this.formatCurrency(transaction.billed_amount) : ''
    ])

    // Create table
    autoTable(doc, {
      head: [['Date', 'Client', 'DC No', 'Component', 'Type', 'Quantity', 'Billed']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [66, 139, 202] }
    })

    if (transactions.length > 50) {
      const finalY = (doc as any).lastAutoTable.finalY || 50
      doc.text(`Note: Showing first 50 transactions out of ${transactions.length} total.`, 20, finalY + 10)
    }
  }

  private static createDetailedPDF(doc: jsPDF, data: ExportData, options: ExportOptions) {
    // Header
    doc.setFontSize(18)
    doc.text('BRS MANAGEMENT SYSTEM', 20, 20)
    doc.setFontSize(14)
    doc.text('Detailed Business Report', 20, 30)
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 20, 40)

    let currentY = 50

    // Overview Section
    doc.setFontSize(12)
    doc.text('BUSINESS OVERVIEW', 20, currentY)
    currentY += 10

    const totalClients = data.clients.length
    const activeClients = data.clients.filter(c => 
      data.transactions.some(t => t.client_id === c.id)
    ).length
    const totalTransactions = data.transactions.length
    const totalBilled = data.transactions.reduce((sum, t) => sum + (t.billed_amount || 0), 0)

    doc.setFontSize(10)
    doc.text(`Total Clients: ${totalClients}`, 20, currentY)
    doc.text(`Active Clients: ${activeClients}`, 20, currentY + 10)
    doc.text(`Total Transactions: ${totalTransactions}`, 20, currentY + 20)
    doc.text(`Total Billed: ${this.formatCurrency(totalBilled)}`, 20, currentY + 30)

    currentY += 50

    // Client Summary Table
    const clientTableData = data.clients.slice(0, 20).map(client => {
      const clientTransactions = data.transactions.filter(t => t.client_id === client.id)
      const totalReceived = clientTransactions
        .filter(t => t.transaction_type === 'Received')
        .reduce((sum, t) => sum + (t.qty_in || 0), 0)
      const totalDelivered = clientTransactions
        .filter(t => t.transaction_type === 'Delivered')
        .reduce((sum, t) => sum + (t.qty_out || 0), 0)
      const totalBilled = clientTransactions
        .reduce((sum, t) => sum + (t.billed_amount || 0), 0)

      return [
        client.name,
        clientTransactions.length.toString(),
        totalReceived.toString(),
        totalDelivered.toString(),
        this.formatCurrency(totalBilled)
      ]
    })

    autoTable(doc, {
      head: [['Client', 'Transactions', 'Received', 'Delivered', 'Total Billed']],
      body: clientTableData,
      startY: currentY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    })

    if (data.clients.length > 20) {
      const finalY = (doc as any).lastAutoTable.finalY || currentY
      doc.text(`Note: Showing first 20 clients out of ${data.clients.length} total.`, 20, finalY + 10)
    }
  }

  private static createComponentsPDF(doc: jsPDF, data: ExportData, options: ExportOptions) {
    // Analyze components
    const componentAnalysis = new Map<string, {
      totalTransactions: number
      totalQuantity: number
      totalBilled: number
      clients: Set<string>
    }>()

    data.transactions.forEach(transaction => {
      const component = transaction.component
      if (!componentAnalysis.has(component)) {
        componentAnalysis.set(component, {
          totalTransactions: 0,
          totalQuantity: 0,
          totalBilled: 0,
          clients: new Set()
        })
      }

      const analysis = componentAnalysis.get(component)!
      analysis.totalTransactions++
      analysis.totalQuantity += (transaction.qty_out || transaction.qty_in || 0)
      analysis.totalBilled += (transaction.billed_amount || 0)
      analysis.clients.add(transaction.client_id)
    })

    // Header
    doc.setFontSize(18)
    doc.text('BRS MANAGEMENT SYSTEM', 20, 20)
    doc.setFontSize(14)
    doc.text('Component Analysis Report', 20, 30)
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 20, 40)

    // Prepare table data
    const tableData = Array.from(componentAnalysis.entries())
      .sort(([,a], [,b]) => b.totalBilled - a.totalBilled)
      .slice(0, 30) // Limit for PDF
      .map(([component, analysis]) => {
        const avgRate = analysis.totalQuantity > 0 ? analysis.totalBilled / analysis.totalQuantity : 0
        return [
          component,
          analysis.totalTransactions.toString(),
          analysis.totalQuantity.toString(),
          this.formatCurrency(analysis.totalBilled),
          analysis.clients.size.toString(),
          this.formatCurrency(avgRate)
        ]
      })

    // Create table
    autoTable(doc, {
      head: [['Component', 'Transactions', 'Quantity', 'Total Billed', 'Clients', 'Avg Rate']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [66, 139, 202] }
    })

    if (componentAnalysis.size > 30) {
      const finalY = (doc as any).lastAutoTable.finalY || 50
      doc.text(`Note: Showing top 30 components out of ${componentAnalysis.size} total.`, 20, finalY + 10)
    }
  }

  private static createBalancePDF(doc: jsPDF, data: ExportData, options: ExportOptions) {
    // Header
    doc.setFontSize(18)
    doc.text('BRS MANAGEMENT SYSTEM', 20, 20)
    doc.setFontSize(14)
    const clientName = options.clientId ? 
      this.getClientName(options.clientId, data.clients) : 
      'All Clients'
    doc.text(`Balance Summary - ${clientName}`, 20, 30)
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 20, 40)

    // Prepare table data
    const tableData = data.balanceSummary.slice(0, 40).map(item => {
      const status = item.balance > 0 ? 'Surplus' : item.balance < 0 ? 'Deficit' : 'Balanced'
      return [
        item.component,
        item.lot_no,
        item.total_in.toString(),
        item.total_out.toString(),
        item.balance.toString(),
        status
      ]
    })

    // Create table
    autoTable(doc, {
      head: [['Component', 'Lot No', 'Total In', 'Total Out', 'Balance', 'Status']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    })

    if (data.balanceSummary.length > 40) {
      const finalY = (doc as any).lastAutoTable.finalY || 50
      doc.text(`Note: Showing first 40 items out of ${data.balanceSummary.length} total.`, 20, finalY + 10)
    }
  }

  private static createTemplatePDF(doc: jsPDF, data: ExportData, options: ExportOptions) {
    // Header
    doc.setFontSize(18)
    doc.text('BRS MANAGEMENT SYSTEM', 20, 20)
    doc.setFontSize(14)
    const clientName = options.clientId ? 
      this.getClientName(options.clientId, data.clients) : 
      'All Clients'
    doc.text(`Comprehensive Business Report - ${clientName}`, 20, 30)
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 20, 40)

    let currentY = 50

    // Business Overview
    doc.setFontSize(12)
    doc.text('BUSINESS OVERVIEW', 20, currentY)
    currentY += 10

    const totalClients = data.clients.length
    const activeClients = data.clients.filter(c => 
      data.transactions.some(t => t.client_id === c.id)
    ).length
    const totalTransactions = data.transactions.length
    const totalBilled = data.transactions.reduce((sum, t) => sum + (t.billed_amount || 0), 0)
    const totalReceived = data.transactions
      .filter(t => t.transaction_type === 'Received')
      .reduce((sum, t) => sum + (t.qty_in || 0), 0)
    const totalDelivered = data.transactions
      .filter(t => t.transaction_type === 'Delivered')
      .reduce((sum, t) => sum + (t.qty_out || 0), 0)

    doc.setFontSize(10)
    doc.text(`Total Clients: ${totalClients} (${activeClients} active)`, 20, currentY)
    doc.text(`Total Transactions: ${totalTransactions}`, 20, currentY + 10)
    doc.text(`Total Received: ${totalReceived} units`, 20, currentY + 20)
    doc.text(`Total Delivered: ${totalDelivered} units`, 20, currentY + 30)
    doc.text(`Current Balance: ${totalReceived - totalDelivered} units`, 20, currentY + 40)
    doc.text(`Total Billed: ${this.formatCurrency(totalBilled)}`, 20, currentY + 50)

    currentY += 70

    // Client Summary (limited for PDF)
    doc.setFontSize(12)
    doc.text('TOP CLIENTS', 20, currentY)
    currentY += 10

    const topClients = data.clients
      .map(client => {
        const clientTransactions = data.transactions.filter(t => t.client_id === client.id)
        const totalBilled = clientTransactions.reduce((sum, t) => sum + (t.billed_amount || 0), 0)
        return { client, totalBilled, transactions: clientTransactions.length }
      })
      .sort((a, b) => b.totalBilled - a.totalBilled)
      .slice(0, 10)

    const clientTableData = topClients.map(({ client, totalBilled, transactions }) => [
      client.name,
      transactions.toString(),
      this.formatCurrency(totalBilled)
    ])

    autoTable(doc, {
      head: [['Client Name', 'Transactions', 'Total Billed']],
      body: clientTableData,
      startY: currentY,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] }
    })

    // Add new page for more content if needed
    if (data.transactions.length > 0) {
      doc.addPage()
      
      // Recent Transactions
      doc.setFontSize(12)
      doc.text('RECENT TRANSACTIONS', 20, 20)
      
      const recentTransactions = data.transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20)

      const transactionTableData = recentTransactions.map(transaction => [
        this.formatDate(transaction.date),
        this.getClientName(transaction.client_id, data.clients),
        transaction.component,
        transaction.transaction_type,
        (transaction.qty_in || transaction.qty_out || 0).toString(),
        transaction.billed_amount ? this.formatCurrency(transaction.billed_amount) : ''
      ])

      autoTable(doc, {
        head: [['Date', 'Client', 'Component', 'Type', 'Quantity', 'Billed']],
        body: transactionTableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      })
    }
  }
}
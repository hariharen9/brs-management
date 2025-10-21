import * as XLSX from 'xlsx'
import type { Client, Transaction, BalanceSummaryItem } from '../types'

export interface BRSExportData {
  clients: Client[]
  transactions: Transaction[]
  balanceSummary: BalanceSummaryItem[]
  dateRange?: {
    start: string
    end: string
  }
}

export class TemplateBasedExportService {
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

  static async exportUsingTemplate(data: BRSExportData, clientId?: string): Promise<void> {
    const workbook = XLSX.utils.book_new()

    // Create sheets based on your template structure
    await this.createSheet1_ClientSummary(workbook, data)
    await this.createSheet2_TransactionDetails(workbook, data, clientId)
    await this.createSheet3_ComponentAnalysis(workbook, data)
    await this.createSheet4_BalanceSummary(workbook, data, clientId)
    await this.createSheet5_MonthlyReport(workbook, data, clientId)

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const clientName = clientId ? 
      this.getClientName(clientId, data.clients).replace(/[^a-zA-Z0-9]/g, '_') : 
      'All_Clients'
    const filename = `BRS_Report_${clientName}_${timestamp}.xlsx`

    // Save file
    XLSX.writeFile(workbook, filename)
  }

  private static async createSheet1_ClientSummary(workbook: XLSX.WorkBook, data: BRSExportData) {
    const sheetData = []

    // Header section (matching your template)
    sheetData.push(['BRS MANAGEMENT SYSTEM'])
    sheetData.push(['CLIENT SUMMARY REPORT'])
    sheetData.push([`Generated on: ${new Date().toLocaleString('en-IN')}`])
    sheetData.push([]) // Empty row

    // Summary statistics
    const totalClients = data.clients.length
    const activeClients = data.clients.filter(c => 
      data.transactions.some(t => t.client_id === c.id)
    ).length
    const totalTransactions = data.transactions.length
    const totalBilled = data.transactions.reduce((sum, t) => sum + (t.billed_amount || 0), 0)

    sheetData.push(['OVERVIEW'])
    sheetData.push(['Total Clients:', totalClients])
    sheetData.push(['Active Clients:', activeClients])
    sheetData.push(['Total Transactions:', totalTransactions])
    sheetData.push(['Total Billed Amount:', this.formatCurrency(totalBilled)])
    sheetData.push([]) // Empty row

    // Client details table
    sheetData.push(['CLIENT DETAILS'])
    sheetData.push(['S.No', 'Client Name', 'Contact Person', 'Total Transactions', 'Total Received', 'Total Delivered', 'Current Balance', 'Total Billed'])

    data.clients.forEach((client, index) => {
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

      sheetData.push([
        index + 1,
        client.name,
        client.contact_person || 'N/A',
        clientTransactions.length,
        totalReceived,
        totalDelivered,
        currentBalance,
        this.formatCurrency(totalBilled)
      ])
    })

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
    
    // Set column widths (matching your template)
    worksheet['!cols'] = [
      { width: 8 },   // S.No
      { width: 25 },  // Client Name
      { width: 20 },  // Contact Person
      { width: 15 },  // Total Transactions
      { width: 15 },  // Total Received
      { width: 15 },  // Total Delivered
      { width: 15 },  // Current Balance
      { width: 18 }   // Total Billed
    ]

    // Add styling (headers, borders, etc.)
    this.applyHeaderStyling(worksheet, 7, 8) // Header row styling

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Client Summary')
  }

  private static async createSheet2_TransactionDetails(workbook: XLSX.WorkBook, data: BRSExportData, clientId?: string) {
    let transactions = data.transactions

    // Filter by client if specified
    if (clientId) {
      transactions = transactions.filter(t => t.client_id === clientId)
    }

    const sheetData = []

    // Header section
    const clientName = clientId ? 
      this.getClientName(clientId, data.clients) : 
      'All Clients'
    
    sheetData.push(['BRS MANAGEMENT SYSTEM'])
    sheetData.push([`TRANSACTION DETAILS - ${clientName}`])
    sheetData.push([`Generated on: ${new Date().toLocaleString('en-IN')}`])
    if (data.dateRange) {
      sheetData.push([`Period: ${this.formatDate(data.dateRange.start)} to ${this.formatDate(data.dateRange.end)}`])
    }
    sheetData.push([]) // Empty row

    // Transaction table headers
    sheetData.push(['S.No', 'Date', 'Client', 'DC No', 'Component', 'Lot No', 'Type', 'Qty In', 'Qty Out', 'Work Type', 'Unit', 'Rate', 'Billed Amount'])

    // Transaction data
    transactions.forEach((transaction, index) => {
      sheetData.push([
        index + 1,
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

    // Summary section
    const totalBilled = transactions.reduce((sum, t) => sum + (t.billed_amount || 0), 0)
    const totalReceived = transactions
      .filter(t => t.transaction_type === 'Received')
      .reduce((sum, t) => sum + (t.qty_in || 0), 0)
    const totalDelivered = transactions
      .filter(t => t.transaction_type === 'Delivered')
      .reduce((sum, t) => sum + (t.qty_out || 0), 0)

    sheetData.push([]) // Empty row
    sheetData.push(['SUMMARY'])
    sheetData.push(['Total Transactions:', transactions.length])
    sheetData.push(['Total Received:', totalReceived, 'units'])
    sheetData.push(['Total Delivered:', totalDelivered, 'units'])
    sheetData.push(['Current Balance:', totalReceived - totalDelivered, 'units'])
    sheetData.push(['Total Billed:', this.formatCurrency(totalBilled)])

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 8 },   // S.No
      { width: 12 },  // Date
      { width: 20 },  // Client
      { width: 12 },  // DC No
      { width: 20 },  // Component
      { width: 15 },  // Lot No
      { width: 10 },  // Type
      { width: 10 },  // Qty In
      { width: 10 },  // Qty Out
      { width: 15 },  // Work Type
      { width: 10 },  // Unit
      { width: 12 },  // Rate
      { width: 15 }   // Billed Amount
    ]

    // Find header row and apply styling
    const headerRowIndex = sheetData.findIndex(row => row[0] === 'S.No')
    if (headerRowIndex >= 0) {
      this.applyHeaderStyling(worksheet, headerRowIndex, 13)
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaction Details')
  }

  private static async createSheet3_ComponentAnalysis(workbook: XLSX.WorkBook, data: BRSExportData) {
    // Analyze components
    const componentAnalysis = new Map<string, {
      totalTransactions: number
      totalQuantity: number
      totalBilled: number
      clients: Set<string>
      receivedQty: number
      deliveredQty: number
    }>()

    data.transactions.forEach(transaction => {
      const component = transaction.component
      if (!componentAnalysis.has(component)) {
        componentAnalysis.set(component, {
          totalTransactions: 0,
          totalQuantity: 0,
          totalBilled: 0,
          clients: new Set(),
          receivedQty: 0,
          deliveredQty: 0
        })
      }

      const analysis = componentAnalysis.get(component)!
      analysis.totalTransactions++
      analysis.totalBilled += (transaction.billed_amount || 0)
      analysis.clients.add(transaction.client_id)
      
      if (transaction.transaction_type === 'Received') {
        analysis.receivedQty += (transaction.qty_in || 0)
      } else {
        analysis.deliveredQty += (transaction.qty_out || 0)
      }
      analysis.totalQuantity = analysis.receivedQty + analysis.deliveredQty
    })

    const sheetData = []

    // Header section
    sheetData.push(['BRS MANAGEMENT SYSTEM'])
    sheetData.push(['COMPONENT ANALYSIS REPORT'])
    sheetData.push([`Generated on: ${new Date().toLocaleString('en-IN')}`])
    sheetData.push([]) // Empty row

    // Component analysis table
    sheetData.push(['S.No', 'Component', 'Total Transactions', 'Received Qty', 'Delivered Qty', 'Balance', 'Total Billed', 'Clients Count', 'Avg Rate'])

    let serialNo = 1
    Array.from(componentAnalysis.entries())
      .sort(([,a], [,b]) => b.totalBilled - a.totalBilled) // Sort by total billed
      .forEach(([component, analysis]) => {
        const balance = analysis.receivedQty - analysis.deliveredQty
        const avgRate = analysis.totalQuantity > 0 ? analysis.totalBilled / analysis.totalQuantity : 0
        
        sheetData.push([
          serialNo++,
          component,
          analysis.totalTransactions,
          analysis.receivedQty,
          analysis.deliveredQty,
          balance,
          this.formatCurrency(analysis.totalBilled),
          analysis.clients.size,
          this.formatCurrency(avgRate)
        ])
      })

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 8 },   // S.No
      { width: 25 },  // Component
      { width: 15 },  // Total Transactions
      { width: 12 },  // Received Qty
      { width: 12 },  // Delivered Qty
      { width: 10 },  // Balance
      { width: 15 },  // Total Billed
      { width: 12 },  // Clients Count
      { width: 12 }   // Avg Rate
    ]

    // Apply header styling
    const headerRowIndex = sheetData.findIndex(row => row[0] === 'S.No')
    if (headerRowIndex >= 0) {
      this.applyHeaderStyling(worksheet, headerRowIndex, 9)
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Component Analysis')
  }

  private static async createSheet4_BalanceSummary(workbook: XLSX.WorkBook, data: BRSExportData, clientId?: string) {
    const sheetData = []

    // Header section
    const clientName = clientId ? 
      this.getClientName(clientId, data.clients) : 
      'All Clients'
    
    sheetData.push(['BRS MANAGEMENT SYSTEM'])
    sheetData.push([`BALANCE SUMMARY - ${clientName}`])
    sheetData.push([`Generated on: ${new Date().toLocaleString('en-IN')}`])
    sheetData.push([]) // Empty row

    // Balance summary table
    sheetData.push(['S.No', 'Component', 'Received', 'Delivered', 'Balance', 'Status'])

    let serialNo = 1
    data.balanceSummary.forEach(item => {
      const status = item.balance > 0 ? 'Surplus' : item.balance < 0 ? 'Deficit' : 'Balanced'
      
      sheetData.push([
        serialNo++,
        item.component,
        item.total_in,
        item.total_out,
        item.balance,
        status
      ])
    })

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 8 },   // S.No
      { width: 25 },  // Component
      { width: 12 },  // Received
      { width: 12 },  // Delivered
      { width: 12 },  // Balance
      { width: 12 }   // Status
    ]

    // Apply header styling
    const headerRowIndex = sheetData.findIndex(row => row[0] === 'S.No')
    if (headerRowIndex >= 0) {
      this.applyHeaderStyling(worksheet, headerRowIndex, 6)
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Balance Summary')
  }

  private static async createSheet5_MonthlyReport(workbook: XLSX.WorkBook, data: BRSExportData, clientId?: string) {
    let transactions = data.transactions

    // Filter by client if specified
    if (clientId) {
      transactions = transactions.filter(t => t.client_id === clientId)
    }

    // Group transactions by month
    const monthlyData = new Map<string, {
      received: number
      delivered: number
      billed: number
      transactions: number
    }>()

    transactions.forEach(transaction => {
      const monthKey = new Date(transaction.date).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long' 
      })
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          received: 0,
          delivered: 0,
          billed: 0,
          transactions: 0
        })
      }

      const monthData = monthlyData.get(monthKey)!
      monthData.transactions++
      monthData.billed += (transaction.billed_amount || 0)
      
      if (transaction.transaction_type === 'Received') {
        monthData.received += (transaction.qty_in || 0)
      } else {
        monthData.delivered += (transaction.qty_out || 0)
      }
    })

    const sheetData = []

    // Header section
    const clientName = clientId ? 
      this.getClientName(clientId, data.clients) : 
      'All Clients'
    
    sheetData.push(['BRS MANAGEMENT SYSTEM'])
    sheetData.push([`MONTHLY REPORT - ${clientName}`])
    sheetData.push([`Generated on: ${new Date().toLocaleString('en-IN')}`])
    sheetData.push([]) // Empty row

    // Monthly data table
    sheetData.push(['S.No', 'Month', 'Transactions', 'Received', 'Delivered', 'Net Balance', 'Total Billed'])

    let serialNo = 1
    Array.from(monthlyData.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .forEach(([month, data]) => {
        const netBalance = data.received - data.delivered
        
        sheetData.push([
          serialNo++,
          month,
          data.transactions,
          data.received,
          data.delivered,
          netBalance,
          this.formatCurrency(data.billed)
        ])
      })

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 8 },   // S.No
      { width: 15 },  // Month
      { width: 12 },  // Transactions
      { width: 12 },  // Received
      { width: 12 },  // Delivered
      { width: 12 },  // Net Balance
      { width: 15 }   // Total Billed
    ]

    // Apply header styling
    const headerRowIndex = sheetData.findIndex(row => row[0] === 'S.No')
    if (headerRowIndex >= 0) {
      this.applyHeaderStyling(worksheet, headerRowIndex, 7)
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report')
  }

  private static applyHeaderStyling(worksheet: XLSX.WorkSheet, rowIndex: number, colCount: number) {
    // This is a simplified version - in a real implementation, you'd apply more detailed styling
    // SheetJS community edition has limited styling support
    // For full styling, you'd need SheetJS Pro or use a different approach
    
    const range = XLSX.utils.encode_range({
      s: { c: 0, r: rowIndex },
      e: { c: colCount - 1, r: rowIndex }
    })
    
    if (!worksheet['!ref']) {
      worksheet['!ref'] = range
    }
  }
}
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Package, Truck, Scale, DollarSign, MoreHorizontal, Edit, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { KPICard } from './KPICard'
import { TransactionForm } from './TransactionForm'
import { AddClientForm } from './AddClientForm'
import { EditClientForm } from './EditClientForm'
import { DeleteClientDialog } from './DeleteClientDialog'
import { ConfirmationDialog } from './ConfirmationDialog'
import { LoadingState, CardLoading } from './ui/loading'
import { EmptyState, TableEmptyState } from './ui/empty-state'
import { GlobalSearch } from './GlobalSearch'
import { SearchTrigger } from './SearchTrigger'
import { ExportDialog } from './ExportDialog'
import { ExportButton } from './ExportButton'
import { BillingModal } from './BillingModal'
import { useClients } from '../hooks/useClients'
import { useClientKPIs, useBalanceSummary, useTransactions, useDeleteTransaction } from '../hooks/useTransactions'
import type { Transaction, Client } from '../types'
import { BalanceSummaryTable } from './BalanceSummaryTable'
import { TransactionLogTable } from './TransactionLogTable'
import { handleError, showSuccessToast } from '../lib/errorHandling'

export function ClientDashboard() {
  const [activeClientId, setActiveClientId] = useState<string>('')
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false)
  const [isAddClientFormOpen, setIsAddClientFormOpen] = useState(false)
  const [isEditClientFormOpen, setIsEditClientFormOpen] = useState(false)
  const [isDeleteClientDialogOpen, setIsDeleteClientDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  const [isDeleteTransactionDialogOpen, setIsDeleteTransactionDialogOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false)
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useClients()
  
  // Set first client as active if none selected
  if (!activeClientId && clients.length > 0) {
    setActiveClientId(clients[0].id)
  }

  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useClientKPIs(activeClientId)
  const { data: balanceSummary = [], isLoading: balanceLoading, error: balanceError } = useBalanceSummary(activeClientId)
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useTransactions(activeClientId)
  const deleteTransaction = useDeleteTransaction()

  const activeClient = clients.find(c => c.id === activeClientId)

  // Filter transactions by selected month
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`
    return transactionMonth === selectedMonth
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Reset to first page when month or items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedMonth, itemsPerPage, activeClientId])

  // Month navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const currentDate = new Date(year, month - 1)
    
    if (direction === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1)
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    const newMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(newMonth)
  }

  const getMonthLabel = (monthString: string) => {
    const [year, month] = monthString.split('-').map(Number)
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchResultSelect = (result: any) => {
    if (result.type === 'client' && result.clientId) {
      setActiveClientId(result.clientId)
      showSuccessToast(`Switched to ${result.title}`)
    } else if (result.type === 'transaction' && result.clientId) {
      setActiveClientId(result.clientId)
      showSuccessToast(`Found transaction in ${result.metadata?.clientName || 'client'}`)
    } else if (result.type === 'component') {
      // For components, we could show all transactions with that component
      // For now, just show a success message
      showSuccessToast(`Found component: ${result.title}`)
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsTransactionFormOpen(true)
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    setTransactionToDelete(transactionId)
    setIsDeleteTransactionDialogOpen(true)
  }

  const confirmDeleteTransaction = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction.mutateAsync(transactionToDelete)
        setTransactionToDelete(null)
        showSuccessToast('Transaction deleted successfully')
      } catch (error) {
        handleError(error, 'deleting transaction')
      }
    }
  }

  const handleCloseTransactionForm = (open: boolean) => {
    setIsTransactionFormOpen(open)
    if (!open) {
      setEditingTransaction(null)
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setIsEditClientFormOpen(true)
  }

  const handleDeleteClient = (client: Client) => {
    setEditingClient(client)
    setIsDeleteClientDialogOpen(true)
  }

  const handleCloseEditClientForm = (open: boolean) => {
    setIsEditClientFormOpen(open)
    if (!open) {
      setEditingClient(null)
    }
  }

  const handleCloseDeleteClientDialog = (open: boolean) => {
    setIsDeleteClientDialogOpen(open)
    if (!open) {
      setEditingClient(null)
    }
  }

  if (clientsLoading) {
    return <LoadingState message="Loading clients..." size="lg" className="h-64" />
  }

  if (clientsError) {
    return (
      <EmptyState
        icon={<Package className="w-8 h-8" />}
        title="Failed to Load Clients"
        description="There was an error loading your clients. Please try refreshing the page."
        action={{
          label: "Refresh Page",
          onClick: () => window.location.reload(),
          variant: "outline"
        }}
      />
    )
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={<Plus className="w-8 h-8" />}
        title="No Clients Found"
        description="Get started by adding your first client to begin managing transactions and rates."
        action={{
          label: "Add First Client",
          onClick: () => setIsAddClientFormOpen(true)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Search and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your clients and transactions</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <ExportButton onClick={() => setIsExportDialogOpen(true)} />
          <SearchTrigger onClick={() => setIsSearchOpen(true)} />
        </div>
      </div>

      <Tabs value={activeClientId} onValueChange={setActiveClientId} className="w-full">
        <div className="border-b border-border bg-gradient-to-r from-gray-50 to-slate-50">
          <TabsList className="h-auto bg-transparent p-0 w-full justify-start">
            <div className="flex items-center space-x-1 overflow-x-auto pb-2 pt-2 px-2 w-full scrollbar-hide">
              {clients.map((client) => (
                <div key={client.id} className="relative group flex-shrink-0">
                  <TabsTrigger 
                    value={client.id} 
                    className="relative px-3 lg:px-6 py-2 lg:py-3 text-xs lg:text-sm font-medium transition-all hover:text-primary hover:bg-blue-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-100 data-[state=active]:to-blue-50 data-[state=active]:text-blue-800 data-[state=active]:shadow-md border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-t-lg whitespace-nowrap bg-transparent pr-8 lg:pr-10 min-w-0"
                  >
                    <span className="truncate max-w-24 lg:max-w-none">
                      {client.name}
                    </span>
                  </TabsTrigger>
                  
                  {/* Client Actions Dropdown */}
                  <div className="absolute right-1 lg:right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 w-5 lg:h-6 lg:w-6 p-0 hover:bg-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClient(client)
                          }}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClient(client)
                          }}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              <TabsTrigger 
                value="add-client" 
                className="relative px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm font-medium transition-all hover:text-primary data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-t-lg flex items-center space-x-1 lg:space-x-2 bg-transparent flex-shrink-0"
              >
                <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Add Client</span>
                <span className="sm:hidden">Add</span>
              </TabsTrigger>
            </div>
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          {clients.map((client) => (
            <TabsContent key={client.id} value={client.id} className="space-y-8 pt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Client Header */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl p-4 sm:p-6 lg:p-8 text-white shadow-xl border border-blue-500/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                        <span className="text-lg sm:text-2xl font-bold text-white">
                          {client.name.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 flex items-center">
                          <span className="truncate">{client.name}</span>
                          <div className="ml-2 sm:ml-3 w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                        </h2>
                        {client.gst_number && (
                          <p className="text-blue-100 flex items-center text-sm sm:text-base">
                            <span className="w-2 h-2 bg-blue-300 rounded-full mr-2 flex-shrink-0"></span>
                            <span className="truncate">GST: {client.gst_number}</span>
                          </p>
                        )}
                        {client.address && (
                          <p className="text-blue-100 flex items-center text-sm sm:text-base">
                            <span className="w-2 h-2 bg-blue-300 rounded-full mr-2 flex-shrink-0"></span>
                            <span className="truncate">Address: {client.address}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI Cards */}
                {kpisLoading ? (
                  <CardLoading count={4} />
                ) : kpisError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-600 text-sm">Failed to load KPI data</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                    <KPICard
                      title="Total Received"
                      value={kpis?.totalReceived || 0}
                      icon={<Package className="w-4 h-4 lg:w-5 lg:h-5" />}
                      suffix=" units"
                      color="blue"
                      compact={true}
                    />
                    <KPICard
                      title="Total Delivered"
                      value={kpis?.totalDelivered || 0}
                      icon={<Truck className="w-4 h-4 lg:w-5 lg:h-5" />}
                      suffix=" units"
                      color="green"
                      compact={true}
                    />
                    <KPICard
                      title="Current Balance"
                      value={kpis?.currentBalance || 0}
                      icon={<Scale className="w-4 h-4 lg:w-5 lg:h-5" />}
                      suffix=" units"
                      color={(kpis?.currentBalance || 0) < 0 ? 'red' : 'orange'}
                      compact={true}
                    />
                    <KPICard
                      title="Total Billed"
                      value={kpis?.totalBilled || 0}
                      icon={<DollarSign className="w-4 h-4 lg:w-5 lg:h-5" />}
                      prefix="₹"
                      color="purple"
                      compact={true}
                    />
                  </div>
                )}

                {/* Balance Summary */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">Balance Summary</h3>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                  {balanceLoading ? (
                    <LoadingState message="Loading balance summary..." />
                  ) : balanceError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <p className="text-red-600 text-sm">Failed to load balance summary</p>
                    </div>
                  ) : balanceSummary.length === 0 ? (
                    <TableEmptyState
                      title="No Balance Data"
                      description="Balance summary will appear here once transactions are added."
                      action={{
                        label: "Add Transaction",
                        onClick: () => setIsTransactionFormOpen(true)
                      }}
                    />
                  ) : (
                    <BalanceSummaryTable data={balanceSummary} />
                  )}
                </div>

                {/* Transaction Log */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">Transaction History</h3>
                      <div className="hidden sm:block flex-1 h-px bg-gray-200"></div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsBillingModalOpen(true)}
                        className="bg-white hover:bg-gray-50 border-green-200 text-green-700 hover:text-green-800 text-xs sm:text-sm"
                      >
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">Billing</span>
                        <span className="xs:hidden">Generate Bill</span>
                      </Button>
                      {/* <ExportButton 
                        onClick={() => setIsExportDialogOpen(true)}
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-gray-50 text-xs sm:text-sm"
                      /> */}
                      <Button 
                        onClick={() => setIsTransactionFormOpen(true)}
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">Add Transaction</span>
                        <span className="xs:hidden">Add</span>
                      </Button>
                    </div>
                  </div>

                  {/* Month Navigation and Pagination Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-4">
                      {/* Month Navigation */}
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Month:</span>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateMonth('prev')}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <div className="px-3 py-1 bg-white border rounded text-sm font-medium min-w-[120px] text-center">
                            {getMonthLabel(selectedMonth)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateMonth('next')}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Items per page */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Show:</span>
                        <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Pagination Info */}
                      {filteredTransactions.length > 0 && (
                        <div className="text-sm text-gray-600">
                          {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length}
                        </div>
                      )}
                    </div>
                  </div>
                  {transactionsLoading ? (
                    <LoadingState message="Loading transactions..." />
                  ) : transactionsError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <p className="text-red-600 text-sm">Failed to load transactions</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <TableEmptyState
                      title="No Transactions Yet"
                      description="Start by adding your first transaction for this client."
                      action={{
                        label: "Add First Transaction",
                        onClick: () => setIsTransactionFormOpen(true)
                      }}
                    />
                  ) : filteredTransactions.length === 0 ? (
                    <TableEmptyState
                      title="No Transactions This Month"
                      description={`No transactions found for ${getMonthLabel(selectedMonth)}. Try a different month or add a new transaction.`}
                      action={{
                        label: "Add Transaction",
                        onClick: () => setIsTransactionFormOpen(true)
                      }}
                    />
                  ) : (
                    <>
                      <TransactionLogTable 
                        data={paginatedTransactions} 
                        onEdit={handleEditTransaction}
                        onDelete={handleDeleteTransaction}
                      />
                      
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="w-4 h-4 mr-1" />
                              Previous
                            </Button>
                            
                            {/* Page Numbers */}
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum
                                if (totalPages <= 5) {
                                  pageNum = i + 1
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i
                                } else {
                                  pageNum = currentPage - 2 + i
                                }
                                
                                return (
                                  <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {pageNum}
                                  </Button>
                                )
                              })}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          ))}
        </AnimatePresence>

        <TabsContent value="add-client" className="pt-6">
          <div className="flex flex-col items-center justify-center h-96 space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Add New Client</h3>
                <p className="text-gray-600 max-w-md">
                  Create a new client profile to start managing their transactions and rates.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setIsAddClientFormOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Client
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction Form */}
      {activeClient && (
        <TransactionForm
          open={isTransactionFormOpen}
          onOpenChange={handleCloseTransactionForm}
          clientId={activeClient.id}
          clientName={activeClient.name}
          editingTransaction={editingTransaction}
        />
      )}

      {/* Add Client Form */}
      <AddClientForm
        open={isAddClientFormOpen}
        onOpenChange={setIsAddClientFormOpen}
      />

      {/* Edit Client Form */}
      <EditClientForm
        open={isEditClientFormOpen}
        onOpenChange={handleCloseEditClientForm}
        client={editingClient}
      />

      {/* Delete Client Dialog */}
      <DeleteClientDialog
        open={isDeleteClientDialogOpen}
        onOpenChange={handleCloseDeleteClientDialog}
        client={editingClient}
      />

      {/* Delete Transaction Confirmation */}
      <ConfirmationDialog
        open={isDeleteTransactionDialogOpen}
        onOpenChange={setIsDeleteTransactionDialogOpen}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete Transaction"
        variant="destructive"
        onConfirm={confirmDeleteTransaction}
        isLoading={deleteTransaction.isPending}
      />

      {/* Global Search */}
      <GlobalSearch
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onResultSelect={handleSearchResultSelect}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        defaultClientId={activeClientId}
      />

      {/* Billing Modal */}
      {activeClientId && (
        <BillingModal
          open={isBillingModalOpen}
          onOpenChange={setIsBillingModalOpen}
          clientId={activeClientId}
        />
      )}
    </div>
  )
}
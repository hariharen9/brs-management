import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Package, Truck, Scale, DollarSign, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu'
import { KPICard } from './KPICard'
import { TransactionForm } from './TransactionForm'
import { AddClientForm } from './AddClientForm'
import { EditClientForm } from './EditClientForm'
import { DeleteClientDialog } from './DeleteClientDialog'
import { ConfirmationDialog } from './ConfirmationDialog'
import { LoadingState, CardLoading } from './ui/loading'
import { EmptyState, TableEmptyState } from './ui/empty-state'
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
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl p-8 text-white shadow-xl border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <span className="text-2xl font-bold text-white">
                          {client.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold mb-2 flex items-center">
                          {client.name}
                          <div className="ml-3 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </h2>
                        {client.contact_person && (
                          <p className="text-blue-100 flex items-center">
                            <span className="w-2 h-2 bg-blue-300 rounded-full mr-2"></span>
                            Contact: {client.contact_person}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-100 text-sm">Client ID</div>
                      <div className="text-white font-mono text-xs bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                        {client.id.slice(0, 8)}...
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                      <h3 className="text-xl font-bold text-gray-900">Transaction History</h3>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <Button 
                      onClick={() => setIsTransactionFormOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Transaction
                    </Button>
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
                  ) : (
                    <TransactionLogTable 
                      data={transactions} 
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteTransaction}
                    />
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
    </div>
  )
}
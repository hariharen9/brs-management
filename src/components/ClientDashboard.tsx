import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Package, Truck, Scale, DollarSign } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { KPICard } from './KPICard'
import { TransactionForm } from './TransactionForm'
import { AddClientForm } from './AddClientForm'
import { useClients } from '../hooks/useClients'
import { useClientKPIs, useBalanceSummary, useTransactions } from '../hooks/useTransactions'
import { BalanceSummaryTable } from './BalanceSummaryTable'
import { TransactionLogTable } from './TransactionLogTable'

export function ClientDashboard() {
  const [activeClientId, setActiveClientId] = useState<string>('')
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false)
  const [isAddClientFormOpen, setIsAddClientFormOpen] = useState(false)
  const { data: clients = [], isLoading: clientsLoading } = useClients()
  
  // Set first client as active if none selected
  if (!activeClientId && clients.length > 0) {
    setActiveClientId(clients[0].id)
  }

  const { data: kpis } = useClientKPIs(activeClientId)
  const { data: balanceSummary = [] } = useBalanceSummary(activeClientId)
  const { data: transactions = [] } = useTransactions(activeClientId)

  const activeClient = clients.find(c => c.id === activeClientId)

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">No clients found</p>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add First Client
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeClientId} onValueChange={setActiveClientId} className="w-full">
        <div className="border-b border-border">
          <TabsList className="h-auto bg-transparent p-0 w-full justify-start">
            <div className="flex items-center space-x-1 overflow-x-auto pb-2 w-full">
              {clients.map((client) => (
                <TabsTrigger 
                  key={client.id} 
                  value={client.id} 
                  className="relative px-6 py-3 text-sm font-medium transition-all hover:text-primary data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-t-lg whitespace-nowrap bg-transparent"
                >
                  {client.name}
                </TabsTrigger>
              ))}
              <TabsTrigger 
                value="add-client" 
                className="relative px-4 py-3 text-sm font-medium transition-all hover:text-primary data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-t-lg flex items-center space-x-2 bg-transparent"
              >
                <Plus className="w-4 h-4" />
                <span>Add Client</span>
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
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{client.name}</h2>
                      {client.contact_person && (
                        <p className="text-blue-100 flex items-center">
                          <span className="w-2 h-2 bg-blue-300 rounded-full mr-2"></span>
                          Contact: {client.contact_person}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-blue-100 text-sm">Client ID</div>
                      <div className="text-white font-mono text-xs bg-blue-800/30 px-2 py-1 rounded">
                        {client.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KPICard
                    title="Total Received"
                    value={kpis?.totalReceived || 0}
                    icon={<Package className="w-5 h-5" />}
                    suffix=" units"
                    color="blue"
                  />
                  <KPICard
                    title="Total Delivered"
                    value={kpis?.totalDelivered || 0}
                    icon={<Truck className="w-5 h-5" />}
                    suffix=" units"
                    color="green"
                  />
                  <KPICard
                    title="Current Balance"
                    value={kpis?.currentBalance || 0}
                    icon={<Scale className="w-5 h-5" />}
                    suffix=" units"
                    color={(kpis?.currentBalance || 0) < 0 ? 'red' : 'orange'}
                  />
                  <KPICard
                    title="Total Billed"
                    value={kpis?.totalBilled || 0}
                    icon={<DollarSign className="w-5 h-5" />}
                    prefix="₹"
                    color="purple"
                  />
                </div>

                {/* Balance Summary */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">Balance Summary</h3>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                  <BalanceSummaryTable data={balanceSummary} />
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
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Transaction
                    </Button>
                  </div>
                  <TransactionLogTable data={transactions} />
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
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
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
          onOpenChange={setIsTransactionFormOpen}
          clientId={activeClient.id}
          clientName={activeClient.name}
        />
      )}

      {/* Add Client Form */}
      <AddClientForm
        open={isAddClientFormOpen}
        onOpenChange={setIsAddClientFormOpen}
      />
    </div>
  )
}
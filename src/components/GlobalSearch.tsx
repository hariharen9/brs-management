import { useState, useEffect, useMemo } from 'react'
import { Search, X, User, Package, FileText, Calendar, DollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { SearchHighlight } from './SearchHighlight'
import { useClients } from '../hooks/useClients'
import { useAllTransactions } from '../hooks/useTransactions'
import { useSearchHistory } from '../hooks/useSearchHistory'


interface SearchResult {
  id: string
  type: 'client' | 'transaction' | 'component'
  title: string
  subtitle: string
  description?: string
  metadata?: {
    clientName?: string
    date?: string
    amount?: number
    balance?: number
    transactionType?: string
  }
  clientId?: string
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onResultSelect: (result: SearchResult) => void
}

export function GlobalSearch({ open, onOpenChange, onResultSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeFilter, setActiveFilter] = useState<'all' | 'clients' | 'transactions' | 'components'>('all')
  
  const { data: clients = [] } = useClients()
  const { data: allTransactions = [] } = useAllTransactions()
  const { history, addToHistory } = useSearchHistory()

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setActiveFilter('all')
    }
  }, [open])

  // Search suggestions when no query
  const searchSuggestions = useMemo(() => {
    if (query.trim()) return []

    const suggestions: SearchResult[] = []
    
    // Recent searches (first 3)
    history.slice(0, 3).forEach((searchTerm, index) => {
      suggestions.push({
        id: `history-${index}`,
        type: 'client', // Use client type for styling
        title: searchTerm,
        subtitle: 'Recent search',
      })
    })

    // Recent clients (next 3)
    clients.slice(0, 3).forEach(client => {
      suggestions.push({
        id: `suggestion-client-${client.id}`,
        type: 'client',
        title: client.name,
        subtitle: 'Recent client',
        clientId: client.id
      })
    })

    // Popular components (top 3 by transaction count)
    const componentCounts = allTransactions.reduce((acc, t) => {
      acc[t.component] = (acc[t.component] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(componentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([component, count]) => {
        suggestions.push({
          id: `suggestion-component-${component}`,
          type: 'component',
          title: component,
          subtitle: `${count} transactions`,
        })
      })

    return suggestions.slice(0, 8) // Limit total suggestions
  }, [query, clients, allTransactions, history])

  // Create search results
  const searchResults = useMemo(() => {
    if (!query.trim()) return searchSuggestions

    const results: SearchResult[] = []
    const searchTerm = query.toLowerCase().trim()

    // Search clients
    if (activeFilter === 'all' || activeFilter === 'clients') {
      clients.forEach(client => {
        const clientMatches = 
          client.name.toLowerCase().includes(searchTerm) ||
          client.contact_person?.toLowerCase().includes(searchTerm) ||
          client.id.toLowerCase().includes(searchTerm)

        if (clientMatches) {
          results.push({
            id: `client-${client.id}`,
            type: 'client',
            title: client.name,
            subtitle: client.contact_person || 'No contact person',
            description: `Client ID: ${client.id.slice(0, 8)}...`,
            clientId: client.id
          })
        }
      })
    }

    // Search transactions
    if (activeFilter === 'all' || activeFilter === 'transactions') {
      allTransactions.forEach(transaction => {
        const client = clients.find(c => c.id === transaction.client_id)
        const transactionMatches = 
          transaction.component.toLowerCase().includes(searchTerm) ||
          transaction.dc_no.toLowerCase().includes(searchTerm) ||
          transaction.lot_no.toLowerCase().includes(searchTerm) ||
          transaction.work_type?.toLowerCase().includes(searchTerm) ||
          client?.name.toLowerCase().includes(searchTerm)

        if (transactionMatches) {
          results.push({
            id: `transaction-${transaction.id}`,
            type: 'transaction',
            title: transaction.component,
            subtitle: `${transaction.transaction_type} - ${transaction.dc_no}`,
            description: `Lot: ${transaction.lot_no}`,
            metadata: {
              clientName: client?.name,
              date: transaction.date,
              amount: transaction.billed_amount ?? undefined,
              transactionType: transaction.transaction_type
            },
            clientId: transaction.client_id
          })
        }
      })
    }

    // Search unique components
    if (activeFilter === 'all' || activeFilter === 'components') {
      const uniqueComponents = [...new Set(allTransactions.map(t => t.component))]
      uniqueComponents.forEach(component => {
        if (component.toLowerCase().includes(searchTerm)) {
          const componentTransactions = allTransactions.filter(t => t.component === component)
          const clientsWithComponent = [...new Set(componentTransactions.map(t => t.client_id))]
          
          results.push({
            id: `component-${component}`,
            type: 'component',
            title: component,
            subtitle: `Used in ${componentTransactions.length} transactions`,
            description: `Across ${clientsWithComponent.length} client(s)`,
            metadata: {
              amount: componentTransactions.reduce((sum, t) => sum + (t.billed_amount ?? 0), 0)
            }
          })
        }
      })
    }

    // Sort results by relevance (exact matches first, then partial matches)
    return results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchTerm
      const bExact = b.title.toLowerCase() === searchTerm
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      const aStarts = a.title.toLowerCase().startsWith(searchTerm)
      const bStarts = b.title.toLowerCase().startsWith(searchTerm)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      
      return a.title.localeCompare(b.title)
    }).slice(0, 10) // Limit to 10 results
  }, [query, clients, allTransactions, searchSuggestions, activeFilter])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (searchResults[selectedIndex]) {
            handleResultClick(searchResults[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onOpenChange(false)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, searchResults, selectedIndex, onOpenChange])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchResults])

  const handleResultClick = (result: SearchResult) => {
    // If it's a recent search, set it as the query instead of closing
    if (result.id.startsWith('history-')) {
      setQuery(result.title)
      return
    }

    if (query.trim()) {
      addToHistory(query.trim())
    }
    onResultSelect(result)
    onOpenChange(false)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <User className="w-4 h-4 text-blue-600" />
      case 'transaction':
        return <FileText className="w-4 h-4 text-green-600" />
      case 'component':
        return <Package className="w-4 h-4 text-purple-600" />
      default:
        return <Search className="w-4 h-4 text-gray-600" />
    }
  }

  const getResultBadgeColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-blue-100 text-blue-800'
      case 'transaction':
        return 'bg-green-100 text-green-800'
      case 'component':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[600px] p-0 gap-0 shadow-2xl border-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <span>Search Dashboard</span>
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-4 sm:px-6 py-4 border-b bg-gray-50 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search clients, transactions, components..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-200"
                onClick={() => setQuery('')}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', icon: Search },
              { key: 'clients', label: 'Clients', icon: User },
              { key: 'transactions', label: 'Transactions', icon: FileText },
              { key: 'components', label: 'Components', icon: Package },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeFilter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(key as any)}
                className={`text-xs ${
                  activeFilter === key 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3 h-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          <AnimatePresence>
            {!query && searchResults.length > 0 && (
              <div className="px-4 sm:px-6 py-3 border-b bg-gray-50">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Quick Access
                </p>
              </div>
            )}

            {query && searchResults.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 sm:px-6 py-8 text-center text-gray-500"
              >
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-1">Try searching for client names, components, or transaction details</p>
              </motion.div>
            )}

            {searchResults.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className={`px-4 sm:px-6 py-4 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                  index === selectedIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getResultIcon(result.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        <SearchHighlight text={result.title} query={query} />
                      </h4>
                      <Badge className={`text-xs ${getResultBadgeColor(result.type)}`}>
                        {result.type}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      <SearchHighlight text={result.subtitle} query={query} />
                    </p>
                    
                    {result.description && (
                      <p className="text-xs text-gray-500">{result.description}</p>
                    )}
                    
                    {result.metadata && (
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        {result.metadata.clientName && (
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{result.metadata.clientName}</span>
                          </span>
                        )}
                        {result.metadata.date && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(result.metadata.date).toLocaleDateString()}</span>
                          </span>
                        )}
                        {result.metadata.amount && (
                          <span className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>₹{result.metadata.amount.toLocaleString()}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {query && searchResults.length > 0 && (
          <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between">
            <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
            <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ConfirmationDialog } from './ConfirmationDialog'
import { LoadingState } from './ui/loading'
import { EmptyState, TableEmptyState } from './ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ratesService } from '../services/rates'
import { useClients } from '../hooks/useClients'
import { useAllUniqueComponents } from '../hooks/useRates'
import { handleError, showSuccessToast } from '../lib/errorHandling'
import type { Rate, WorkType, Unit } from '../types'

interface EditingRate extends Partial<Rate> {
  isNew?: boolean
}

export function RateMaster() {
  const [editingRate, setEditingRate] = useState<EditingRate | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [customComponent, setCustomComponent] = useState('')
  const [rateToDelete, setRateToDelete] = useState<string | null>(null)
  const [isDeleteRateDialogOpen, setIsDeleteRateDialogOpen] = useState(false)
  
  const queryClient = useQueryClient()
  const { data: clients = [] } = useClients()
  const { data: rates = [], isLoading, error: ratesError } = useQuery({
    queryKey: ['rates'],
    queryFn: ratesService.getAll,
  })
  const { data: uniqueComponents = [] } = useAllUniqueComponents()

  const createRateMutation = useMutation({
    mutationFn: ratesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rates'] })
      setEditingRate(null)
      setIsAddingNew(false)
      showSuccessToast('Rate created successfully')
    },
    onError: (error) => {
      handleError(error, 'creating rate')
    }
  })

  const updateRateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Rate> }) =>
      ratesService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rates'] })
      setEditingRate(null)
      showSuccessToast('Rate updated successfully')
    },
    onError: (error) => {
      handleError(error, 'updating rate')
    }
  })

  const deleteRateMutation = useMutation({
    mutationFn: ratesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rates'] })
      showSuccessToast('Rate deleted successfully')
    },
    onError: (error) => {
      handleError(error, 'deleting rate')
    }
  })

  const handleStartEdit = (rate: Rate) => {
    setEditingRate({ ...rate })
    setIsAddingNew(false)
    // Set custom component if it's not in the dropdown list
    if (rate.component && !uniqueComponents.includes(rate.component)) {
      setCustomComponent(rate.component)
    } else {
      setCustomComponent('')
    }
  }

  const handleStartAdd = () => {
    setEditingRate({
      client_id: null,
      component: '',
      work_type: 'Shot Blasting',
      unit: 'Per Piece',
      rate: 0,
      isNew: true,
    })
    setIsAddingNew(true)
    setCustomComponent('')
  }

  const handleSave = async () => {
    if (!editingRate) return

    // Validation
    if (!editingRate.component?.trim()) {
      handleError(new Error('Component name is required'), 'validation')
      return
    }
    if (!editingRate.rate || editingRate.rate <= 0) {
      handleError(new Error('Rate must be greater than 0'), 'validation')
      return
    }

    try {
      if (editingRate.isNew) {
        const { isNew, id, created_at, ...rateData } = editingRate
        await createRateMutation.mutateAsync(rateData as Omit<Rate, 'id' | 'created_at'>)
      } else if (editingRate.id) {
        const { id, created_at, ...updates } = editingRate
        await updateRateMutation.mutateAsync({ id, updates })
      }
    } catch (error) {
      // Error handling is done in mutation onError
    }
  }

  const handleCancel = () => {
    setEditingRate(null)
    setIsAddingNew(false)
    setCustomComponent('')
  }

  const handleDelete = async (id: string) => {
    setRateToDelete(id)
    setIsDeleteRateDialogOpen(true)
  }

  const confirmDeleteRate = async () => {
    if (rateToDelete) {
      try {
        await deleteRateMutation.mutateAsync(rateToDelete)
        setRateToDelete(null)
      } catch (error) {
        // Error handling is done in mutation onError
      }
    }
  }

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'Default'
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'Unknown Client'
  }

  if (isLoading) {
    return <LoadingState message="Loading rates..." size="lg" className="h-64" />
  }

  if (ratesError) {
    return (
      <EmptyState
        icon={<Plus className="w-8 h-8" />}
        title="Failed to Load Rates"
        description="There was an error loading the rate configuration. Please try refreshing the page."
        action={{
          label: "Refresh Page",
          onClick: () => window.location.reload(),
          variant: "outline"
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rate Master</h1>
          <p className="text-muted-foreground">
            Manage pricing rates for different clients and services
          </p>
        </div>
        <Button onClick={handleStartAdd} disabled={isAddingNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Rate
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rate Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Work Type</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Rate (₹)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* New Rate Row */}
              {isAddingNew && editingRate && (
                <motion.tr
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border-blue-200"
                >
                  <TableCell>
                    <Select
                      value={editingRate.client_id || 'default'}
                      onValueChange={(value) =>
                        setEditingRate({
                          ...editingRate,
                          client_id: value === 'default' ? null : value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Select
                        value={editingRate.component || 'custom'}
                        onValueChange={(value) => {
                          if (value === 'custom') {
                            setEditingRate({ ...editingRate, component: customComponent })
                          } else {
                            setEditingRate({ ...editingRate, component: value })
                            setCustomComponent('')
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select component" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueComponents.map((comp) => (
                            <SelectItem key={comp} value={comp}>
                              {comp}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">
                            <span className="text-blue-600">+ New component</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {(editingRate.component === customComponent || !uniqueComponents.includes(editingRate.component || '')) && (
                        <Input
                          placeholder="Enter component name"
                          value={customComponent || editingRate.component}
                          onChange={(e) => {
                            setCustomComponent(e.target.value)
                            setEditingRate({ ...editingRate, component: e.target.value })
                          }}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editingRate.work_type}
                      onValueChange={(value: WorkType) =>
                        setEditingRate({ ...editingRate, work_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fettling">Fettling</SelectItem>
                        <SelectItem value="Shot Blasting">Shot Blasting</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editingRate.unit}
                      onValueChange={(value: Unit) =>
                        setEditingRate({ ...editingRate, unit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Per Piece">Per Piece</SelectItem>
                        <SelectItem value="Per Kg">Per Kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingRate.rate}
                      onChange={(e) =>
                        setEditingRate({
                          ...editingRate,
                          rate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={createRateMutation.isPending}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              )}

              {/* Existing Rates */}
              {rates.map((rate) => (
                <motion.tr
                  key={rate.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={editingRate?.id === rate.id ? 'bg-yellow-50 border-yellow-200' : ''}
                >
                  <TableCell>
                    {editingRate?.id === rate.id ? (
                      <Select
                        value={editingRate.client_id || 'default'}
                        onValueChange={(value) =>
                          setEditingRate({
                            ...editingRate,
                            client_id: value === 'default' ? null : value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>{getClientName(rate.client_id)}</span>
                        {!rate.client_id && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRate?.id === rate.id ? (
                      <div className="space-y-2">
                        <Select
                          value={editingRate.component || 'custom'}
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              setEditingRate({ ...editingRate, component: customComponent })
                            } else {
                              setEditingRate({ ...editingRate, component: value })
                              setCustomComponent('')
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueComponents.map((comp) => (
                              <SelectItem key={comp} value={comp}>
                                {comp}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">
                              <span className="text-blue-600">+ Edit component</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {(editingRate.component === customComponent || !uniqueComponents.includes(editingRate.component || '')) && (
                          <Input
                            placeholder="Enter component name"
                            value={customComponent || editingRate.component}
                            onChange={(e) => {
                              setCustomComponent(e.target.value)
                              setEditingRate({ ...editingRate, component: e.target.value })
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      rate.component
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRate?.id === rate.id ? (
                      <Select
                        value={editingRate.work_type}
                        onValueChange={(value: WorkType) =>
                          setEditingRate({ ...editingRate, work_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fettling">Fettling</SelectItem>
                          <SelectItem value="Shot Blasting">Shot Blasting</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      rate.work_type
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRate?.id === rate.id ? (
                      <Select
                        value={editingRate.unit}
                        onValueChange={(value: Unit) =>
                          setEditingRate({ ...editingRate, unit: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Per Piece">Per Piece</SelectItem>
                          <SelectItem value="Per Kg">Per Kg</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      rate.unit
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingRate?.id === rate.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editingRate.rate}
                        onChange={(e) =>
                          setEditingRate({
                            ...editingRate,
                            rate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="text-right"
                      />
                    ) : (
                      `₹${rate.rate.toLocaleString()}`
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingRate?.id === rate.id ? (
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={updateRateMutation.isPending}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartEdit(rate)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(rate.id)}
                          disabled={deleteRateMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>

          {rates.length === 0 && !isAddingNew && (
            <TableEmptyState
              title="No Rates Configured"
              description="Set up your first rate to start calculating transaction costs automatically."
              action={{
                label: "Add First Rate",
                onClick: handleStartAdd
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Rate Confirmation */}
      <ConfirmationDialog
        open={isDeleteRateDialogOpen}
        onOpenChange={setIsDeleteRateDialogOpen}
        title="Delete Rate"
        description="Are you sure you want to delete this rate? This will affect future transaction calculations."
        confirmText="Delete Rate"
        variant="destructive"
        onConfirm={confirmDeleteRate}
        isLoading={deleteRateMutation.isPending}
      />
    </div>
  )
}
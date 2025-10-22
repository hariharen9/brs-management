import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { ConfirmationDialog } from './ConfirmationDialog'
import { LoadingState } from './ui/loading'
import { EmptyState, TableEmptyState } from './ui/empty-state'
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
import { AddRateModal } from './AddRateModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ratesService } from '../services/rates'
import { useClients } from '../hooks/useClients'
import { handleError, showSuccessToast } from '../lib/errorHandling'
import type { Rate } from '../types'

export function RateMaster() {
  const [isAddRateModalOpen, setIsAddRateModalOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<Rate | null>(null)
  const [rateToDelete, setRateToDelete] = useState<string | null>(null)
  const [isDeleteRateDialogOpen, setIsDeleteRateDialogOpen] = useState(false)
  
  const queryClient = useQueryClient()
  const { data: clients = [] } = useClients()
  const { data: rates = [], isLoading, error: ratesError } = useQuery({
    queryKey: ['rates'],
    queryFn: ratesService.getAll,
  })


  const createRateMutation = useMutation({
    mutationFn: ratesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rates'] })
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
    setEditingRate(rate)
    setIsAddRateModalOpen(true)
  }

  const handleStartAdd = () => {
    setEditingRate(null)
    setIsAddRateModalOpen(true)
  }

  const handleSaveRate = async (rateData: Omit<Rate, 'id' | 'created_at'>) => {
    if (editingRate) {
      // Update existing rate
      await updateRateMutation.mutateAsync({ id: editingRate.id, updates: rateData })
    } else {
      // Create new rate
      await createRateMutation.mutateAsync(rateData)
    }
  }

  const handleCloseModal = () => {
    setIsAddRateModalOpen(false)
    setEditingRate(null)
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
        <Button onClick={handleStartAdd}>
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
              {rates.map((rate) => (
                <motion.tr
                  key={rate.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{getClientName(rate.client_id)}</span>
                      {!rate.client_id && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{rate.component}</TableCell>
                  <TableCell>{rate.work_type}</TableCell>
                  <TableCell>{rate.unit}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{rate.rate.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
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
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>

          {rates.length === 0 && (
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

      {/* Add/Edit Rate Modal */}
      <AddRateModal
        open={isAddRateModalOpen}
        onOpenChange={handleCloseModal}
        onSave={handleSaveRate}
        isLoading={createRateMutation.isPending || updateRateMutation.isPending}
        editingRate={editingRate}
      />

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
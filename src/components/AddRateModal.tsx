import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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
import { useClients } from '../hooks/useClients'
import { useAllUniqueComponents } from '../hooks/useRates'
import { handleError } from '../lib/errorHandling'
import type { Rate, WorkType, Unit } from '../types'

interface AddRateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (rateData: Omit<Rate, 'id' | 'created_at'>) => Promise<void>
  isLoading?: boolean
  editingRate?: Rate | null
}

export function AddRateModal({ 
  open, 
  onOpenChange, 
  onSave, 
  isLoading = false,
  editingRate 
}: AddRateModalProps) {
  const [formData, setFormData] = useState<Omit<Rate, 'id' | 'created_at'>>({
    client_id: null,
    component: '',
    work_type: 'Shot Blasting',
    unit: 'Per Piece',
    rate: 0,
  })


  const { data: clients = [] } = useClients()
  const { data: uniqueComponents = [] } = useAllUniqueComponents()

  const isEditing = !!editingRate

  // Reset form when modal opens/closes or when editing rate changes
  useEffect(() => {
    if (editingRate) {
      setFormData({
        client_id: editingRate.client_id,
        component: editingRate.component,
        work_type: editingRate.work_type,
        unit: editingRate.unit,
        rate: editingRate.rate,
      })
      // Custom component handling is automatic based on whether the component is in uniqueComponents
    } else {
      setFormData({
        client_id: null,
        component: '',
        work_type: 'Shot Blasting',
        unit: 'Per Piece',
        rate: 0,
      })
      // Custom component state is no longer needed
    }
  }, [editingRate, uniqueComponents, open])

  const handleSave = async () => {
    // Validation
    if (!formData.component?.trim()) {
      handleError(new Error('Component name is required'), 'validation')
      return
    }
    if (!formData.rate || formData.rate <= 0) {
      handleError(new Error('Rate must be greater than 0'), 'validation')
      return
    }

    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({
        client_id: null,
        component: '',
        work_type: 'Shot Blasting',
        unit: 'Per Piece',
        rate: 0,
      })
      // Custom component state is no longer needed
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[500px] max-h-[90vh] shadow-2xl border-0 p-0 flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto min-h-0">
          <DialogHeader className="mb-6">
            <DialogTitle>
              {isEditing ? 'Edit Rate' : 'Add New Rate'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the rate configuration' : 'Configure a new rate for pricing calculations'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={formData.client_id || 'default'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    client_id: value === 'default' ? null : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (All Clients)</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Component Selection */}
            <div className="space-y-2">
              <Label>Component</Label>
              <div className="space-y-2">
                <Select
                  value={uniqueComponents.includes(formData.component || '') ? formData.component : 'custom'}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      // Don't change the form value, just show the input
                    } else {
                      setFormData({ ...formData, component: value })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or enter component" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueComponents.map((comp) => (
                      <SelectItem key={comp} value={comp}>
                        {comp}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      <span className="text-blue-600">+ Enter custom component</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {!uniqueComponents.includes(formData.component || '') && (
                  <Input
                    placeholder="Enter component name"
                    value={formData.component || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, component: e.target.value })
                    }}
                  />
                )}
              </div>
            </div>

            {/* Work Type and Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Work Type</Label>
                <Select
                  value={formData.work_type}
                  onValueChange={(value: WorkType) =>
                    setFormData({ ...formData, work_type: value })
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
              </div>

              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value: Unit) =>
                    setFormData({ ...formData, unit: value })
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
              </div>
            </div>

            {/* Rate */}
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (₹)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                placeholder="Enter rate amount"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t border-gray-100 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="rounded-lg px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="rounded-lg px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? 'Update Rate' : 'Add Rate'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
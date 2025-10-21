import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { useCreateTransaction, useUpdateTransaction } from '../hooks/useTransactions'
import { useUniqueComponents } from '../hooks/useRates'
import { ratesService } from '../services/rates'
import { handleError, showSuccessToast } from '../lib/errorHandling'
import type { Transaction, TransactionType, WorkType, Unit } from '../types'

const transactionSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  date: z.string().min(1, 'Date is required'),
  dc_no: z.string().min(1, 'DC Number is required'),
  component: z.string().min(1, 'Component is required'),
  lot_no: z.string().min(1, 'Lot Number is required'),
  transaction_type: z.enum(['Received', 'Delivered']),
  qty_in: z.number().nullable(),
  qty_out: z.number().nullable(),
  weight_kg: z.number().nullable(),
  work_type: z.enum(['Fettling', 'Shot Blasting', 'Both']).nullable(),
  unit: z.enum(['Per Piece', 'Per Kg']).nullable(),
  rate_applied: z.number().nullable(),
  billed_amount: z.number().nullable(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  editingTransaction?: Transaction | null
}

export function TransactionForm({ open, onOpenChange, clientId, clientName, editingTransaction }: TransactionFormProps) {
  const [isLoadingRate, setIsLoadingRate] = useState(false)
  const [customComponent, setCustomComponent] = useState('')
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const { data: uniqueComponents = [] } = useUniqueComponents(clientId)
  
  const isEditing = !!editingTransaction

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      client_id: clientId,
      date: new Date().toISOString().split('T')[0],
      dc_no: '',
      component: '',
      lot_no: '',
      transaction_type: 'Received',
      qty_in: null,
      qty_out: null,
      weight_kg: null,
      work_type: null,
      unit: null,
      rate_applied: null,
      billed_amount: null,
    },
  })

  // Reset form when editingTransaction changes
  useEffect(() => {
    if (editingTransaction) {
      const componentValue = editingTransaction.component
      form.reset({
        client_id: editingTransaction.client_id,
        date: editingTransaction.date,
        dc_no: editingTransaction.dc_no,
        component: componentValue,
        lot_no: editingTransaction.lot_no,
        transaction_type: editingTransaction.transaction_type,
        qty_in: editingTransaction.qty_in,
        qty_out: editingTransaction.qty_out || editingTransaction.qty_in, // Use qty_out for display, fallback to qty_in
        weight_kg: editingTransaction.weight_kg,
        work_type: editingTransaction.work_type,
        unit: editingTransaction.unit,
        rate_applied: editingTransaction.rate_applied,
        billed_amount: editingTransaction.billed_amount,
      })
      
      // Set custom component if it's not in the dropdown list
      if (componentValue && !uniqueComponents.includes(componentValue)) {
        setCustomComponent(componentValue)
      } else {
        setCustomComponent('')
      }
    } else {
      form.reset({
        client_id: clientId,
        date: new Date().toISOString().split('T')[0],
        dc_no: '',
        component: '',
        lot_no: '',
        transaction_type: 'Received',
        qty_in: null,
        qty_out: null,
        weight_kg: null,
        work_type: null,
        unit: null,
        rate_applied: null,
        billed_amount: null,
      })
      setCustomComponent('')
    }
  }, [editingTransaction, clientId, form, uniqueComponents])

  const watchedFields = form.watch(['transaction_type', 'component', 'work_type', 'unit', 'qty_out', 'rate_applied'])
  const [transactionType, component, workType, unit, qtyOut, rateApplied] = watchedFields

  // Auto-populate rate when delivered transaction fields change
  useEffect(() => {
    if (transactionType === 'Delivered' && component && workType && unit) {
      setIsLoadingRate(true)
      console.log('Looking up rate for:', { clientId, clientName, component, workType, unit })
      
      ratesService.getRateForTransaction(clientId, component, workType, unit)
        .then((rate) => {
          if (rate) {
            console.log('Found rate:', rate)
            form.setValue('rate_applied', rate)
          } else {
            console.log('No rate found for this combination')
            // Show a warning toast for missing rate
            handleError(new Error(`No rate configured for ${component} - ${workType} - ${unit}. Please set up rates in Rate Master.`), 'rate lookup')
          }
        })
        .catch((error) => {
          handleError(error, 'looking up rate')
        })
        .finally(() => setIsLoadingRate(false))
    }
  }, [clientId, clientName, component, workType, unit, transactionType, form])

  // Auto-calculate billed amount
  useEffect(() => {
    if (qtyOut && rateApplied) {
      const billedAmount = qtyOut * rateApplied
      form.setValue('billed_amount', billedAmount)
    }
  }, [qtyOut, rateApplied, form])

  const onSubmit = async (data: TransactionFormData) => {
    try {
      // Validation
      if (!data.qty_out || data.qty_out <= 0) {
        handleError(new Error('Quantity must be greater than 0'), 'validation')
        return
      }

      // Set quantities based on transaction type
      if (data.transaction_type === 'Received') {
        data.qty_in = data.qty_out || 0
        data.qty_out = null
        data.work_type = null
        data.unit = null
        data.rate_applied = null
        data.billed_amount = null
      } else {
        data.qty_in = null
        data.qty_out = data.qty_out || 0
      }

      if (isEditing && editingTransaction) {
        await updateTransaction.mutateAsync({
          id: editingTransaction.id,
          updates: data
        })
        showSuccessToast('Transaction updated successfully')
      } else {
        await createTransaction.mutateAsync(data)
        showSuccessToast('Transaction created successfully')
      }
      
      onOpenChange(false)
    } catch (error) {
      handleError(error, `${isEditing ? 'updating' : 'creating'} transaction`)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto shadow-2xl border-0">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the transaction details' : 'Add a new transaction'} for <strong>{clientName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Info Display */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-semibold text-blue-800">Client:</span>
                <span className="text-sm font-medium text-blue-700">{clientName}</span>
              </div>
              {isEditing && (
                <div className="text-xs text-blue-600 bg-blue-200 px-3 py-1 rounded-full font-medium">
                  ✏️ Editing Mode
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 pb-2 border-b border-gray-100">
              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Information</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...form.register('date')}
              />
              {form.formState.errors.date && (
                <p className="text-sm text-red-600">{form.formState.errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dc_no">DC Number</Label>
              <Input
                id="dc_no"
                placeholder="Enter DC number"
                {...form.register('dc_no')}
              />
              {form.formState.errors.dc_no && (
                <p className="text-sm text-red-600">{form.formState.errors.dc_no.message}</p>
              )}
            </div>
          </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 pb-2 border-b border-gray-100">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Product Details</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="component">Component</Label>
              <div className="space-y-2">
                <Select
                  value={component || 'custom'}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      form.setValue('component', customComponent)
                    } else {
                      form.setValue('component', value)
                      setCustomComponent('')
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
                
                {(component === customComponent || !uniqueComponents.includes(component || '')) && (
                  <Input
                    placeholder="Enter component name"
                    value={customComponent || component}
                    onChange={(e) => {
                      setCustomComponent(e.target.value)
                      form.setValue('component', e.target.value)
                    }}
                  />
                )}
              </div>
              {form.formState.errors.component && (
                <p className="text-sm text-red-600">{form.formState.errors.component.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lot_no">Lot Number</Label>
              <Input
                id="lot_no"
                placeholder="Enter lot number"
                {...form.register('lot_no')}
              />
              {form.formState.errors.lot_no && (
                <p className="text-sm text-red-600">{form.formState.errors.lot_no.message}</p>
              )}
            </div>
          </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 pb-2 border-b border-gray-100">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Transaction Details</h4>
            </div>
            
            <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select
              value={transactionType}
              onValueChange={(value: TransactionType) => form.setValue('transaction_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              placeholder="Enter quantity"
              {...form.register('qty_out', { 
                setValueAs: (value) => value === '' ? null : parseFloat(value) 
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight (KG)</Label>
            <Input
              id="weight"
              type="number"
              step="0.001"
              placeholder="Enter weight in kilograms"
              {...form.register('weight_kg', { 
                setValueAs: (value) => value === '' ? null : parseFloat(value) 
              })}
            />
          </div>
          </div>

          <AnimatePresence>
            {transactionType === 'Delivered' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Work Type</Label>
                    <Select
                      value={workType || ''}
                      onValueChange={(value: WorkType) => form.setValue('work_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select work type" />
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
                      value={unit || ''}
                      onValueChange={(value: Unit) => form.setValue('unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Per Piece">Per Piece</SelectItem>
                        <SelectItem value="Per Kg">Per Kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate">Rate Applied</Label>
                    <div className="relative">
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        placeholder="Rate will be auto-populated"
                        {...form.register('rate_applied', { 
                          setValueAs: (value) => value === '' ? null : parseFloat(value) 
                        })}
                      />
                      {isLoadingRate && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billed_amount">Billed Amount</Label>
                    <Input
                      id="billed_amount"
                      type="number"
                      step="0.01"
                      placeholder="Auto-calculated"
                      {...form.register('billed_amount', { 
                        setValueAs: (value) => value === '' ? null : parseFloat(value) 
                      })}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="rounded-lg px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTransaction.isPending || updateTransaction.isPending}
              className="rounded-lg px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {(createTransaction.isPending || updateTransaction.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? 'Update Transaction' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
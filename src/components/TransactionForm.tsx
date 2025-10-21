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
import { useCreateTransaction } from '../hooks/useTransactions'
import { ratesService } from '../services/rates'
import type { TransactionType, WorkType, Unit } from '../types'

const transactionSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  date: z.string().min(1, 'Date is required'),
  dc_no: z.string().min(1, 'DC Number is required'),
  component: z.string().min(1, 'Component is required'),
  lot_no: z.string().min(1, 'Lot Number is required'),
  transaction_type: z.enum(['Received', 'Delivered']),
  qty_in: z.number().nullable(),
  qty_out: z.number().nullable(),
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
}

export function TransactionForm({ open, onOpenChange, clientId, clientName }: TransactionFormProps) {
  const [isLoadingRate, setIsLoadingRate] = useState(false)
  const createTransaction = useCreateTransaction()

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
      work_type: null,
      unit: null,
      rate_applied: null,
      billed_amount: null,
    },
  })

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
          }
        })
        .catch(console.error)
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

      await createTransaction.mutateAsync(data)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Failed to create transaction:', error)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Add a new transaction for <strong>{clientName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Client Info Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-800">Client:</span>
              <span className="text-sm text-blue-700">{clientName}</span>
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="component">Component</Label>
              <Input
                id="component"
                placeholder="Enter component name"
                {...form.register('component')}
              />
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTransaction.isPending}
            >
              {createTransaction.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
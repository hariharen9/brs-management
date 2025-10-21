import { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
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
import { useDeleteClient } from '../hooks/useClients'
import type { Client } from '../types'

interface DeleteClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
}

export function DeleteClientDialog({ open, onOpenChange, client }: DeleteClientDialogProps) {
  const [step, setStep] = useState(1)
  const [confirmationText, setConfirmationText] = useState('')
  const deleteClient = useDeleteClient()

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep(1)
      setConfirmationText('')
    }
    onOpenChange(newOpen)
  }

  const handleFirstConfirm = () => {
    setStep(2)
  }

  const handleFinalDelete = async () => {
    if (!client || confirmationText !== client.name) return
    
    try {
      await deleteClient.mutateAsync(client.id)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete client:', error)
    }
  }

  const isConfirmationValid = confirmationText === client?.name

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] shadow-2xl border-0 p-4 sm:p-6 lg:p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Delete Client</span>
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? (
              <>This action cannot be undone. This will permanently delete the client and all associated data.</>
            ) : (
              <>Please type the client name <strong>"{client?.name}"</strong> to confirm deletion.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <h4 className="font-semibold text-red-800 mb-2">What will be deleted:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Client profile: <strong>{client?.name}</strong></li>
                <li>• All transactions for this client</li>
                <li>• All client-specific rates</li>
                <li>• All associated data and history</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 shadow-sm">
                <p className="text-sm text-yellow-800">
                  <strong>Final confirmation required.</strong> This action is irreversible.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  Type the client name to confirm: <strong>{client?.name}</strong>
                </Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={`Type "${client?.name}" here`}
                  className="font-mono"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 pt-6 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="rounded-lg px-6"
          >
            Cancel
          </Button>
          
          {step === 1 ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleFirstConfirm}
              className="rounded-lg px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Continue to Confirmation
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={handleFinalDelete}
              disabled={!isConfirmationValid || deleteClient.isPending}
              className="rounded-lg px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteClient.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Client Permanently
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
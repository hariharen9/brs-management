import React from 'react'
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
import { useUpdateClient } from '../hooks/useClients'
import type { Client } from '../types'

const clientSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  contact_person: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface EditClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
}

export function EditClientForm({ open, onOpenChange, client }: EditClientFormProps) {
  const updateClient = useUpdateClient()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      contact_person: client?.contact_person || '',
    },
  })

  // Reset form when client changes
  React.useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        contact_person: client.contact_person || '',
      })
    }
  }, [client, form])

  const onSubmit = async (data: ClientFormData) => {
    if (!client) return
    
    try {
      await updateClient.mutateAsync({
        id: client.id,
        updates: {
          name: data.name,
          contact_person: data.contact_person || null,
        }
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update client:', error)
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
      <DialogContent className="sm:max-w-[450px] shadow-2xl border-0">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update the client information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              placeholder="Enter company name"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_person">Contact Person</Label>
            <Input
              id="contact_person"
              placeholder="Enter contact person name (optional)"
              {...form.register('contact_person')}
            />
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
            <Button
              type="submit"
              disabled={updateClient.isPending}
              className="rounded-lg px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {updateClient.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
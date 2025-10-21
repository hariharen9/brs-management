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
import { useCreateClient } from '../hooks/useClients'

const clientSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  contact_person: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface AddClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddClientForm({ open, onOpenChange }: AddClientFormProps) {
  const createClient = useCreateClient()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      contact_person: '',
    },
  })

  const onSubmit = async (data: ClientFormData) => {
    try {
      await createClient.mutateAsync({
        name: data.name,
        contact_person: data.contact_person || null,
      })
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Failed to create client:', error)
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Add a new client to the system. You can manage their rates and transactions after creation.
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
              disabled={createClient.isPending}
            >
              {createClient.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
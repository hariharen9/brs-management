import { motion } from 'framer-motion'
import { Edit, Trash2, MoreHorizontal } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import type { Transaction } from '../types'

interface TransactionLogTableProps {
  data: Transaction[]
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transactionId: string) => void
}

export function TransactionLogTable({ data, onEdit, onDelete }: TransactionLogTableProps) {
  if (data.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          No transactions found
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="mobile-table-scroll">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>DC No</TableHead>
            <TableHead>Component</TableHead>
            <TableHead>Lot No</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Qty In</TableHead>
            <TableHead className="text-right">Qty Out</TableHead>
            <TableHead className="text-right">Weight (KG)</TableHead>
            <TableHead>Work Type</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Billed Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transaction, index) => (
            <motion.tr
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <TableCell>
                {new Date(transaction.date).toLocaleDateString()}
              </TableCell>
              <TableCell className="font-medium">{transaction.dc_no}</TableCell>
              <TableCell>{transaction.component}</TableCell>
              <TableCell>{transaction.lot_no}</TableCell>
              <TableCell>
                <Badge variant={transaction.transaction_type === 'Received' ? 'default' : 'secondary'}>
                  {transaction.transaction_type}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {transaction.qty_in ? transaction.qty_in.toLocaleString() : '-'}
              </TableCell>
              <TableCell className="text-right">
                {transaction.qty_out ? transaction.qty_out.toLocaleString() : '-'}
              </TableCell>
              <TableCell className="text-right">
                {transaction.weight_kg ? `${transaction.weight_kg.toLocaleString()} kg` : '-'}
              </TableCell>
              <TableCell>
                {transaction.work_type || '-'}
              </TableCell>
              <TableCell className="text-right">
                {transaction.rate_applied ? `₹${transaction.rate_applied.toLocaleString()}` : '-'}
              </TableCell>
              <TableCell className="text-right font-medium">
                {transaction.billed_amount ? `₹${transaction.billed_amount.toLocaleString()}` : '-'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEdit?.(transaction)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete?.(transaction.id)}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
      </div>
    </Card>
  )
}
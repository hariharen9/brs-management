import { motion } from 'framer-motion'
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
import type { Transaction } from '../types'

interface TransactionLogTableProps {
  data: Transaction[]
}

export function TransactionLogTable({ data }: TransactionLogTableProps) {
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
            <TableHead>Work Type</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Billed Amount</TableHead>
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
              <TableCell>
                {transaction.work_type || '-'}
              </TableCell>
              <TableCell className="text-right">
                {transaction.rate_applied ? `₹${transaction.rate_applied.toLocaleString()}` : '-'}
              </TableCell>
              <TableCell className="text-right font-medium">
                {transaction.billed_amount ? `₹${transaction.billed_amount.toLocaleString()}` : '-'}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
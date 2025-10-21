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
import type { BalanceSummaryItem } from '../types'

interface BalanceSummaryTableProps {
  data: BalanceSummaryItem[]
}

export function BalanceSummaryTable({ data }: BalanceSummaryTableProps) {
  if (data.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          No balance data available
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Component</TableHead>
            <TableHead>Lot No</TableHead>
            <TableHead className="text-right">Total In</TableHead>
            <TableHead className="text-right">Total Out</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <motion.tr
              key={`${item.component}-${item.lot_no}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <TableCell className="font-medium">{item.component}</TableCell>
              <TableCell>{item.lot_no}</TableCell>
              <TableCell className="text-right">{item.total_in.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.total_out.toLocaleString()}</TableCell>
              <TableCell className={`text-right font-medium ${
                item.balance < 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {item.balance.toLocaleString()}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
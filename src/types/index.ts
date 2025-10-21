export interface Client {
  id: string
  name: string
  contact_person: string | null
  created_at: string
}

export interface Transaction {
  id: string
  client_id: string
  date: string
  dc_no: string
  component: string
  lot_no: string
  transaction_type: 'Received' | 'Delivered'
  qty_in: number | null
  qty_out: number | null
  weight_kg: number | null
  work_type: 'Fettling' | 'Shot Blasting' | 'Both' | null
  unit: 'Per Piece' | 'Per Kg' | null
  rate_applied: number | null
  billed_amount: number | null
  created_at: string
}

export interface Rate {
  id: string
  client_id: string | null
  component: string
  work_type: 'Fettling' | 'Shot Blasting' | 'Both'
  unit: 'Per Piece' | 'Per Kg'
  rate: number
  created_at: string
}

export interface ClientKPIs {
  totalReceived: number
  totalDelivered: number
  currentBalance: number
  totalBilled: number
}

export interface BalanceSummaryItem {
  component: string
  lot_no: string
  total_in: number
  total_out: number
  balance: number
}

export type TransactionType = 'Received' | 'Delivered'
export type WorkType = 'Fettling' | 'Shot Blasting' | 'Both'
export type Unit = 'Per Piece' | 'Per Kg'
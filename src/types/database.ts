export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          created_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
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
        Insert: {
          id?: string
          client_id: string
          date: string
          dc_no: string
          component: string
          lot_no: string
          transaction_type: 'Received' | 'Delivered'
          qty_in?: number | null
          qty_out?: number | null
          weight_kg?: number | null
          work_type?: 'Fettling' | 'Shot Blasting' | 'Both' | null
          unit?: 'Per Piece' | 'Per Kg' | null
          rate_applied?: number | null
          billed_amount?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          date?: string
          dc_no?: string
          component?: string
          lot_no?: string
          transaction_type?: 'Received' | 'Delivered'
          qty_in?: number | null
          qty_out?: number | null
          weight_kg?: number | null
          work_type?: 'Fettling' | 'Shot Blasting' | 'Both' | null
          unit?: 'Per Piece' | 'Per Kg' | null
          rate_applied?: number | null
          billed_amount?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      rates: {
        Row: {
          id: string
          client_id: string | null
          component: string
          work_type: 'Fettling' | 'Shot Blasting' | 'Both'
          unit: 'Per Piece' | 'Per Kg'
          rate: number
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          component: string
          work_type: 'Fettling' | 'Shot Blasting' | 'Both'
          unit: 'Per Piece' | 'Per Kg'
          rate: number
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          component?: string
          work_type?: 'Fettling' | 'Shot Blasting' | 'Both'
          unit?: 'Per Piece' | 'Per Kg'
          rate?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rates_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_balance_summary: {
        Args: {
          client_id: string
        }
        Returns: {
          component: string
          lot_no: string
          total_in: number
          total_out: number
          balance: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
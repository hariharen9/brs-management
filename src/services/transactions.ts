import { supabase } from '../lib/supabase'
import type { Transaction, ClientKPIs, BalanceSummaryItem } from '../types'

export const transactionsService = {
  async getAll(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getByClientId(clientId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at'>>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async getClientKPIs(clientId: string): Promise<ClientKPIs> {
    const { data, error } = await supabase
      .from('transactions')
      .select('qty_in, qty_out, billed_amount')
      .eq('client_id', clientId)
    
    if (error) throw error
    
    const transactions = data || []
    const totalReceived = transactions.reduce((sum, t) => sum + (t.qty_in || 0), 0)
    const totalDelivered = transactions.reduce((sum, t) => sum + (t.qty_out || 0), 0)
    const totalBilled = transactions.reduce((sum, t) => sum + (t.billed_amount || 0), 0)
    
    return {
      totalReceived,
      totalDelivered,
      currentBalance: totalReceived - totalDelivered,
      totalBilled
    }
  },

  async getBalanceSummary(clientId: string): Promise<BalanceSummaryItem[]> {
    const { data, error } = await supabase
      .rpc('get_balance_summary', { client_id: clientId })
    
    if (error) {
      // Fallback to manual calculation if RPC doesn't exist yet
      const transactions = await this.getByClientId(clientId)
      const summary = new Map<string, BalanceSummaryItem>()
      
      transactions.forEach(t => {
        const key = `${t.component}-${t.lot_no}`
        if (!summary.has(key)) {
          summary.set(key, {
            component: t.component,
            lot_no: t.lot_no,
            total_in: 0,
            total_out: 0,
            balance: 0
          })
        }
        
        const item = summary.get(key)!
        item.total_in += t.qty_in || 0
        item.total_out += t.qty_out || 0
        item.balance = item.total_in - item.total_out
      })
      
      return Array.from(summary.values()).sort((a, b) => 
        a.component.localeCompare(b.component) || a.lot_no.localeCompare(b.lot_no)
      )
    }
    
    return data || []
  }
}
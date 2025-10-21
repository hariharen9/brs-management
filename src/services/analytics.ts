import { supabase } from '../lib/supabase'

export interface ClientAnalytics {
  client_id: string
  client_name: string
  total_received: number
  total_delivered: number
  current_balance: number
  total_billed: number
  transaction_count: number
}

export interface MonthlyTrend {
  month: string
  received: number
  delivered: number
  billed: number
}

export interface ComponentAnalytics {
  component: string
  total_quantity: number
  total_billed: number
  transaction_count: number
  avg_rate: number
}

export interface WorkTypeAnalytics {
  work_type: string
  quantity: number
  billed_amount: number
  transaction_count: number
}

export const analyticsService = {
  async getClientAnalytics(): Promise<ClientAnalytics[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        client_id,
        clients!inner(name),
        qty_in,
        qty_out,
        billed_amount
      `)
    
    if (error) throw error
    
    // Group by client and calculate metrics
    const clientMap = new Map<string, ClientAnalytics>()
    
    data?.forEach(transaction => {
      const clientId = transaction.client_id
      const clientName = (transaction.clients as any).name
      
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          client_id: clientId,
          client_name: clientName,
          total_received: 0,
          total_delivered: 0,
          current_balance: 0,
          total_billed: 0,
          transaction_count: 0
        })
      }
      
      const client = clientMap.get(clientId)!
      client.total_received += transaction.qty_in || 0
      client.total_delivered += transaction.qty_out || 0
      client.total_billed += transaction.billed_amount || 0
      client.transaction_count += 1
    })
    
    // Calculate current balance
    clientMap.forEach(client => {
      client.current_balance = client.total_received - client.total_delivered
    })
    
    return Array.from(clientMap.values()).sort((a, b) => b.total_billed - a.total_billed)
  },

  async getMonthlyTrends(): Promise<MonthlyTrend[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('date, qty_in, qty_out, billed_amount')
      .order('date')
    
    if (error) throw error
    
    // Group by month
    const monthMap = new Map<string, MonthlyTrend>()
    
    data?.forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: monthName,
          received: 0,
          delivered: 0,
          billed: 0
        })
      }
      
      const month = monthMap.get(monthKey)!
      month.received += transaction.qty_in || 0
      month.delivered += transaction.qty_out || 0
      month.billed += transaction.billed_amount || 0
    })
    
    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month))
  },

  async getComponentAnalytics(): Promise<ComponentAnalytics[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('component, qty_in, qty_out, billed_amount, rate_applied')
    
    if (error) throw error
    
    // Group by component
    const componentMap = new Map<string, ComponentAnalytics>()
    
    data?.forEach(transaction => {
      const component = transaction.component
      
      if (!componentMap.has(component)) {
        componentMap.set(component, {
          component,
          total_quantity: 0,
          total_billed: 0,
          transaction_count: 0,
          avg_rate: 0
        })
      }
      
      const comp = componentMap.get(component)!
      comp.total_quantity += (transaction.qty_in || 0) + (transaction.qty_out || 0)
      comp.total_billed += transaction.billed_amount || 0
      comp.transaction_count += 1
    })
    
    // Calculate average rates
    componentMap.forEach(comp => {
      if (comp.total_quantity > 0) {
        comp.avg_rate = comp.total_billed / comp.total_quantity
      }
    })
    
    return Array.from(componentMap.values()).sort((a, b) => b.total_billed - a.total_billed)
  },

  async getWorkTypeAnalytics(): Promise<WorkTypeAnalytics[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('work_type, qty_out, billed_amount')
      .not('work_type', 'is', null)
    
    if (error) throw error
    
    // Group by work type
    const workTypeMap = new Map<string, WorkTypeAnalytics>()
    
    data?.forEach(transaction => {
      const workType = transaction.work_type!
      
      if (!workTypeMap.has(workType)) {
        workTypeMap.set(workType, {
          work_type: workType,
          quantity: 0,
          billed_amount: 0,
          transaction_count: 0
        })
      }
      
      const work = workTypeMap.get(workType)!
      work.quantity += transaction.qty_out || 0
      work.billed_amount += transaction.billed_amount || 0
      work.transaction_count += 1
    })
    
    return Array.from(workTypeMap.values()).sort((a, b) => b.billed_amount - a.billed_amount)
  },

  async getOverallStats() {
    const { data, error } = await supabase
      .from('transactions')
      .select('qty_in, qty_out, billed_amount, transaction_type')
    
    if (error) throw error
    
    const stats = {
      total_transactions: data?.length || 0,
      total_received: 0,
      total_delivered: 0,
      total_billed: 0,
      received_transactions: 0,
      delivered_transactions: 0
    }
    
    data?.forEach(transaction => {
      stats.total_received += transaction.qty_in || 0
      stats.total_delivered += transaction.qty_out || 0
      stats.total_billed += transaction.billed_amount || 0
      
      if (transaction.transaction_type === 'Received') {
        stats.received_transactions += 1
      } else {
        stats.delivered_transactions += 1
      }
    })
    
    return stats
  }
}
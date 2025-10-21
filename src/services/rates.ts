import { supabase } from '../lib/supabase'
import type { Rate, WorkType, Unit } from '../types'

export const ratesService = {
  async getAll(): Promise<Rate[]> {
    const { data, error } = await supabase
      .from('rates')
      .select('*')
      .order('component')
    
    if (error) throw error
    return data || []
  },

  async getByClientId(clientId: string): Promise<Rate[]> {
    const { data, error } = await supabase
      .from('rates')
      .select('*')
      .eq('client_id', clientId)
      .order('component')
    
    if (error) throw error
    return data || []
  },

  async getRateForTransaction(
    clientId: string,
    component: string,
    workType: WorkType,
    unit: Unit
  ): Promise<number | null> {
    // Priority 1: Client-specific rate
    const { data: clientRate } = await supabase
      .from('rates')
      .select('rate')
      .eq('client_id', clientId)
      .eq('component', component)
      .eq('work_type', workType)
      .eq('unit', unit)
      .single()
    
    if (clientRate) return clientRate.rate
    
    // Priority 2: Default rate (client_id is null)
    const { data: defaultRate } = await supabase
      .from('rates')
      .select('rate')
      .is('client_id', null)
      .eq('component', component)
      .eq('work_type', workType)
      .eq('unit', unit)
      .single()
    
    return defaultRate?.rate || null
  },

  async create(rate: Omit<Rate, 'id' | 'created_at'>): Promise<Rate> {
    const { data, error } = await supabase
      .from('rates')
      .insert(rate)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Omit<Rate, 'id' | 'created_at'>>): Promise<Rate> {
    const { data, error } = await supabase
      .from('rates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('rates')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
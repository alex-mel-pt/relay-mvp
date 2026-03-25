import { createClient } from '@supabase/supabase-js'
import type { User } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** Resolve magic link token → user */
export async function resolveToken(token: string): Promise<User | null> {
  const { data, error } = await supabase.rpc('resolve_magic_link', { p_token: token })
  if (error || data?.error) return null
  return data as User
}

/** Consumer: get own data only */
export async function getConsumerData(token: string) {
  const { data, error } = await supabase.rpc('get_consumer_data', { p_token: token })
  if (error || data?.error) return null
  return data
}

/** Merchant: get all data (admin) */
export async function getMerchantData(token: string) {
  const { data, error } = await supabase.rpc('get_merchant_data', { p_token: token })
  if (error || data?.error) return null
  return data
}

/** Consumer: submit a check-in */
export async function submitCheckin(token: string, orderId: string, inventoryLevel: string) {
  const { data, error } = await supabase.rpc('submit_checkin', {
    p_token: token,
    p_order_id: orderId,
    p_inventory_level: inventoryLevel,
  })
  if (error) return { error: error.message }
  return data
}

/** Reset all demo data to initial seed state */
export async function resetDemoData() {
  const { data, error } = await supabase.rpc('reset_demo_data')
  if (error) return { error: error.message }
  return data
}

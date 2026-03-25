export type UserRole = 'consumer' | 'merchant'
export type GenerationSegment = 'gen_z' | 'millennial'
export type CheckinChannel = 'imessage' | 'sms'
export type InventoryBucket = 'full' | 'halfway' | 'running_low'
export type DeliveryAction = 'ship' | 'delay' | 'skip'
export type OrderStatus = 'active' | 'paused' | 'cancelled'
export type TransactionStatus = 'paid' | 'skipped' | 'refunded'

export interface User {
  id: string
  role: UserRole
  full_name: string
  email: string
  phone: string | null
  generation: GenerationSegment | null
  brand_name: string | null
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  product_name: string
  product_category: string
  status: OrderStatus
  price_cents: number
  cadence_days: number
  original_cadence_days: number
  created_at: string
}

export interface Transaction {
  id: string
  order_id: string
  user_id: string
  amount_cents: number
  status: TransactionStatus
  charged_at: string
}

export interface Checkin {
  id: string
  order_id: string
  user_id: string
  inventory_level: InventoryBucket
  channel: CheckinChannel
  responded_at: string
}

export interface CheckinSchedule {
  id: string
  order_id: string
  user_id: string
  channel: CheckinChannel
  frequency_days: number
  next_checkin_date: string
  auto_adjust: boolean
  created_at: string
  updated_at: string
}

export interface DeliverySchedule {
  id: string
  order_id: string
  user_id: string
  scheduled_date: string
  actual_date: string | null
  action: DeliveryAction
  days_adjusted: number
  adjusted_by_checkin_id: string | null
  savings_cents: number
  created_at: string
}

export interface MagicLink {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
}

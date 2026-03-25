import { useState } from 'react'
import type { User, Order, Checkin, DeliverySchedule, Transaction } from '../lib/types'
import { resetDemoData } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import IMessageCard from '../components/IMessageCard'
import SMSReply from '../components/SMSReply'

interface MerchantData {
  merchant: User
  users: User[]
  orders: Order[]
  transactions: Transaction[]
  checkins: Checkin[]
  checkin_schedule: any[]
  delivery_schedule: DeliverySchedule[]
}

interface Props {
  user: User
  data: MerchantData
}

const MERCHANT_TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'sku', label: 'SKU Analytics', icon: '📦' },
  { id: 'subscribers', label: 'Subscribers', icon: '👥' },
  { id: 'checkin-genz', label: 'Check-in: Gen Z', icon: '💬' },
  { id: 'checkin-mill', label: 'Check-in: Millennials', icon: '📱' },
]

// ─── Helpers ────────────────────────────────────────────────────

function cents(n: number) { return `$${(n / 100).toFixed(2)}` }
function centsShort(n: number) { return n >= 100000 ? `$${(n / 100000).toFixed(1)}k` : `$${(n / 100).toFixed(0)}` }

function bucketColor(l: string) {
  return l === 'full' ? 'bg-peel-green-light text-peel-green border-peel-green/20'
    : l === 'halfway' ? 'bg-peel-amber-light text-peel-amber border-peel-amber/20'
    : l === 'running_low' ? 'bg-peel-red-light text-peel-red border-peel-red/20'
    : 'bg-peel-gray-100 text-peel-gray-600'
}

// ─── Metrics computation ────────────────────────────────────────

function computeMetrics(
  users: User[], orders: Order[], checkins: Checkin[],
  deliveries: DeliverySchedule[], transactions: Transaction[],
) {
  const totalSubscribers = users.length
  const subscribersWithCheckins = new Set(checkins.map(c => c.user_id)).size
  const activeOrders = orders.filter(o => o.status === 'active').length
  const checkinRate = totalSubscribers > 0 ? Math.round((subscribersWithCheckins / totalSubscribers) * 100) : 0
  const totalSaved = deliveries.reduce((s, d) => s + d.savings_cents, 0)
  const totalSkipped = deliveries.filter(d => d.action === 'skip').length
  const totalDelayed = deliveries.filter(d => d.action === 'delay').length
  const adaptedOrders = orders.filter(o => o.cadence_days !== o.original_cadence_days).length

  // Revenue retained
  const industryChurnRate = 0.30
  const avgOrderValue = orders.reduce((s, o) => s + o.price_cents, 0) / (orders.length || 1)
  const estimatedChurnWithout = Math.round(totalSubscribers * industryChurnRate)
  const revenueAtRisk = estimatedChurnWithout * avgOrderValue * 6
  const revenueRetained = Math.round(revenueAtRisk * 0.6)

  // Lifetime extension
  const industryAvg = 3.2
  const adapted = orders.filter(o => o.cadence_days !== o.original_cadence_days)
  const avgCadenceExt = adapted.length > 0 ? adapted.reduce((s, o) => s + (o.cadence_days - o.original_cadence_days), 0) / adapted.length : 0
  const lifetimeExt = Math.round(avgCadenceExt * 0.15 * 10) / 10
  const relayLifetime = Math.round((industryAvg + lifetimeExt) * 10) / 10

  // Churn risk radar
  const atRisk: { user: User; order: Order; fullStreak: number; intervention: string }[] = []
  const orderCheckins = new Map<string, Checkin[]>()
  checkins.forEach(c => {
    if (!orderCheckins.has(c.order_id)) orderCheckins.set(c.order_id, [])
    orderCheckins.get(c.order_id)!.push(c)
  })
  orderCheckins.forEach((cks, orderId) => {
    const sorted = [...cks].sort((a, b) => a.responded_at.localeCompare(b.responded_at))
    let streak = 0, maxStreak = 0
    for (const c of sorted) { if (c.inventory_level === 'full') { streak++; maxStreak = Math.max(maxStreak, streak) } else { streak = 0 } }
    if (maxStreak >= 2) {
      const order = orders.find(o => o.id === orderId)
      const usr = users.find(u => u.id === cks[0].user_id)
      const skips = deliveries.filter(d => d.order_id === orderId && d.action === 'skip').length
      if (order && usr) atRisk.push({ user: usr, order, fullStreak: maxStreak, intervention: skips > 0 ? `${skips} deliveries skipped` : 'Cadence adjusted' })
    }
  })

  // Paradox of less
  const totalShipments = deliveries.filter(d => d.action === 'ship').length
  const totalPlanned = deliveries.length
  const shipmentsAvoided = totalPlanned - totalShipments
  const shipmentReductionPct = totalPlanned > 0 ? Math.round((shipmentsAvoided / totalPlanned) * 100) : 0
  const totalRevenue = transactions.filter(t => t.status === 'paid').reduce((s, t) => s + t.amount_cents, 0)
  const revenuePerSub = totalSubscribers > 0 ? Math.round(totalRevenue / totalSubscribers) : 0
  const fulfillmentSaved = shipmentsAvoided * 850

  // Monthly revenue
  const monthlyMap = new Map<string, { paid: number; skipped: number }>()
  transactions.forEach(t => {
    const m = t.charged_at.slice(0, 7)
    if (!monthlyMap.has(m)) monthlyMap.set(m, { paid: 0, skipped: 0 })
    const e = monthlyMap.get(m)!
    if (t.status === 'paid') e.paid += t.amount_cents
    if (t.status === 'skipped') e.skipped += t.amount_cents
  })
  const monthlyTrend = Array.from(monthlyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, d]) => ({ month, ...d }))

  // SKU pantry data
  const productCheckins = new Map<string, { full: number; halfway: number; running_low: number; total: number }>()
  checkins.forEach(c => {
    const order = orders.find(o => o.id === c.order_id)
    if (!order) return
    const n = order.product_name
    if (!productCheckins.has(n)) productCheckins.set(n, { full: 0, halfway: 0, running_low: 0, total: 0 })
    const e = productCheckins.get(n)!
    e[c.inventory_level as 'full' | 'halfway' | 'running_low']++
    e.total++
  })
  const pantryData = Array.from(productCheckins.entries())
    .map(([name, d]) => ({ name, ...d, overstockRate: Math.round((d.full / d.total) * 100) }))
    .sort((a, b) => b.overstockRate - a.overstockRate)

  // Unique SKU names
  const skuNames = [...new Set(orders.map(o => o.product_name))].sort()

  return {
    totalSubscribers, activeOrders, checkinRate, totalSaved, totalSkipped, totalDelayed, adaptedOrders,
    revenueRetained, revenueAtRisk, estimatedChurnWithout, subscribersProtected: subscribersWithCheckins,
    industryAvg, relayLifetime, lifetimeExt, avgCadenceExt: Math.round(avgCadenceExt), adaptedOrdersCount: adapted.length,
    atRisk,
    shipmentReductionPct, shipmentsAvoided, totalShipments, revenuePerSub, fulfillmentSaved, monthlyTrend,
    pantryData, skuNames,
  }
}

// ─── Component ──────────────────────────────────────────────────

export default function MerchantPage({ user, data }: Props) {
  const [activeTab, setActiveTab] = useState('overview')
  const [skuFilter, setSkuFilter] = useState<string>('all')
  const [activeSku, setActiveSku] = useState<string | null>(null)

  // Check-in settings state
  const [gzTone, setGzTone] = useState<'casual' | 'friendly' | 'minimal'>('casual')
  const [gzEmoji, setGzEmoji] = useState(true)
  const [gzBrandColor, setGzBrandColor] = useState('#4c6ef5')
  const [mlTone, setMlTone] = useState<'professional' | 'warm' | 'data-focused'>('data-focused')
  const [mlShowSavings, setMlShowSavings] = useState(true)
  const [mlShowLink, setMlShowLink] = useState(true)

  const users = data.users || []
  const orders = data.orders || []
  const checkins = data.checkins || []
  const deliveries = data.delivery_schedule || []
  const transactions = data.transactions || []

  // Apply SKU filter to relevant data
  const filteredOrders = skuFilter === 'all' ? orders : orders.filter(o => o.product_name === skuFilter)
  const filteredOrderIds = new Set(filteredOrders.map(o => o.id))
  const filteredUserIds = new Set(filteredOrders.map(o => o.user_id))
  const filteredUsers = skuFilter === 'all' ? users : users.filter(u => filteredUserIds.has(u.id))
  const filteredCheckins = skuFilter === 'all' ? checkins : checkins.filter(c => filteredOrderIds.has(c.order_id))
  const filteredDeliveries = skuFilter === 'all' ? deliveries : deliveries.filter(d => filteredOrderIds.has(d.order_id))
  const filteredTransactions = skuFilter === 'all' ? transactions : transactions.filter(t => filteredOrderIds.has(t.order_id))

  const m = computeMetrics(filteredUsers, filteredOrders, filteredCheckins, filteredDeliveries, filteredTransactions)

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} activeTab={activeTab} onTabChange={setActiveTab} tabs={MERCHANT_TABS} onReset={async () => {
        await resetDemoData()
        window.location.reload()
      }} />

      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold text-peel-navy">Usage Pulse</h1>
            <p className="text-peel-gray-400 text-sm mt-1">Adaptive subscription analytics across all brands.</p>
          </div>
          {/* SKU filter — visible on overview */}
          {(activeTab === 'overview') && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-peel-gray-400">Filter by SKU:</span>
              <select
                value={skuFilter}
                onChange={e => setSkuFilter(e.target.value)}
                className="text-sm border border-peel-gray-200 rounded-lg px-3 py-1.5 bg-white text-peel-navy focus:outline-none focus:border-peel-blue"
              >
                <option value="all">All Products</option>
                {m.skuNames.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* OVERVIEW TAB                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top stats */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Subscribers" value={String(m.totalSubscribers)} color="blue" />
              <StatCard label="Active Orders" value={String(m.activeOrders)} color="default" />
              <StatCard label="Check-in Rate" value={`${m.checkinRate}%`} sub="of subscribers" color="green" />
              <StatCard label="Revenue Protected" value={centsShort(m.revenueRetained)} color="green" />
            </div>

            {/* Retention & Revenue */}
            <section>
              <h2 className="text-lg font-heading font-semibold text-peel-navy mb-4">Retention & Revenue</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-xl border border-peel-gray-200 p-5">
                  <div className="text-xs text-peel-gray-400 uppercase tracking-wider mb-1">Revenue at Risk</div>
                  <div className="text-2xl font-heading font-bold text-peel-red">{centsShort(m.revenueAtRisk)}</div>
                  <div className="text-xs text-peel-gray-400 mt-1">{m.estimatedChurnWithout} would churn (30% industry avg)</div>
                </div>
                <div className="bg-white rounded-xl border border-peel-gray-200 p-5">
                  <div className="text-xs text-peel-gray-400 uppercase tracking-wider mb-1">Revenue Protected</div>
                  <div className="text-2xl font-heading font-bold text-peel-green">{centsShort(m.revenueRetained)}</div>
                  <div className="text-xs text-peel-gray-400 mt-1">{m.subscribersProtected} engaged via check-in</div>
                </div>
                <div className="bg-white rounded-xl border border-peel-gray-200 p-5">
                  <div className="text-xs text-peel-gray-400 uppercase tracking-wider mb-1">Subscriber Lifetime</div>
                  <div className="flex items-end gap-2">
                    <span className="text-sm text-peel-gray-400 line-through">{m.industryAvg}mo</span>
                    <span className="text-2xl font-heading font-bold text-peel-green">{m.relayLifetime}mo</span>
                  </div>
                  <div className="text-xs text-peel-gray-400 mt-1">+{m.lifetimeExt}mo from adaptive cadence</div>
                </div>
              </div>
            </section>

            {/* Paradox of Less */}
            <section>
              <h2 className="text-lg font-heading font-semibold text-peel-navy mb-4">The Paradox of Less</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-peel-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-peel-gray-400 uppercase tracking-wider">Shipments Reduced</div>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-peel-amber-light text-peel-amber">↓ {m.shipmentReductionPct}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-heading font-bold text-peel-gray-400">{m.totalShipments + m.shipmentsAvoided}</div>
                      <div className="text-xs text-peel-gray-400">Planned</div>
                    </div>
                    <div>
                      <div className="text-2xl font-heading font-bold text-peel-blue">{m.totalShipments}</div>
                      <div className="text-xs text-peel-gray-400">Actual</div>
                    </div>
                    <div>
                      <div className="text-2xl font-heading font-bold text-peel-green">{m.shipmentsAvoided}</div>
                      <div className="text-xs text-peel-gray-400">Avoided</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-peel-gray-100 text-xs text-peel-gray-400">Fulfillment saved: {cents(m.fulfillmentSaved)}</div>
                </div>
                <div className="bg-white rounded-xl border border-peel-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-peel-gray-400 uppercase tracking-wider">Revenue per Subscriber</div>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-peel-green-light text-peel-green">Stable</span>
                  </div>
                  <div className="text-3xl font-heading font-bold text-peel-navy mb-3">{cents(m.revenuePerSub)}</div>
                  <div className="space-y-1.5">
                    {m.monthlyTrend.map(mt => {
                      const max = Math.max(...m.monthlyTrend.map(t => t.paid))
                      return (
                        <div key={mt.month} className="flex items-center gap-2">
                          <span className="text-xs text-peel-gray-400 w-16">{mt.month}</span>
                          <div className="flex-1 h-3 bg-peel-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-peel-blue/60 rounded-full" style={{ width: `${max > 0 ? (mt.paid / max) * 100 : 0}%` }} />
                          </div>
                          <span className="text-xs text-peel-gray-500 w-14 text-right">{cents(mt.paid)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Churn Risk Radar */}
            {m.atRisk.length > 0 && (
              <section>
                <h2 className="text-lg font-heading font-semibold text-peel-navy mb-4">Churn Risk Radar</h2>
                <div className="bg-white rounded-xl border border-peel-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-peel-gray-100 bg-peel-gray-50">
                        <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Subscriber</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Product</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Risk Signal</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Intervention</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.atRisk.map((r, i) => (
                        <tr key={i} className="border-b border-peel-gray-50 last:border-0">
                          <td className="px-5 py-3 font-medium text-peel-navy">{r.user.full_name}</td>
                          <td className="px-5 py-3 text-peel-gray-600">{r.order.product_name}</td>
                          <td className="px-5 py-3"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-peel-red-light text-peel-red border border-peel-red/20">{r.fullStreak}× "Full"</span></td>
                          <td className="px-5 py-3 text-peel-gray-600">{r.intervention}</td>
                          <td className="px-5 py-3"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-peel-green-light text-peel-green"><span className="w-1.5 h-1.5 rounded-full bg-peel-green" />Retained</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Overstock signals quick view */}
            <section>
              <h2 className="text-lg font-heading font-semibold text-peel-navy mb-4">Overstock Signals</h2>
              <div className="bg-white rounded-xl border border-peel-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-peel-gray-100 bg-peel-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Product</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Check-ins</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Overstock Rate</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.pantryData.map(p => (
                      <tr key={p.name} className="border-b border-peel-gray-50 last:border-0">
                        <td className="px-5 py-3 font-medium text-peel-navy">{p.name}</td>
                        <td className="px-5 py-3 text-peel-gray-600">{p.total}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-peel-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${p.overstockRate > 70 ? 'bg-peel-red' : p.overstockRate > 40 ? 'bg-peel-amber' : 'bg-peel-green'}`} style={{ width: `${p.overstockRate}%` }} />
                            </div>
                            <span className="text-xs text-peel-gray-500">{p.overstockRate}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs font-medium">{p.overstockRate > 70 ? <span className="text-peel-red">High overstock</span> : p.overstockRate > 40 ? <span className="text-peel-amber">Moderate</span> : <span className="text-peel-green">Healthy</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SKU ANALYTICS TAB                                      */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === 'sku' && (
          <div>
            <h2 className="text-lg font-heading font-semibold text-peel-navy mb-4">SKU Analytics</h2>

            {/* Sub-tabs for each SKU */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {m.skuNames.map(sku => (
                <button
                  key={sku}
                  onClick={() => setActiveSku(activeSku === sku ? null : sku)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSku === sku ? 'bg-peel-navy text-white' : 'bg-white border border-peel-gray-200 text-peel-gray-600 hover:border-peel-navy'
                  }`}
                >
                  {sku}
                </button>
              ))}
            </div>

            {/* Show all or selected SKU */}
            {(activeSku ? [activeSku] : m.skuNames).map(skuName => {
              const skuOrders = orders.filter(o => o.product_name === skuName)
              const skuOrderIds = new Set(skuOrders.map(o => o.id))
              const skuCheckins = checkins.filter(c => skuOrderIds.has(c.order_id))
              const skuDeliveries = deliveries.filter(d => skuOrderIds.has(d.order_id))
              const skuSubscribers = new Set(skuOrders.map(o => o.user_id)).size
              const skuSkipped = skuDeliveries.filter(d => d.action === 'skip').length
              const skuDelayed = skuDeliveries.filter(d => d.action === 'delay').length
              const skuSaved = skuDeliveries.reduce((s, d) => s + d.savings_cents, 0)
              const avgCadence = skuOrders.length > 0 ? Math.round(skuOrders.reduce((s, o) => s + o.cadence_days, 0) / skuOrders.length) : 0
              const originalCadence = skuOrders.length > 0 ? skuOrders[0].original_cadence_days : 30
              const pantry = m.pantryData.find(p => p.name === skuName)

              return (
                <div key={skuName} className="bg-white rounded-xl border border-peel-gray-200 p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-semibold text-peel-navy">{skuName}</h3>
                    <span className="text-xs text-peel-gray-400">{skuOrders[0]?.product_category}</span>
                  </div>

                  <div className="grid grid-cols-5 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-peel-gray-400">Subscribers</div>
                      <div className="text-lg font-bold text-peel-navy">{skuSubscribers}</div>
                    </div>
                    <div>
                      <div className="text-xs text-peel-gray-400">Check-ins</div>
                      <div className="text-lg font-bold text-peel-navy">{skuCheckins.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-peel-gray-400">Avg Cadence</div>
                      <div className="text-lg font-bold text-peel-navy">{avgCadence}d <span className="text-xs text-peel-gray-400 font-normal">(was {originalCadence}d)</span></div>
                    </div>
                    <div>
                      <div className="text-xs text-peel-gray-400">Skipped / Delayed</div>
                      <div className="text-lg font-bold text-peel-amber">{skuSkipped} / {skuDelayed}</div>
                    </div>
                    <div>
                      <div className="text-xs text-peel-gray-400">Consumer Savings</div>
                      <div className="text-lg font-bold text-peel-green">{cents(skuSaved)}</div>
                    </div>
                  </div>

                  {/* Pantry Health bar */}
                  {pantry && (
                    <div>
                      <div className="text-xs text-peel-gray-400 mb-2">Inventory Distribution ({pantry.total} check-ins)</div>
                      <div className="flex h-6 rounded-full overflow-hidden">
                        {pantry.full > 0 && <div className="bg-peel-green/50 flex items-center justify-center" style={{ width: `${(pantry.full / pantry.total) * 100}%` }}><span className="text-[10px] text-peel-green font-medium">{Math.round((pantry.full / pantry.total) * 100)}%</span></div>}
                        {pantry.halfway > 0 && <div className="bg-peel-amber/50 flex items-center justify-center" style={{ width: `${(pantry.halfway / pantry.total) * 100}%` }}><span className="text-[10px] text-peel-amber font-medium">{Math.round((pantry.halfway / pantry.total) * 100)}%</span></div>}
                        {pantry.running_low > 0 && <div className="bg-peel-red/50 flex items-center justify-center" style={{ width: `${(pantry.running_low / pantry.total) * 100}%` }}><span className="text-[10px] text-peel-red font-medium">{Math.round((pantry.running_low / pantry.total) * 100)}%</span></div>}
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-peel-gray-400">
                        <span>Full: {pantry.full}</span>
                        <span>Halfway: {pantry.halfway}</span>
                        <span>Running Low: {pantry.running_low}</span>
                      </div>
                      <div className="mt-2 text-xs">
                        Overstock rate: <span className={`font-medium ${pantry.overstockRate > 70 ? 'text-peel-red' : pantry.overstockRate > 40 ? 'text-peel-amber' : 'text-peel-green'}`}>{pantry.overstockRate}%</span>
                        {pantry.overstockRate > 60 && <span className="text-peel-gray-400"> — consider extending default cadence beyond {originalCadence}d</span>}
                      </div>
                    </div>
                  )}

                  {/* Delivery log for this SKU */}
                  {skuDeliveries.filter(d => d.adjusted_by_checkin_id).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-peel-gray-100">
                      <div className="text-xs text-peel-gray-400 mb-2">Recent Adjustments</div>
                      <div className="space-y-1">
                        {[...skuDeliveries].filter(d => d.adjusted_by_checkin_id).sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date)).slice(0, 5).map((d, i) => {
                          const sub = users.find(u => u.id === d.user_id)
                          return (
                            <div key={i} className="flex items-center justify-between text-xs py-1">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex px-2 py-0.5 rounded-full font-medium border ${d.action === 'skip' ? bucketColor('full') : d.action === 'delay' ? bucketColor('halfway') : bucketColor('running_low')}`}>
                                  {d.action === 'skip' ? 'Skipped' : d.action === 'delay' ? 'Delayed' : 'Shipped'}
                                </span>
                                <span className="text-peel-gray-500">{sub?.full_name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {d.days_adjusted > 0 && <span className="text-peel-gray-400">+{d.days_adjusted}d</span>}
                                {d.savings_cents > 0 && <span className="text-peel-green font-medium">{cents(d.savings_cents)}</span>}
                                <span className="text-peel-gray-300">{new Date(d.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SUBSCRIBERS TAB                                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === 'subscribers' && (
          <div>
            <h2 className="text-lg font-heading font-semibold text-peel-navy mb-4">All Subscribers</h2>
            <div className="bg-white rounded-xl border border-peel-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-peel-gray-100 bg-peel-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Generation</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Orders</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Check-ins</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Saved</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: User) => {
                    const uo = orders.filter(o => o.user_id === u.id)
                    const uc = checkins.filter(c => c.user_id === u.id)
                    const ud = deliveries.filter(d => d.user_id === u.id)
                    const uSaved = ud.reduce((s, d) => s + d.savings_cents, 0)
                    const isAtRisk = m.atRisk.some(r => r.user.id === u.id)

                    return (
                      <tr key={u.id} className="border-b border-peel-gray-50 last:border-0">
                        <td className="px-5 py-3">
                          <div className="font-medium text-peel-navy">{u.full_name}</div>
                          <div className="text-xs text-peel-gray-400">{u.email}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.generation === 'gen_z' ? 'bg-purple-50 text-purple-600' : u.generation === 'millennial' ? 'bg-blue-50 text-blue-600' : 'bg-peel-gray-100 text-peel-gray-500'}`}>
                            {u.generation === 'gen_z' ? 'Gen Z' : u.generation === 'millennial' ? 'Millennial' : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-peel-gray-600">{uo.length}</td>
                        <td className="px-5 py-3 text-peel-gray-600">{uc.length}</td>
                        <td className="px-5 py-3 font-medium text-peel-green">{uSaved > 0 ? cents(uSaved) : '—'}</td>
                        <td className="px-5 py-3">
                          {isAtRisk ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-peel-green-light text-peel-green"><span className="w-1.5 h-1.5 rounded-full bg-peel-green" />Saved</span>
                          ) : (
                            <span className="text-xs text-peel-gray-400">Healthy</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* CHECK-IN PREVIEW: GEN Z                                */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === 'checkin-genz' && (
          <div>
            <h2 className="text-lg font-heading font-semibold text-peel-navy mb-1">Check-in: Gen Z (iMessage)</h2>
            <p className="text-xs text-peel-gray-400 mb-6">Preview and configure the iMessage check-in card for Gen Z subscribers.</p>

            <div className="grid grid-cols-2 gap-8 items-start">
              {/* Preview */}
              <div>
                <div className="text-xs font-medium text-peel-gray-400 uppercase tracking-wider mb-3">Preview</div>
                <div className="shadow-xl rounded-[2rem] overflow-hidden">
                  <IMessageCard
                    brandName="Your Brand"
                    productName="Faded Serum"
                    checkInUrl="#"
                    daysUntilDelivery={5}
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-peel-gray-200 p-5">
                  <h3 className="font-medium text-peel-navy mb-4">Message Settings</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-peel-gray-500 block mb-1.5">Tone</label>
                      <div className="flex gap-2">
                        {(['casual', 'friendly', 'minimal'] as const).map(t => (
                          <button key={t} onClick={() => setGzTone(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${gzTone === t ? 'bg-peel-navy text-white' : 'bg-peel-gray-100 text-peel-gray-600 hover:bg-peel-gray-200'}`}>{t}</button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-peel-gray-500">Use Emoji</div>
                        <div className="text-xs text-peel-gray-400">Add emoji to check-in messages</div>
                      </div>
                      <button onClick={() => setGzEmoji(!gzEmoji)} className={`w-10 h-6 rounded-full transition-colors ${gzEmoji ? 'bg-peel-blue' : 'bg-peel-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${gzEmoji ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-peel-gray-500 block mb-1.5">Brand Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={gzBrandColor} onChange={e => setGzBrandColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                        <span className="text-xs text-peel-gray-400 font-mono">{gzBrandColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-peel-gray-200 p-5">
                  <h3 className="font-medium text-peel-navy mb-3">Channel Details</h3>
                  <div className="space-y-2 text-sm text-peel-gray-600">
                    <div className="flex justify-between"><span className="text-peel-gray-400">Channel</span><span>Apple Business Messages (iMessage)</span></div>
                    <div className="flex justify-between"><span className="text-peel-gray-400">Interaction</span><span>Tap button — no redirect</span></div>
                    <div className="flex justify-between"><span className="text-peel-gray-400">Fallback</span><span>Magic link → web check-in</span></div>
                    <div className="flex justify-between"><span className="text-peel-gray-400">Timing</span><span>2-3 days before delivery</span></div>
                    <div className="flex justify-between"><span className="text-peel-gray-400">Duration</span><span>~3 seconds</span></div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl border border-purple-100 p-5">
                  <div className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-2">Gen Z Insight</div>
                  <p className="text-xs text-peel-gray-600 leading-relaxed">
                    "Why doesn't every brand do this already? That's literally all they need to ask me." — Chloe, Gen Z subscriber. iMessage cards feel native, not intrusive. One tap, zero friction, instant trust.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* CHECK-IN PREVIEW: MILLENNIALS                          */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === 'checkin-mill' && (
          <div>
            <h2 className="text-lg font-heading font-semibold text-peel-navy mb-1">Check-in: Millennials (SMS)</h2>
            <p className="text-xs text-peel-gray-400 mb-6">Preview and configure the SMS check-in flow for Millennial subscribers.</p>

            <div className="grid grid-cols-2 gap-8 items-start">
              {/* Preview */}
              <div>
                <div className="text-xs font-medium text-peel-gray-400 uppercase tracking-wider mb-3">Preview</div>
                <div className="shadow-xl rounded-[1.5rem] overflow-hidden">
                  <SMSReply
                    brandName="Your Brand"
                    productName="AG1 Daily Greens"
                    checkInUrl="#"
                    daysUntilDelivery={5}
                    savedTotal={15800}
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-peel-gray-200 p-5">
                  <h3 className="font-medium text-peel-navy mb-4">Message Settings</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-peel-gray-500 block mb-1.5">Tone</label>
                      <div className="flex gap-2">
                        {(['professional', 'warm', 'data-focused'] as const).map(t => (
                          <button key={t} onClick={() => setMlTone(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${mlTone === t ? 'bg-peel-navy text-white' : 'bg-peel-gray-100 text-peel-gray-600 hover:bg-peel-gray-200'}`}>{t}</button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-peel-gray-500">Show Savings</div>
                        <div className="text-xs text-peel-gray-400">Include cumulative savings in message</div>
                      </div>
                      <button onClick={() => setMlShowSavings(!mlShowSavings)} className={`w-10 h-6 rounded-full transition-colors ${mlShowSavings ? 'bg-peel-blue' : 'bg-peel-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${mlShowSavings ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-peel-gray-500">Include Web Link</div>
                        <div className="text-xs text-peel-gray-400">Add magic link for web check-in option</div>
                      </div>
                      <button onClick={() => setMlShowLink(!mlShowLink)} className={`w-10 h-6 rounded-full transition-colors ${mlShowLink ? 'bg-peel-blue' : 'bg-peel-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${mlShowLink ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-peel-gray-200 p-5">
                  <h3 className="font-medium text-peel-navy mb-3">Channel Details</h3>
                  <div className="space-y-2 text-sm text-peel-gray-600">
                    <div className="flex justify-between"><span className="text-peel-gray-400">Channel</span><span>SMS (standard text message)</span></div>
                    <div className="flex justify-between"><span className="text-peel-gray-400">Interaction</span><span>Reply 1/2/3</span></div>
                    <div className="flex justify-between"><span className="text-peel-gray-400">Fallback</span><span>Magic link → web check-in</span></div>
                    <div className="flex justify-between"><span className="text-peel-gray-400">Timing</span><span>2-3 days before delivery</span></div>
                    <div className="flex justify-between"><span className="text-peel-gray-400">Duration</span><span>~3 seconds</span></div>
                    <div className="flex justify-between"><span className="text-peel-gray-400">Engagement hook</span><span>Savings number (not gamification)</span></div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-2">Millennial Insight</div>
                  <p className="text-xs text-peel-gray-600 leading-relaxed">
                    "If it's one tap, I'll do it while I'm waiting for my coffee to brew." — Marcus, Millennial subscriber. SMS is universal, fast, and the savings number is the motivation. "Numbers are my love language... The screenshot IS the gamification."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

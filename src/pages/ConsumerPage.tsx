import { useState } from 'react'
import type { User, Order, Checkin, DeliverySchedule, CheckinSchedule, Transaction } from '../lib/types'
import { submitCheckin, getConsumerData, resetDemoData } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'

interface ConsumerData {
  user: User
  orders: Order[]
  transactions: Transaction[]
  checkins: Checkin[]
  checkin_schedule: CheckinSchedule[]
  delivery_schedule: DeliverySchedule[]
}

interface Props {
  user: User
  data: ConsumerData
  token: string
}

const CONSUMER_TABS = [
  { id: 'subscriptions', label: 'My Subscriptions', icon: '📦' },
  { id: 'milestones', label: 'Milestones', icon: '🏆' },
  { id: 'checkins', label: 'Check-in History', icon: '📋' },
  { id: 'savings', label: 'Savings', icon: '💰' },
]

function cents(amount: number) {
  return `$${(amount / 100).toFixed(2)}`
}

function bucketLabel(level: string) {
  switch (level) {
    case 'full': return 'Full'
    case 'halfway': return 'Halfway'
    case 'running_low': return 'Running Low'
    default: return level
  }
}

function bucketColor(level: string) {
  switch (level) {
    case 'full': return 'bg-peel-green-light text-peel-green border-peel-green/20'
    case 'halfway': return 'bg-peel-amber-light text-peel-amber border-peel-amber/20'
    case 'running_low': return 'bg-peel-red-light text-peel-red border-peel-red/20'
    default: return 'bg-peel-gray-100 text-peel-gray-600'
  }
}

function actionLabel(action: string) {
  switch (action) {
    case 'skip': return 'Skipped'
    case 'delay': return 'Delayed'
    case 'ship': return 'Shipped'
    default: return action
  }
}

function actionColor(action: string) {
  switch (action) {
    case 'skip': return 'text-peel-green'
    case 'delay': return 'text-peel-amber'
    case 'ship': return 'text-peel-blue'
    default: return 'text-peel-gray-500'
  }
}

export default function ConsumerPage({ user, data, token }: Props) {
  const [activeTab, setActiveTab] = useState('subscriptions')
  const [checkinOrder, setCheckinOrder] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkinResult, setCheckinResult] = useState<any>(null)
  const [liveData, setLiveData] = useState(data)

  const orders = liveData.orders || []
  const checkins = liveData.checkins || []
  const deliveries = liveData.delivery_schedule || []
  const schedules = liveData.checkin_schedule || []

  const totalSaved = deliveries.reduce((sum: number, d: DeliverySchedule) => sum + d.savings_cents, 0)
  const totalSkipped = deliveries.filter((d: DeliverySchedule) => d.action === 'skip').length
  const totalCheckins = checkins.length

  async function handleCheckin(orderId: string, level: string) {
    setSubmitting(true)
    const result = await submitCheckin(token, orderId, level)
    setCheckinResult(result)
    setSubmitting(false)
    setCheckinOrder(null)

    // Refresh data
    const fresh = await getConsumerData(token)
    if (fresh) setLiveData(fresh)

    setTimeout(() => setCheckinResult(null), 5000)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} activeTab={activeTab} onTabChange={setActiveTab} tabs={CONSUMER_TABS} onReset={async () => {
        await resetDemoData()
        const fresh = await getConsumerData(token)
        if (fresh) setLiveData(fresh)
      }} />

      <main className="flex-1 p-8 overflow-auto">
        {/* Success toast */}
        {checkinResult?.success && (
          <div className="fixed top-4 right-4 bg-peel-green text-white px-5 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
            <div className="font-medium text-sm">Check-in received!</div>
            <div className="text-xs opacity-90">
              {checkinResult.action === 'skip' && `Delivery skipped. You saved ${cents(checkinResult.savings_cents)}`}
              {checkinResult.action === 'delay' && `Delivery delayed by ${checkinResult.days_adjusted} days`}
              {checkinResult.action === 'ship' && 'Delivery confirmed — on its way!'}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-peel-navy">
            Hey, {user.full_name.split(' ')[0]}
          </h1>
          <p className="text-peel-gray-400 text-sm mt-1">
            Your subscriptions, synced to your rhythm.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Saved" value={cents(totalSaved)} color="green" />
          <StatCard label="Deliveries Skipped" value={String(totalSkipped)} sub="no waste" color="amber" />
          <StatCard label="Check-ins" value={String(totalCheckins)} sub="responses" color="blue" />
        </div>

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <h2 className="text-lg font-heading font-semibold text-peel-navy">Active Subscriptions</h2>
            {orders.filter((o: Order) => o.status === 'active').map((order: Order) => {
              const nextDelivery = deliveries
                .filter((d: DeliverySchedule) => d.order_id === order.id && !d.actual_date && d.action === 'ship')
                .sort((a: DeliverySchedule, b: DeliverySchedule) => a.scheduled_date.localeCompare(b.scheduled_date))[0]
              const schedule = schedules.find((s: CheckinSchedule) => s.order_id === order.id)
              const cadenceChanged = order.cadence_days !== order.original_cadence_days

              return (
                <div key={order.id} className="bg-white rounded-xl border border-peel-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-peel-navy">{order.product_name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-peel-gray-400">
                        <span>{cents(order.price_cents)}/delivery</span>
                        <span className="text-peel-gray-300">|</span>
                        <span className="capitalize">{order.product_category}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-peel-gray-400">Cadence:</span>
                        <span className="font-medium text-peel-navy">
                          {order.cadence_days}d
                        </span>
                        {cadenceChanged && (
                          <span className="text-xs text-peel-green">(was {order.original_cadence_days}d)</span>
                        )}
                      </div>
                      {nextDelivery && (
                        <div className="text-peel-gray-400 mt-0.5">
                          Next: {new Date(nextDelivery.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Check-in button or form */}
                  <div className="mt-4 pt-4 border-t border-peel-gray-100">
                    {checkinOrder === order.id ? (
                      <div>
                        <p className="text-sm text-peel-gray-500 mb-3">How much {order.product_name} do you have left?</p>
                        <div className="flex gap-2">
                          {(['full', 'halfway', 'running_low'] as const).map((level) => (
                            <button
                              key={level}
                              disabled={submitting}
                              onClick={() => handleCheckin(order.id, level)}
                              className={`flex-1 py-3 px-3 rounded-lg border text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${bucketColor(level)}`}
                            >
                              <div className="text-lg mb-1">
                                {level === 'full' ? '🟢' : level === 'halfway' ? '🟡' : '🔴'}
                              </div>
                              {bucketLabel(level)}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setCheckinOrder(null)}
                          className="mt-2 text-xs text-peel-gray-400 hover:text-peel-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-peel-gray-400">
                          {schedule
                            ? `Next check-in: ${new Date(schedule.next_checkin_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            : 'No check-in scheduled'}
                        </div>
                        <button
                          onClick={() => setCheckinOrder(order.id)}
                          className="px-4 py-2 bg-peel-blue text-white text-sm font-medium rounded-lg hover:bg-peel-blue/90 transition-colors"
                        >
                          Check in now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ═══ Milestones Tab ═══ */}
        {activeTab === 'milestones' && (() => {
          const isGenZ = user.generation === 'gen_z'

          // Calculate milestones from data
          const firstCheckinDate = checkins.length > 0
            ? new Date(Math.min(...checkins.map(c => new Date(c.responded_at).getTime())))
            : null
          const daysTogether = firstCheckinDate
            ? Math.ceil((Date.now() - firstCheckinDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0
          const monthsTogether = Math.floor(daysTogether / 30)

          // Average rhythm per order
          const rhythms = orders
            .filter((o: Order) => o.cadence_days !== o.original_cadence_days)
            .map((o: Order) => ({ name: o.product_name, rhythm: o.cadence_days, original: o.original_cadence_days }))

          const skippedDeliveries = deliveries.filter(d => d.action === 'skip').length
          const delayedDeliveries = deliveries.filter(d => d.action === 'delay').length

          // Consecutive check-in streak (per order, take best)
          let bestStreak = 0
          const orderCheckinMap = new Map<string, Checkin[]>()
          checkins.forEach((c: Checkin) => {
            if (!orderCheckinMap.has(c.order_id)) orderCheckinMap.set(c.order_id, [])
            orderCheckinMap.get(c.order_id)!.push(c)
          })
          orderCheckinMap.forEach((cks) => {
            // Each check-in counts toward the streak — the consumer showed up
            bestStreak = Math.max(bestStreak, cks.length)
          })
          // Overall streak: total consecutive months with at least 1 check-in
          const checkinMonths = new Set(checkins.map((c: Checkin) => c.responded_at.slice(0, 7)))
          const sortedMonths = [...checkinMonths].sort()
          let currentStreak = 0
          let maxConsecutiveMonths = 0
          for (let i = 0; i < sortedMonths.length; i++) {
            if (i === 0) { currentStreak = 1 }
            else {
              const [prevY, prevM] = sortedMonths[i - 1].split('-').map(Number)
              const [curY, curM] = sortedMonths[i].split('-').map(Number)
              const diff = (curY - prevY) * 12 + (curM - prevM)
              currentStreak = diff === 1 ? currentStreak + 1 : 1
            }
            maxConsecutiveMonths = Math.max(maxConsecutiveMonths, currentStreak)
          }

          // Savings concierge message (generational tone)
          const savingsMsg = isGenZ
            ? `you've saved ${cents(totalSaved)} by being real about your shelf`
            : `Your concierge has optimized ${cents(totalSaved)} in delivery savings`

          const milestones: { icon: string; title: string; detail: string; achieved: boolean; color: string }[] = [
            {
              icon: '🎉',
              title: monthsTogether >= 1 ? `${monthsTogether} month${monthsTogether > 1 ? 's' : ''} together` : 'First check-in',
              detail: monthsTogether >= 1
                ? (isGenZ ? `we've been vibing for ${monthsTogether} month${monthsTogether > 1 ? 's' : ''} now` : `${monthsTogether} month${monthsTogether > 1 ? 's' : ''} of adaptive delivery — your data is making predictions smarter`)
                : (isGenZ ? 'you just told a brand how you actually use their product — first!' : 'your first consumption data point is in the system'),
              achieved: checkins.length > 0,
              color: 'peel-blue',
            },
            {
              icon: '💰',
              title: `${cents(totalSaved)} saved`,
              detail: isGenZ
                ? `that's like ${Math.floor(totalSaved / 700)} oat milk lattes you didn't waste`
                : savingsMsg,
              achieved: totalSaved > 0,
              color: 'peel-green',
            },
            {
              icon: '📦',
              title: `${skippedDeliveries} deliveries skipped`,
              detail: isGenZ
                ? `${skippedDeliveries} boxes that didn't end up on your shelf of shame`
                : `${skippedDeliveries} unnecessary shipments prevented — zero waste, zero guilt`,
              achieved: skippedDeliveries > 0,
              color: 'peel-amber',
            },
            {
              icon: '⏱',
              title: `${delayedDeliveries} deliveries delayed`,
              detail: isGenZ
                ? 'your rhythm, not theirs'
                : `${delayedDeliveries} deliveries rescheduled to match your actual consumption pace`,
              achieved: delayedDeliveries > 0,
              color: 'peel-amber',
            },
            {
              icon: '🎯',
              title: `${checkins.length} check-ins completed`,
              detail: isGenZ
                ? `${checkins.length} honest answers that made your subscriptions actually smart`
                : `${checkins.length} data points feeding the adaptive engine — predictions improve every cycle`,
              achieved: checkins.length > 0,
              color: 'peel-blue',
            },
            {
              icon: '🔄',
              title: `${rhythms.length} rhythms discovered`,
              detail: rhythms.length > 0
                ? rhythms.map(r => `${r.name}: ${r.rhythm}d (was ${r.original}d)`).join(' · ')
                : 'Complete more check-ins to discover your real consumption rhythm',
              achieved: rhythms.length > 0,
              color: 'peel-blue',
            },
          ]

          return (
            <div>
              <h2 className="text-lg font-heading font-semibold text-peel-navy mb-1">Your Milestones</h2>
              <p className="text-xs text-peel-gray-400 mb-6">
                {isGenZ
                  ? 'Every check-in makes your subscriptions smarter. Here\'s what you\'ve unlocked.'
                  : 'Data-driven moments from your adaptive delivery history.'}
              </p>

              {/* Hero savings concierge + streak */}
              <div className="bg-gradient-to-r from-peel-navy to-peel-dark rounded-xl p-6 mb-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                      {isGenZ ? 'Your check-in streak' : 'Savings Concierge Report'}
                    </div>
                    <div className="text-2xl font-heading font-bold">{cents(totalSaved)} saved</div>
                    <div className="text-sm text-white/70 mt-1">
                      {isGenZ
                        ? `${monthsTogether} months together · ${checkins.length} check-ins · ${skippedDeliveries + delayedDeliveries} deliveries adapted`
                        : `${monthsTogether} months · ${checkins.length} data points · ${rhythms.length} rhythms calibrated`
                      }
                    </div>
                  </div>

                  {/* Streak badge */}
                  {checkins.length > 0 && (
                    <div className="flex flex-col items-center ml-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-[3px] border-orange-400 flex items-center justify-center bg-white/10">
                          <div className="text-center">
                            <div className="text-xl font-heading font-bold text-orange-400">{maxConsecutiveMonths}</div>
                          </div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center text-[10px]">🔥</div>
                      </div>
                      <div className="text-[10px] text-white/50 mt-1.5 text-center">
                        {isGenZ
                          ? `${maxConsecutiveMonths}mo streak`
                          : `${maxConsecutiveMonths}mo consecutive`
                        }
                      </div>
                    </div>
                  )}
                </div>

                {/* Streak visualization — monthly dots */}
                {checkins.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-white/50">
                        {isGenZ ? 'Check-in streak' : 'Monthly engagement'}
                      </div>
                      <div className="text-xs text-white/40">
                        {bestStreak} best streak on single product
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {sortedMonths.map((month) => {
                        const monthCheckins = checkins.filter((c: Checkin) => c.responded_at.startsWith(month))
                        const count = monthCheckins.length
                        return (
                          <div key={month} className="flex flex-col items-center gap-1">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                count >= 3 ? 'bg-orange-400 text-white' :
                                count >= 1 ? 'bg-orange-400/40 text-white' :
                                'bg-white/10 text-white/30'
                              }`}
                              title={`${month}: ${count} check-in${count !== 1 ? 's' : ''}`}
                            >
                              {count > 0 ? count : '·'}
                            </div>
                            <span className="text-[9px] text-white/30">{month.slice(5)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Personal rhythms */}
                {rhythms.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs text-white/50 mb-2">Your personal rhythms</div>
                    <div className="flex flex-wrap gap-2">
                      {rhythms.map(r => (
                        <div key={r.name} className="bg-white/10 rounded-lg px-3 py-1.5 text-xs">
                          <span className="text-white/70">{r.name}:</span>{' '}
                          <span className="text-white font-medium">{r.rhythm} days</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Milestone cards */}
              <div className="grid grid-cols-2 gap-4">
                {milestones.map((ms, i) => (
                  <div
                    key={i}
                    className={`bg-white rounded-xl border p-5 transition-opacity ${
                      ms.achieved ? 'border-peel-gray-200' : 'border-dashed border-peel-gray-300 opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{ms.icon}</div>
                      <div>
                        <div className="font-medium text-peel-navy text-sm">{ms.title}</div>
                        <div className="text-xs text-peel-gray-400 mt-1 leading-relaxed">{ms.detail}</div>
                        {ms.achieved && (
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-peel-green-light text-peel-green">
                              <span className="w-1 h-1 rounded-full bg-peel-green" />
                              Achieved
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shareable summary (Millennial magic moment) */}
              {!isGenZ && totalSaved > 0 && (
                <div className="mt-6 bg-white rounded-xl border border-peel-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Shareable Summary</div>
                    <button
                      className="text-xs text-peel-blue font-medium hover:underline"
                      onClick={() => {
                        const text = `📊 My subscription optimization report:\n💰 Saved: ${cents(totalSaved)}\n📦 Deliveries skipped: ${skippedDeliveries}\n⏱ Avg rhythm: ${rhythms.length > 0 ? rhythms.map(r => `${r.name} ${r.rhythm}d`).join(', ') : '—'}\n🎯 Check-ins: ${checkins.length}\n— Powered by Relay`
                        navigator.clipboard.writeText(text)
                      }}
                    >
                      Copy to clipboard
                    </button>
                  </div>
                  <div className="bg-peel-gray-50 rounded-lg p-4 text-sm text-peel-gray-600 leading-relaxed font-mono">
                    📊 My subscription optimization report:<br />
                    💰 Saved: {cents(totalSaved)}<br />
                    📦 Deliveries skipped: {skippedDeliveries}<br />
                    ⏱ Avg rhythm: {rhythms.length > 0 ? rhythms.map(r => `${r.name} ${r.rhythm}d`).join(', ') : '—'}<br />
                    🎯 Check-ins: {checkins.length}<br />
                    — Powered by Relay
                  </div>
                  <p className="text-xs text-peel-gray-400 mt-2">
                    Share this with your partner or household — show the value of adaptive delivery.
                  </p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Check-in History Tab */}
        {activeTab === 'checkins' && (
          <div>
            <h2 className="text-lg font-heading font-semibold text-peel-navy mb-4">Check-in History</h2>
            <div className="bg-white rounded-xl border border-peel-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-peel-gray-100 bg-peel-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Product</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Inventory</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-peel-gray-400 uppercase tracking-wider">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {[...checkins].sort((a, b) => b.responded_at.localeCompare(a.responded_at)).map((c: Checkin) => {
                    const order = orders.find((o: Order) => o.id === c.order_id)
                    const delivery = deliveries.find((d: DeliverySchedule) => d.adjusted_by_checkin_id === c.id)
                    return (
                      <tr key={c.id} className="border-b border-peel-gray-50 last:border-0">
                        <td className="px-5 py-3 text-peel-gray-600">
                          {new Date(c.responded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 font-medium text-peel-navy">{order?.product_name || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${bucketColor(c.inventory_level)}`}>
                            {bucketLabel(c.inventory_level)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {delivery ? (
                            <span className={`text-sm font-medium ${actionColor(delivery.action)}`}>
                              {actionLabel(delivery.action)}
                              {delivery.days_adjusted > 0 && ` (+${delivery.days_adjusted}d)`}
                              {delivery.savings_cents > 0 && ` · saved ${cents(delivery.savings_cents)}`}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {checkins.length === 0 && (
                <div className="text-center py-12 text-peel-gray-400 text-sm">
                  No check-ins yet. Start by checking in on one of your subscriptions.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Savings Tab */}
        {activeTab === 'savings' && (
          <div>
            <h2 className="text-lg font-heading font-semibold text-peel-navy mb-4">Savings Summary</h2>

            <div className="bg-white rounded-xl border border-peel-gray-200 p-6 mb-6">
              <div className="text-center">
                <div className="text-xs text-peel-gray-400 uppercase tracking-wider mb-1">Your concierge has saved you</div>
                <div className="text-4xl font-heading font-bold text-peel-green">{cents(totalSaved)}</div>
                <div className="text-sm text-peel-gray-400 mt-1">by syncing deliveries to your rhythm</div>
              </div>
            </div>

            {/* Delivery timeline */}
            <h3 className="text-sm font-medium text-peel-gray-500 mb-3 uppercase tracking-wider">Delivery Timeline</h3>
            <div className="space-y-2">
              {[...deliveries]
                .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
                .map((d: DeliverySchedule, i: number) => {
                  const order = orders.find((o: Order) => o.id === d.order_id)
                  return (
                    <div key={i} className="bg-white rounded-lg border border-peel-gray-200 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${d.action === 'skip' ? 'bg-peel-green' : d.action === 'delay' ? 'bg-peel-amber' : 'bg-peel-blue'}`} />
                        <div>
                          <div className="text-sm font-medium text-peel-navy">{order?.product_name}</div>
                          <div className="text-xs text-peel-gray-400">
                            {new Date(d.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {d.actual_date && d.actual_date !== d.scheduled_date &&
                              ` → ${new Date(d.actual_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${actionColor(d.action)}`}>
                          {actionLabel(d.action)}
                        </span>
                        {d.savings_cents > 0 && (
                          <div className="text-xs text-peel-green">+{cents(d.savings_cents)}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

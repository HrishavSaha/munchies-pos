'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchDashboardData, fetchEvents, type DashboardData, type EventOption } from '@/lib/dashboard'
import MetricCard    from '@/components/dashboard/MetricCard'
import ItemSalesBar  from '@/components/dashboard/ItemSalesBar'
import HourlyChart   from '@/components/dashboard/HourlyChart'
import PaymentSplit  from '@/components/dashboard/PaymentSplit'
import EODReport     from '@/components/dashboard/EODReport'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [events,  setEvents]  = useState<EventOption[]>([])
  const [filter,  setFilter]  = useState<string>('today')
  const [loading, setLoading] = useState(true)
  const [showEOD, setShowEOD] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const d = await fetchDashboardData(filter)
    setData(d)
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchEvents().then(setEvents)
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [load])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>Munchies & Co.</span>
          <span className={styles.screen}>Dashboard</span>
        </div>
        <div className={styles.headerRight}>
          <select
            className={styles.eventSelect}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="today">Today</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.name} · {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </option>
            ))}
          </select>
          <button className={styles.refreshBtn} onClick={load} disabled={loading}>
            {loading ? '…' : '↻'}
          </button>
          <button className={styles.eodBtn} onClick={() => setShowEOD(true)}>
            End-of-day report
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {loading && !data && (
          <div className={styles.center}><div className={styles.spinner} /></div>
        )}

        {data && (
          <>
            {/* ── Metrics row ── */}
            <div className={styles.metricsGrid}>
              <MetricCard
                label="Revenue"
                value={`₹${data.revenue.toLocaleString('en-IN')}`}
                sub={`${data.orderCount} orders`}
              />
              <MetricCard
                label="Avg order value"
                value={`₹${data.avgOrderValue}`}
                sub="per transaction"
              />
              <MetricCard
                label="Combo attach"
                value={`${data.comboAttachRate}%`}
                sub="of orders have a combo"
                accent="green"
              />
              <MetricCard
                label="Est. waste cost"
                value={`₹${data.estWasteCost}`}
                sub="unsold stocked items"
                accent={data.estWasteCost > 500 ? 'red' : undefined}
              />
              {data.avgServeTime !== null && (
                <MetricCard
                  label="Avg serve time"
                  value={`${data.avgServeTime}m`}
                  sub="order to fulfillment"
                  accent={data.avgServeTime > 5 ? 'red' : 'green'}
                />
              )}
              <MetricCard
                label="Top item"
                value={data.topItem ?? '—'}
                sub={data.worstItem ? `Slowest: ${data.worstItem}` : ''}
              />
            </div>

            {/* ── Charts row ── */}
            <div className={styles.chartsGrid}>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Sales by item</div>
                <ItemSalesBar items={data.itemSales} />
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Revenue by hour</div>
                <HourlyChart data={data.hourlySales} />
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Payment split</div>
                <PaymentSplit split={data.paymentSplit} />
              </div>
            </div>
          </>
        )}

        {data && data.orderCount === 0 && !loading && (
          <div className={styles.empty}>
            No orders yet for this period.
          </div>
        )}
      </main>

      {showEOD && data && (
        <EODReport
          data={data}
          filter={filter}
          events={events}
          onClose={() => setShowEOD(false)}
        />
      )}
    </div>
  )
}
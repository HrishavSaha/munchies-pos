'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import KOTCard from '@/components/kitchen/KOTCard'
import styles from './kitchen.module.css'

export interface KOTOrder {
  id: string
  token_number: number
  created_at: string
  order_items: {
    id: string
    item_name: string
    quantity: number
    menu_item_id: string
  }[]
}

export default function KitchenPage() {
  const [orders,  setOrders]  = useState<KOTOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [time,    setTime]    = useState('')

  // Clock
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  // Load open orders (last 2 hours, not yet marked done)
  const loadOrders = async () => {
    const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('orders')
      .select('id, token_number, created_at, order_items(id, item_name, quantity, menu_item_id)')
      .gte('created_at', since)
      .is('fulfilled_at', null)
      .order('created_at', { ascending: true })

    if (!error) setOrders((data as KOTOrder[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()

    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => loadOrders()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => loadOrders()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const markDone = async (orderId: string) => {
    await supabase
      .from('orders')
      .update({ fulfilled_at: new Date().toISOString() })
      .eq('id', orderId)
    // optimistic remove
    setOrders(prev => prev.filter(o => o.id !== orderId))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>Munchies & Co.</span>
          <span className={styles.screen}>Kitchen</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.count}>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </span>
          <span className={styles.time}>{time}</span>
        </div>
      </header>

      <main className={styles.main}>
        {loading && (
          <div className={styles.center}>
            <div className={styles.spinner} />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className={styles.idle}>
            <div className={styles.idleIcon}>☕</div>
            <div className={styles.idleText}>All clear — no open orders</div>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className={styles.grid}>
            {orders.map(order => (
              <KOTCard
                key={order.id}
                order={order}
                onDone={() => markDone(order.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
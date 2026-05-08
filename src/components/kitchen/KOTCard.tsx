'use client'

import { useEffect, useState } from 'react'
import type { KOTOrder } from '@/app/kitchen/page'
import styles from './KOTCard.module.css'

interface Props {
  order: KOTOrder
  onDone: () => void
}

function useElapsed(createdAt: string) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const calc = () => {
      setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000))
    }
    calc()
    const id = setInterval(calc, 10_000)
    return () => clearInterval(id)
  }, [createdAt])

  return elapsed
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export default function KOTCard({ order, onDone }: Props) {
  const elapsed  = useElapsed(order.created_at)
  const minutes  = Math.floor(elapsed / 60)
  const isUrgent = minutes >= 8
  const isWarn   = minutes >= 5 && !isUrgent

  const orderTime = new Date(order.created_at).toLocaleTimeString('en-IN', {
    hour:   '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`${styles.card} ${isUrgent ? styles.urgent : isWarn ? styles.warn : ''}`}>
      {/* ── Card header ── */}
      <div className={styles.header}>
        <div className={styles.token}>
          #{String(order.token_number).padStart(3, '0')}
        </div>
        <div className={styles.headerRight}>
          <span className={`${styles.timer} ${isUrgent ? styles.timerUrgent : isWarn ? styles.timerWarn : ''}`}>
            {formatElapsed(elapsed)}
          </span>
          <span className={styles.time}>{orderTime}</span>
        </div>
      </div>

      {/* ── Items ── */}
      <div className={styles.items}>
        {order.order_items.map(item => (
          <div key={item.id} className={styles.item}>
            <span className={styles.itemName}>{item.item_name}</span>
            <span className={styles.itemQty}>×{item.quantity}</span>
          </div>
        ))}
      </div>

      {/* ── Done button ── */}
      <button className={styles.doneBtn} onClick={onDone}>
        Mark done
      </button>
    </div>
  )
}
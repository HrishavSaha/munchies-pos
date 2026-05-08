'use client'

import { useEffect } from 'react'
import { useMenuStore } from '@/store/menuStore'
import { startSyncListener } from '@/lib/sync'
import MenuGrid from '@/components/pos/MenuGrid'
import Cart from '@/components/pos/Cart'
import styles from './pos.module.css'

export default function POSPage() {
  const { fetch, subscribeRealtime } = useMenuStore()

  useEffect(() => {
    fetch()
    const unsub = subscribeRealtime()
    startSyncListener()
    return unsub
  }, [fetch, subscribeRealtime])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>Munchies & Co.</div>
        <div className={styles.screen}>Billing</div>
      </header>
      <div className={styles.layout}>
        <MenuGrid />
        <Cart />
      </div>
    </div>
  )
}
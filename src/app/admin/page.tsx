'use client'

import { useState } from 'react'
import MenuManager  from '@/components/admin/MenuManager'
import ComboManager from '@/components/admin/ComboManager'
import StockManager from '@/components/admin/StockManager'
import styles from './admin.module.css'

type Tab = 'menu' | 'combos' | 'stock'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('menu')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Munchies & Co.</h1>
          <span className={styles.subtitle}>Admin panel</span>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'menu' ? styles.tabActive : ''}`}
            onClick={() => setTab('menu')}
          >
            Menu items
          </button>
          <button
            className={`${styles.tab} ${tab === 'combos' ? styles.tabActive : ''}`}
            onClick={() => setTab('combos')}
          >
            Combos & offers
          </button>
          <button
            className={`${styles.tab} ${tab === 'stock' ? styles.tabActive : ''}`}
            onClick={() => setTab('stock')}
          >
            Stock & events
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {tab === 'menu'   && <MenuManager />}
        {tab === 'combos' && <ComboManager />}
        {tab === 'stock'  && <StockManager />}
      </main>
    </div>
  )
}
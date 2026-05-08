'use client'

import { useMenuStore } from '@/store/menuStore'
import { useCartStore } from '@/store/cartStore'
import { detectCombo } from '@/lib/combos'
import type { MenuItem } from '@/types'
import styles from './MenuGrid.module.css'

const CATEGORY_ORDER = ['slider', 'fries', 'dessert', 'drink']
const CATEGORY_LABELS: Record<string, string> = {
  slider:  'Sliders',
  fries:   'Fries',
  dessert: 'Desserts',
  drink:   'Drinks',
}

export default function MenuGrid() {
  const { items, combos, loading } = useMenuStore()
  const { items: cartItems, addItem, setCombo } = useCartStore()

  const handleAdd = (item: MenuItem) => {
    addItem(item)
    // re-detect combo after add
    const updatedCart = cartItems.find(i => i.menu_item.id === item.id)
      ? cartItems.map(i =>
          i.menu_item.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      : [...cartItems, { menu_item: item, quantity: 1 }]
    setCombo(detectCombo(updatedCart, combos))
  }

  const grouped = CATEGORY_ORDER.reduce<Record<string, MenuItem[]>>((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat && i.is_available)
    return acc
  }, {})

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      {CATEGORY_ORDER.map(cat => {
        const catItems = grouped[cat]
        if (!catItems?.length) return null
        return (
          <div key={cat} className={styles.group}>
            <div className={styles.groupLabel}>{CATEGORY_LABELS[cat]}</div>
            <div className={styles.grid}>
              {catItems.map(item => {
                const inCart = cartItems.find(i => i.menu_item.id === item.id)
                return (
                  <button
                    key={item.id}
                    className={`${styles.item} ${inCart ? styles.itemActive : ''}`}
                    onClick={() => handleAdd(item)}
                  >
                    <span className={styles.itemEmoji}>{item.emoji}</span>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemPrice}>₹{item.price}</span>
                    {inCart && (
                      <span className={styles.itemQtyBadge}>{inCart.quantity}</span>
                    )}
                    <span className={`${styles.vegIndicator} ${item.is_veg ? styles.veg : styles.non}`} />
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
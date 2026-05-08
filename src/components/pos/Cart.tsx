'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useMenuStore } from '@/store/menuStore'
import { detectCombo } from '@/lib/combos'
import { buildReceiptText } from '@/lib/whatsapp'
import { placeOrder } from '@/lib/orders'
import WhatsAppModal from './WhatsAppModal'
import styles from './Cart.module.css'

type PaymentMethod = 'upi' | 'cash' | 'card'

export default function Cart() {
  const { items, appliedCombo, tokenNumber, updateQty, setCombo, clearCart, subtotal, total } = useCartStore()
  const { combos } = useMenuStore()
  const [placing, setPlacing]     = useState(false)
  const [showWA,  setShowWA]      = useState(false)
  const [receipt, setReceipt]     = useState('')
  const [payment, setPayment]     = useState<PaymentMethod>('upi')

  const discount = appliedCombo?.discount_amount ?? 0

  const handleQty = (id: string, delta: number) => {
    updateQty(id, delta)
    // re-detect combo after qty change
    const updated = items
      .map(i => i.menu_item.id === id ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    setCombo(detectCombo(updated, combos))
  }

  const handleCharge = async (method: PaymentMethod) => {
    if (items.length === 0) return
    setPayment(method)
    setPlacing(true)

    const sub  = subtotal()
    const tot  = total()

    await placeOrder({
      event_id:       null,
      token_number:   tokenNumber,
      payment_method: method,
      subtotal:       sub,
      discount,
      total:          tot,
      items,
    })

    const text = buildReceiptText(
      tokenNumber, items, sub, discount, tot, method, appliedCombo
    )
    setReceipt(text)
    setPlacing(false)
    setShowWA(true)
  }

  const handleWAClose = () => {
    setShowWA(false)
    clearCart()
  }

  const isEmpty = items.length === 0

  return (
    <>
      <div className={styles.cart}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>Order</span>
          <span className={styles.token}>#{String(tokenNumber).padStart(3, '0')}</span>
        </div>

        {/* ── Items ── */}
        <div className={styles.items}>
          {isEmpty ? (
            <div className={styles.empty}>Tap items to add</div>
          ) : (
            items.map(({ menu_item, quantity }) => (
              <div key={menu_item.id} className={styles.row}>
                <span className={styles.rowEmoji}>{menu_item.emoji}</span>
                <span className={styles.rowName}>{menu_item.name}</span>
                <div className={styles.qtyCtrl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => handleQty(menu_item.id, -1)}
                  >−</button>
                  <span className={styles.qtyNum}>{quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => handleQty(menu_item.id, 1)}
                  >+</button>
                </div>
                <span className={styles.rowPrice}>₹{menu_item.price * quantity}</span>
              </div>
            ))
          )}
        </div>

        {/* ── Combo banner ── */}
        {appliedCombo && (
          <div className={styles.comboBanner}>
            {appliedCombo.name} · save ₹{appliedCombo.discount_amount}
          </div>
        )}

        {/* ── Totals ── */}
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Subtotal</span>
            <span className={styles.totalValue}>₹{subtotal()}</span>
          </div>
          {discount > 0 && (
            <div className={`${styles.totalRow} ${styles.discountRow}`}>
              <span>Combo discount</span>
              <span>−₹{discount}</span>
            </div>
          )}
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <span>Total</span>
            <span>₹{total()}</span>
          </div>
        </div>

        {/* ── Payment buttons ── */}
        <div className={styles.paymentSection}>
          <div className={styles.paymentGrid}>
            <button
              className={`${styles.payBtn} ${styles.payBtnSecondary}`}
              onClick={() => handleCharge('cash')}
              disabled={isEmpty || placing}
            >
              Cash
            </button>
            <button
              className={`${styles.payBtn} ${styles.payBtnSecondary}`}
              onClick={() => handleCharge('card')}
              disabled={isEmpty || placing}
            >
              Card
            </button>
          </div>
          <button
            className={`${styles.payBtn} ${styles.payBtnPrimary}`}
            onClick={() => handleCharge('upi')}
            disabled={isEmpty || placing}
          >
            {placing ? 'Processing…' : `Charge ₹${total()} · UPI`}
          </button>
        </div>
      </div>

      {showWA && (
        <WhatsAppModal
          receiptText={receipt}
          onClose={handleWAClose}
        />
      )}
    </>
  )
}
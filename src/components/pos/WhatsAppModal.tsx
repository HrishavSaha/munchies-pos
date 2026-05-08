'use client'

import { useState } from 'react'
import { openWhatsApp } from '@/lib/whatsapp'
import styles from './WhatsAppModal.module.css'

interface Props {
  receiptText: string
  onClose: () => void
}

export default function WhatsAppModal({ receiptText, onClose }: Props) {
  const [phone, setPhone] = useState('')

  const handleSend = () => {
    if (phone.length === 10) {
      openWhatsApp(phone, receiptText)
    }
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Send receipt</span>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <div className={styles.receipt}>{receiptText}</div>

        <div className={styles.inputRow}>
          <span className={styles.prefix}>+91</span>
          <input
            className={styles.input}
            type="tel"
            maxLength={10}
            placeholder="Customer's number"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.skipBtn} onClick={onClose}>
            Skip
          </button>
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={phone.length !== 10}
          >
            Send on WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
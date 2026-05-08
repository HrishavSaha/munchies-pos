import styles from './PaymentSplit.module.css'

interface Props {
  split: { upi: number; cash: number; card: number }
}

const METHODS = [
  { key: 'upi',  label: 'UPI' },
  { key: 'cash', label: 'Cash' },
  { key: 'card', label: 'Card' },
] as const

export default function PaymentSplit({ split }: Props) {
  const total = split.upi + split.cash + split.card
  if (total === 0) return <div className={styles.empty}>No data</div>

  return (
    <div className={styles.wrap}>
      {/* Stacked bar */}
      <div className={styles.bar}>
        {METHODS.map(m => (
          split[m.key] > 0 && (
            <div
              key={m.key}
              className={`${styles.segment} ${styles[m.key]}`}
              style={{ width: `${split[m.key]}%` }}
              title={`${m.label}: ${split[m.key]}%`}
            />
          )
        ))}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {METHODS.map(m => (
          <div key={m.key} className={styles.legendRow}>
            <span className={`${styles.dot} ${styles[m.key]}`} />
            <span className={styles.legendLabel}>{m.label}</span>
            <span className={styles.legendPct}>{split[m.key]}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
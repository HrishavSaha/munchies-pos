import styles from './ItemSalesBar.module.css'

interface ItemStat {
  name:    string
  qty:     number
  revenue: number
}

export default function ItemSalesBar({ items }: { items: ItemStat[] }) {
  if (!items.length) return <div className={styles.empty}>No data</div>

  const max = Math.max(...items.map(i => i.qty))

  return (
    <div className={styles.list}>
      {items.map(item => (
        <div key={item.name} className={styles.row}>
          <div className={styles.meta}>
            <span className={styles.name}>{item.name}</span>
            <span className={styles.stats}>{item.qty} sold · ₹{item.revenue.toLocaleString('en-IN')}</span>
          </div>
          <div className={styles.track}>
            <div
              className={styles.fill}
              style={{ width: `${(item.qty / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
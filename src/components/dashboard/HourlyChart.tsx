import styles from './HourlyChart.module.css'

interface HourStat {
  hour:    number
  revenue: number
}

function fmt12(h: number) {
  if (h === 0)  return '12a'
  if (h < 12)   return `${h}a`
  if (h === 12) return '12p'
  return `${h - 12}p`
}

export default function HourlyChart({ data }: { data: HourStat[] }) {
  if (!data.length) return <div className={styles.empty}>No data</div>

  const max = Math.max(...data.map(d => d.revenue))

  return (
    <div className={styles.chart}>
      {data.map(d => (
        <div key={d.hour} className={styles.col}>
          <div className={styles.barWrap}>
            <div
              className={styles.bar}
              style={{ height: `${(d.revenue / max) * 100}%` }}
              title={`₹${d.revenue}`}
            />
          </div>
          <span className={styles.label}>{fmt12(d.hour)}</span>
        </div>
      ))}
    </div>
  )
}
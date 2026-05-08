import styles from './MetricCard.module.css'

interface Props {
  label:  string
  value:  string
  sub?:   string
  accent?: 'green' | 'red'
}

export default function MetricCard({ label, value, sub, accent }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={`${styles.value} ${accent ? styles[accent] : ''}`}>
        {value}
      </div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  )
}
import styles from './ui.module.css'

/* ── SECTION HEADER ── */
interface SectionHeaderProps {
  title: string
  action?: React.ReactNode
}
export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {action}
    </div>
  )
}

/* ── BUTTON ── */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}
export function Btn({
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  ...rest
}: BtnProps) {
  return (
    <button
      className={[
        styles.btn,
        styles[`btn-${variant}`],
        styles[`btn-${size}`],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ── TOGGLE ── */
interface ToggleProps {
  checked: boolean
  onChange: (val: boolean) => void
  disabled?: boolean
}
export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}

/* ── FIELD ── */
interface FieldProps {
  label: string
  error?: string
  children: React.ReactNode
}
export function Field({ label, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  )
}

/* ── INPUT ── */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={styles.input} {...props} />
}

/* ── SELECT ── */
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={styles.select} {...props} />
}

/* ── MODAL ── */
interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}
export function Modal({ title, onClose, children, footer }: ModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  )
}

/* ── EMPTY STATE ── */
export function Empty({ message }: { message: string }) {
  return <div className={styles.empty}>{message}</div>
}

/* ── SPINNER ── */
export function Spinner() {
  return <div className={styles.spinner} />
}

/* ── TOAST ── */
export function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`${styles.toast} ${styles[`toast-${type}`]}`}>
      {message}
    </div>
  )
}
import Link from 'next/link'

export default function RootPage() {
  return (
    <main style={{
      fontFamily: 'DM Sans, sans-serif',
      minHeight: '100vh',
      background: '#FAF7F2',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
    }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 500, color: '#1C1209', letterSpacing: '0.01em', textAlign: 'center' }}>
          Munchies & Co.
        </div>
        <div style={{ fontSize: 12, color: '#A08060', textAlign: 'center', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          POS System
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 240 }}>
        {[
          { href: '/pos',       label: 'Billing',    sub: 'Counter screen',  dot: '#B07240' },
          { href: '/kitchen',   label: 'Kitchen',    sub: 'Cook screen',     dot: '#8F3D1A' },
          { href: '/dashboard', label: 'Dashboard',  sub: 'Analytics',       dot: '#4A6E1A' },
          { href: '/admin',     label: 'Admin',      sub: 'Menu & stock',    dot: '#4A6E9A' },
        ].map(({ href, label, sub, dot }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '13px 16px',
              background: '#fff',
              border: '1px solid #E8DDD0',
              borderRadius: 10,
              textDecoration: 'none',
              color: '#1C1209',
              fontSize: 14,
              fontWeight: 500,
              transition: 'border-color 0.15s',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{label}</span>
            <span style={{ fontSize: 12, color: '#A08060', fontWeight: 400 }}>{sub}</span>
          </Link>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#C0A882', letterSpacing: '0.04em' }}>
        follow the munch
      </div>
    </main>
  )
}
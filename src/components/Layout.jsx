import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const active = path => pathname === path

  return (
    <div style={s.root}>
      <header style={s.header}>
        <button style={s.menuBtn} onClick={() => nav('/profile')}>☰</button>
        <div style={s.logo} onClick={() => nav('/members')}>
          <span style={s.yo}>Yo</span><span style={s.br}>Breeders</span>
        </div>
        <button style={s.avatarBtn} onClick={() => nav('/profile')}>
          <div style={s.avatar}>👤</div>
        </button>
      </header>

      <main style={s.main}>{children}</main>

      <nav style={s.nav}>
        <NavBtn icon="📍" label="Map"      path="/map"      active={active('/map')}      onClick={() => nav('/map')} />
        <NavBtn icon="🔑" label="Login"    path="/login"    active={false}               onClick={() => nav('/profile')} />
        <NavBtn icon="👥" label="Members"  path="/members"  active={active('/members')}  onClick={() => nav('/members')} center />
        <NavBtn icon="👁"  label="Views"   path="/views"    active={active('/views')}    onClick={() => nav('/views')} />
        <NavBtn icon="💬" label="Messages" path="/messages" active={active('/messages')} onClick={() => nav('/messages')} />
      </nav>
    </div>
  )
}

function NavBtn({ icon, label, active, onClick, center }) {
  return (
    <button onClick={onClick} style={{ ...s.navBtn, ...(active ? s.navBtnActive : {}), ...(center ? s.navCenter : {}) }}>
      <span style={center ? s.centerIcon : s.navIcon}>{icon}</span>
      {!center && <span style={s.navLabel}>{label}</span>}
    </button>
  )
}

const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 480, margin: '0 auto', background: 'var(--bg)' },
  header: { background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  menuBtn: { fontSize: 22, color: '#fff', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logo: { cursor: 'pointer' },
  yo: { fontSize: 22, fontWeight: 900, color: '#fff' },
  br: { fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.75)' },
  avatarBtn: { width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatar: { fontSize: 20 },
  main: { flex: 1, overflowY: 'auto', overflowX: 'hidden' },
  nav: { background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 0 12px', flexShrink: 0 },
  navBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 8px', borderRadius: 10, transition: 'opacity 0.15s', opacity: 0.55 },
  navBtnActive: { opacity: 1 },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, color: 'var(--text-dim)', fontWeight: 500 },
  navCenter: { width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -20, boxShadow: '0 4px 20px rgba(124,58,237,0.5)', opacity: 1 },
  centerIcon: { fontSize: 26 },
}

import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingScreen() {
  const nav = useNavigate()
  return (
    <div style={s.root}>
      {/* Background blobs */}
      <div style={s.blob1} />
      <div style={s.blob2} />

      <div style={s.content}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>🐂</div>
          <div style={s.logoText}>
            <span style={s.yo}>Yo</span><span style={s.breeders}>Breeders</span>
          </div>
          <div style={s.tagline}>Raw. Real. Right now.</div>
        </div>

        {/* Stats strip */}
        <div style={s.stats}>
          <Stat num="2.4K" label="Online now" />
          <div style={s.statDiv} />
          <Stat num="180+" label="Cities" />
          <div style={s.statDiv} />
          <Stat num="Free" label="To chat" />
        </div>

        {/* Feature cards */}
        <div style={s.cards}>
          <FeatureCard icon="👥" title="Member Grid" desc="Browse by photo, role & distance" accent="#7C3AED" />
          <FeatureCard icon="🗺️" title="Live Map" desc="See who's near you right now" accent="#3B82F6" />
          <FeatureCard icon="✕10" title="Multiplier" desc="Message 10 guys in one tap" accent="#A78BFA" premium />
        </div>

        {/* CTA */}
        <button style={s.cta} onClick={() => nav('/register')}>
          Join Free — Find Guys Near You
        </button>
        <div style={s.loginRow}>
          Already a member?{' '}
          <span style={s.loginLink} onClick={() => nav('/login')}>Sign in</span>
        </div>

        <div style={s.legal}>
          <span style={s.legalLink}>Legal notice</span>
          <span style={s.dot}>·</span>
          <span style={s.legalLink}>Terms of Service</span>
        </div>
      </div>
    </div>
  )
}

function Stat({ num, label }) {
  return (
    <div style={s.stat}>
      <div style={s.statNum}>{num}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, desc, accent, premium }) {
  return (
    <div style={{ ...s.featureCard, borderColor: `${accent}33` }}>
      <div style={{ ...s.featureIcon, color: accent }}>{icon}</div>
      <div style={s.featureTitle}>
        {title}
        {premium && <span style={s.premTag}>PRO</span>}
      </div>
      <div style={s.featureDesc}>{desc}</div>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px 16px',
  },
  blob1: {
    position: 'absolute', top: -120, left: -100,
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: -80, right: -80,
    width: 350, height: 350, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  content: {
    width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', gap: 24,
  },
  logoWrap: { textAlign: 'center', paddingTop: 20 },
  logoIcon: { fontSize: 52, marginBottom: 8 },
  logoText: { fontSize: 44, fontWeight: 900, lineHeight: 1 },
  yo: { color: '#fff' },
  breeders: { color: 'var(--primary-light)' },
  tagline: { fontSize: 14, color: 'var(--text-dim)', marginTop: 8, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 },

  stats: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', borderRadius: 18, padding: '16px 0', border: '1px solid var(--border)' },
  stat: { flex: 1, textAlign: 'center' },
  statNum: { fontSize: 22, fontWeight: 900, color: 'var(--primary-light)' },
  statLabel: { fontSize: 12, color: 'var(--text-dim)', marginTop: 2 },
  statDiv: { width: 1, height: 36, background: 'var(--border)' },

  cards: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 },
  featureCard: { background: 'var(--surface)', borderRadius: 16, padding: '14px 10px', border: '1px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' },
  featureIcon: { fontSize: 24, fontWeight: 900 },
  featureTitle: { fontSize: 12, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'center' },
  featureDesc: { fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 },
  premTag: { background: 'rgba(167,139,250,0.2)', color: 'var(--primary-light)', borderRadius: 4, fontSize: 9, fontWeight: 800, padding: '1px 4px', letterSpacing: 0.5 },

  cta: { width: '100%', padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', color: '#fff', fontSize: 16, fontWeight: 800, boxShadow: '0 8px 30px rgba(124,58,237,0.4)', border: 'none', cursor: 'pointer' },
  loginRow: { textAlign: 'center', fontSize: 14, color: 'var(--text-dim)' },
  loginLink: { color: 'var(--primary-light)', fontWeight: 600, cursor: 'pointer' },

  legal: { display: 'flex', gap: 8, justifyContent: 'center', paddingBottom: 12 },
  legalLink: { fontSize: 12, color: 'var(--text-dim)', textDecoration: 'underline', cursor: 'pointer' },
  dot: { color: 'var(--text-dim)', fontSize: 12 },
}

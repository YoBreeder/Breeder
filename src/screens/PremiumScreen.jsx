import React, { useState } from 'react'
import api from '../api'

const PLANS = [
  { key: 'week',     price: '$9.99',   period: '1 week',   label: '1 Week',   perDay: '$1.43/day' },
  { key: 'month',    price: '$19.99',  period: '1 month',  label: '1 Month',  perDay: '$0.67/day', badge: 'MOST POPULAR', badgeColor: '#EAB308' },
  { key: 'quarter',  price: '$44.99',  period: '3 months', label: '3 Months', perDay: '$0.50/day' },
  { key: 'year',     price: '$99.99',  period: '1 year',   label: '1 Year',   perDay: '$0.27/day', badge: 'BEST VALUE', badgeColor: '#22C55E' },
]

const FREE_FEATURES = [
  { icon: '🎙️', text: 'Voice commands on every screen' },
  { icon: '👥', text: 'Browse member profiles' },
  { icon: '💬', text: 'Send & receive messages' },
  { icon: '🎤', text: 'VoiceDrop — up to 30 seconds' },
  { icon: '📍', text: 'Live map — see who\'s near you' },
]

const PREMIUM_FEATURES = [
  { icon: '✦',  text: 'Cypher QI — AI matchmaker (Quantum Intelligence)', hot: true },
  { icon: '×5', text: 'Multiplier — blast 5 members at once', hot: true },
  { icon: '🎤', text: 'VoiceDrop — up to 3 minutes', hot: true },
  { icon: '👁️', text: 'See everyone who viewed your profile' },
  { icon: '🔝', text: 'Priority placement in member grid' },
  { icon: '🔍', text: 'Advanced filters — role, distance, age' },
  { icon: '✅', text: 'Premium badge on your profile' },
  { icon: '💬', text: 'Read receipts on messages' },
  { icon: '🚀', text: 'Profile boosts included' },
]

export default function PremiumScreen() {
  const [selected, setSelected] = useState('month')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('premium') // 'free' | 'premium'

  const checkout = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/premium/checkout', { plan: selected })
      window.location.href = data.url
    } catch (e) {
      alert(e.response?.data?.error || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.root}>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.crown}>👑</div>
          <div style={s.heroTitle}>Go Premium</div>
          <div style={s.heroSub}>Unlock the full yoBreeder experience</div>
        </div>
      </div>

      {/* Free vs Premium toggle */}
      <div style={s.tabRow}>
        <button style={{ ...s.tab, ...(tab === 'free' ? s.tabActive : {}) }} onClick={() => setTab('free')}>Free</button>
        <button style={{ ...s.tab, ...(tab === 'premium' ? s.tabActive : {}) }} onClick={() => setTab('premium')}>Premium ✦</button>
      </div>

      {/* Feature list */}
      <div style={s.featureList}>
        {(tab === 'free' ? FREE_FEATURES : PREMIUM_FEATURES).map(f => (
          <div key={f.text} style={{ ...s.featureRow, ...(f.hot ? s.featureHot : {}) }}>
            <div style={{ ...s.featureIcon, ...(f.hot ? s.featureIconHot : {}) }}>{f.icon}</div>
            <div style={s.featureText}>{f.text}</div>
            {f.hot && <div style={s.hotBadge}>🔥 HOT</div>}
          </div>
        ))}
        {tab === 'free' && (
          <div style={s.upgradeNudge}>
            Want more? <span style={s.upgradeLink} onClick={() => setTab('premium')}>See Premium features ✦</span>
          </div>
        )}
      </div>

      {/* Plan picker */}
      <div style={s.card}>
        <div style={s.cardTitle}>Choose your plan</div>
        <div style={s.cardSub}>One-time payment · No auto-renewal</div>

        <div style={s.plans}>
          {PLANS.map(plan => (
            <div
              key={plan.key}
              style={{ ...s.plan, ...(selected === plan.key ? s.planSelected : {}) }}
              onClick={() => setSelected(plan.key)}
            >
              <div style={{ ...s.radio, ...(selected === plan.key ? s.radioSelected : {}) }}>
                {selected === plan.key && <div style={s.radioDot} />}
              </div>
              <div style={s.planInfo}>
                <span style={s.planLabel}>{plan.label}</span>
                <span style={s.planPerDay}>{plan.perDay}</span>
              </div>
              <span style={s.planPrice}>{plan.price}</span>
              {plan.badge && (
                <span style={{ ...s.badge, background: plan.badgeColor }}>{plan.badge}</span>
              )}
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={checkout} disabled={loading} style={s.cta}>
          {loading ? 'Redirecting…' : `Get Premium · ${PLANS.find(p => p.key === selected)?.price}`}
        </button>

        <div style={s.guarantee}>🔒 Secure checkout · Cancel anytime</div>
      </div>
    </div>
  )
}

const s = {
  root: { paddingBottom: 80 },

  hero: { background: 'linear-gradient(135deg, #3b0764, #7c3aed)', padding: '32px 20px 40px' },
  heroInner: { textAlign: 'center' },
  crown: { fontSize: 40, marginBottom: 8 },
  heroTitle: { fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 0.5 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6 },

  tabRow: { display: 'flex', margin: '-18px 20px 0', background: 'var(--surface)', borderRadius: 50, padding: 4, gap: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', border: '1px solid var(--border)' },
  tab: { flex: 1, padding: '10px 0', borderRadius: 50, fontSize: 14, fontWeight: 700, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', color: '#fff', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' },

  featureList: { margin: '20px 16px 8px', display: 'flex', flexDirection: 'column', gap: 2 },
  featureRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, background: 'var(--surface)' },
  featureHot: { background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)' },
  featureIcon: { fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0, color: 'var(--text-dim)' },
  featureIconHot: { color: 'var(--primary-light)', fontWeight: 900 },
  featureText: { flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text)' },
  hotBadge: { fontSize: 10, fontWeight: 800, color: '#F59E0B', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '2px 6px', flexShrink: 0 },
  upgradeNudge: { textAlign: 'center', fontSize: 13, color: 'var(--text-dim)', padding: '12px 0 4px' },
  upgradeLink: { color: 'var(--primary-light)', fontWeight: 700, cursor: 'pointer' },

  card: { margin: '12px 16px 0', background: 'var(--surface)', borderRadius: 20, padding: '20px 16px', border: '1px solid var(--border)' },
  cardTitle: { fontWeight: 800, fontSize: 17, marginBottom: 2 },
  cardSub: { color: 'var(--text-dim)', fontSize: 12, marginBottom: 18 },

  plans: { display: 'flex', flexDirection: 'column', gap: 8 },
  plan: { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 12px', borderRadius: 14, border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' },
  planSelected: { borderColor: 'var(--primary)', background: 'rgba(124,58,237,0.08)' },
  radio: { width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 0.2s' },
  radioSelected: { borderColor: 'var(--primary)' },
  radioDot: { width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' },
  planInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  planLabel: { fontWeight: 700, fontSize: 15, color: 'var(--text)' },
  planPerDay: { fontSize: 11, color: 'var(--text-dim)' },
  planPrice: { fontWeight: 800, fontSize: 16, color: 'var(--primary-light)', flexShrink: 0 },
  badge: { fontSize: 9, fontWeight: 800, color: '#000', padding: '3px 6px', borderRadius: 6, flexShrink: 0, position: 'absolute', top: -8, right: 10 },

  cta: { width: '100%', marginTop: 20, padding: '16px', fontSize: 16, fontWeight: 800, borderRadius: 50 },
  guarantee: { textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', marginTop: 12 },
}

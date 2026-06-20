import React, { useState } from 'react'
import api from '../api'

const PLANS = [
  { key: 'week',     price: '$9.90',   period: '1 week',    boosts: 0 },
  { key: 'month',    price: '$19.90',  period: '1 month',   boosts: 0 },
  { key: 'quarter',  price: '$49.90',  period: '3 months',  boosts: 1, badge: 'MOST POPULAR',    badgeColor: '#EAB308' },
  { key: 'year',     price: '$109.90', period: '1 year',    boosts: 2 },
  { key: 'two_year', price: '$149.90', period: '2 years',   boosts: 3, badge: 'MOST ECONOMICAL', badgeColor: '#22C55E' },
]

export default function PremiumScreen() {
  const [selected, setSelected] = useState('quarter')
  const [loading, setLoading] = useState(false)

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
      <div style={s.hero}>
        <div style={s.crown}>👑</div>
        <h2 style={s.heroTitle}>Premium advantages</h2>
        <div style={s.perks}>
          {['Explore unlimited profiles', 'Filter online members', 'Unlimited ephemeral media', 'Profile boosts', 'Priority in search'].map(p => (
            <div key={p} style={s.perk}><span style={s.check}>✓</span>{p}</div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Choose your Premium offer (USD)</div>
        <div style={s.subTitle}>Single payment, no auto-renewal.</div>

        <div style={s.plans}>
          {PLANS.map(plan => (
            <div key={plan.key} style={{ ...s.plan, ...(selected === plan.key ? s.planSelected : {}) }}
              onClick={() => setSelected(plan.key)}>
              <div style={s.planCheck}>
                <div style={{ ...s.checkbox, ...(selected === plan.key ? s.checkboxSelected : {}) }}>
                  {selected === plan.key && '✓'}
                </div>
              </div>
              <div style={s.planInfo}>
                <span style={s.planPrice}>{plan.price}</span>
                <span style={s.planPeriod}> for <strong>{plan.period}</strong></span>
                {plan.boosts > 0 && <div style={s.planBoosts}>+ {plan.boosts} Boost{plan.boosts > 1 ? 's' : ''} offered 🚀</div>}
              </div>
              {plan.badge && (
                <span style={{ ...s.badge, background: plan.badgeColor }}>{plan.badge}</span>
              )}
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={checkout} disabled={loading} style={{ marginTop: 24 }}>
          {loading ? 'Redirecting…' : 'Get Premium'}
        </button>
      </div>
    </div>
  )
}

const s = {
  root: { padding: '0 0 80px' },
  hero: { background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '28px 20px', marginBottom: 16 },
  crown: { fontSize: 32, marginBottom: 8 },
  heroTitle: { fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 },
  perks: { display: 'flex', flexDirection: 'column', gap: 10 },
  perk: { display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.9)', fontSize: 15 },
  check: { color: '#fff', fontWeight: 700, fontSize: 16 },
  card: { background: 'var(--surface)', margin: '0 12px', borderRadius: 20, padding: '20px 16px', border: '1px solid var(--border)' },
  cardTitle: { fontWeight: 700, fontSize: 17, marginBottom: 4 },
  subTitle: { color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 },
  plans: { display: 'flex', flexDirection: 'column', gap: 0 },
  plan: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px', borderBottom: '1px solid var(--border)', cursor: 'pointer' },
  planSelected: { background: 'rgba(124,58,237,0.08)', borderRadius: 12, paddingLeft: 8 },
  planCheck: { flexShrink: 0 },
  checkbox: { width: 22, height: 22, borderRadius: 6, border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' },
  checkboxSelected: { background: 'var(--primary)', border: '2px solid var(--primary)' },
  planInfo: { flex: 1 },
  planPrice: { fontWeight: 700, fontSize: 17, color: 'var(--primary-light)' },
  planPeriod: { fontSize: 15, color: 'var(--text)' },
  planBoosts: { fontSize: 12, color: 'var(--text-dim)', marginTop: 2 },
  badge: { fontSize: 10, fontWeight: 800, color: '#000', padding: '3px 7px', borderRadius: 6, flexShrink: 0 },
}

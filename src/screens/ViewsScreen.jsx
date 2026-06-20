import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const API = 'http://localhost:4000'

export default function ViewsScreen() {
  const nav = useNavigate()
  const [views, setViews] = useState([])

  useEffect(() => {
    api.get('/profile/views').then(r => setViews(r.data)).catch(() => {})
  }, [])

  return (
    <div style={s.root}>
      <h2 style={s.title}>Who viewed me</h2>
      {views.length === 0 && <p style={s.empty}>No views yet. Get out there!</p>}
      <div style={s.grid}>
        {views.map(v => (
          <div key={v.id} style={s.card} onClick={() => nav(`/members/${v.id}`)}>
            {v.photos?.[0]
              ? <img src={`${API}${v.photos[0]}`} alt="" style={s.photo} />
              : <div style={s.placeholder}>👤</div>
            }
            <div style={s.info}>
              <span style={s.dot(v.is_online)} />
              <span style={s.username}>{v.username}</span>
              <span style={s.age}>{v.age}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  root: { padding: '16px 12px' },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 16 },
  empty: { color: 'var(--text-dim)', textAlign: 'center', padding: 40 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  card: { background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)' },
  photo: { width: '100%', aspectRatio: '1', objectFit: 'cover' },
  placeholder: { width: '100%', aspectRatio: '1', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: 0.3 },
  info: { padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 },
  dot: online => ({ width: 8, height: 8, borderRadius: '50%', background: online ? 'var(--online)' : 'var(--away)', flexShrink: 0 }),
  username: { fontWeight: 700, color: 'var(--primary-light)', fontSize: 14 },
  age: { color: 'var(--text-dim)', fontSize: 13 },
}

import React, { useEffect, useState } from 'react'
import api from '../api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function BlockedScreen() {
  const [blocked, setBlocked] = useState([])
  const [loading, setLoading] = useState(true)
  const [unblocking, setUnblocking] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/blocks').then(r => { setBlocked(r.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const unblock = async (id, username) => {
    setUnblocking(id)
    try {
      await api.delete(`/blocks/${id}`)
      setBlocked(b => b.filter(u => u.id !== id))
    } catch {}
    setUnblocking(null)
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <span style={s.title}>🚫 Blocked Users</span>
        <span style={s.count}>{blocked.length}</span>
      </div>

      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : blocked.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>✅</div>
          <div style={s.emptyText}>No blocked users</div>
          <div style={s.emptyHint}>Block a user from their profile page</div>
        </div>
      ) : (
        <div style={s.list}>
          {blocked.map(u => {
            const photo = u.photos?.[0] ? `${API}${u.photos[0]}` : null
            return (
              <div key={u.id} style={s.row}>
                <div style={s.avatar}>
                  {photo
                    ? <img src={photo} alt={u.username} style={s.avatarImg} />
                    : <span style={s.avatarPlaceholder}>👤</span>
                  }
                </div>
                <div style={s.info}>
                  <div style={s.username}>{u.username}</div>
                  {u.role && <div style={s.role}>{u.role}</div>}
                  {u.city && <div style={s.city}>📍 {u.city}</div>}
                </div>
                <button
                  style={{ ...s.unblockBtn, ...(unblocking === u.id ? s.unblockingBtn : {}) }}
                  onClick={() => unblock(u.id, u.username)}
                  disabled={unblocking === u.id}
                >
                  {unblocking === u.id ? '…' : 'Unblock'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' },
  header: { display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' },
  title: { fontSize: 17, fontWeight: 800, color: 'var(--text)', flex: 1 },
  count: { fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', background: 'var(--surface2)', borderRadius: 10, padding: '2px 10px' },
  list: { flex: 1, overflowY: 'auto' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  avatar: { width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: { fontSize: 22, opacity: 0.4 },
  info: { flex: 1, minWidth: 0 },
  username: { fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  role: { fontSize: 11, color: 'var(--primary-light)', fontWeight: 600, marginTop: 2 },
  city: { fontSize: 11, color: 'var(--text-dim)', marginTop: 1 },
  unblockBtn: { padding: '7px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', color: '#22C55E', fontWeight: 700, fontSize: 12, flexShrink: 0, cursor: 'pointer' },
  unblockingBtn: { opacity: 0.5 },
  empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-dim)', padding: 40 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: 700, color: 'var(--text)' },
  emptyHint: { fontSize: 13, textAlign: 'center', lineHeight: 1.5 },
}

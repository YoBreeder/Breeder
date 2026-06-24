import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function MessagesScreen() {
  const nav = useNavigate()
  const [convos, setConvos] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/messages').then(r => setConvos(r.data)).catch(() => {})
  }, [])

  const filtered = convos.filter(c => c.username?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={s.root}>
      <div style={s.pageTitle}>Inbox</div>
      <div style={s.searchRow}>
        <span style={s.searchIcon}>🔍</span>
        <input style={s.searchInput} placeholder="Search your chats" value={search} onChange={e => setSearch(e.target.value)} />
        <button style={s.filterBtn} onClick={() => nav('/profile')}>⚙️</button>
      </div>

      <div style={s.list}>
        {filtered.length === 0 && <div style={s.empty}>No conversations yet</div>}
        {filtered.map(c => (
          <div key={c.other_id} style={s.row} onClick={() => nav(`/messages/${c.other_id}`)}>
            <div style={s.avatarWrap}>
              {c.photos?.[0]
                ? <img src={`${API}${c.photos[0]}`} alt="" style={s.avatar} />
                : <div style={s.avatarPlaceholder}>👤</div>
              }
              {Number(c.unread_count) > 0 && <span style={s.badge}>{c.unread_count}</span>}
            </div>
            <div style={s.convoInfo}>
              <div style={s.nameRow}>
                <span style={s.dot(c.is_online)} />
                <span style={s.username}>{c.username}</span>
                <span style={s.age}>{c.age}</span>
              </div>
              <div style={s.preview}>
                {Number(c.unread_count) > 0
                  ? <span style={s.unreadTag}>Unread</span>
                  : <span style={s.readTag}>Read</span>
                }
                <span style={s.previewText}>{c.content}</span>
              </div>
              <div style={s.time}>{timeAgo(c.created_at)}</div>
            </div>
            <button style={s.closeBtn} onClick={e => { e.stopPropagation(); setConvos(v => v.filter(x => x.other_id !== c.other_id)) }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  return `${Math.floor(h / 24)} day${Math.floor(h / 24) > 1 ? 's' : ''} ago`
}

const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100%' },
  pageTitle: { fontSize: 22, fontWeight: 900, color: 'var(--text)', padding: '16px 16px 4px' },
  searchRow: { padding: '12px 12px 8px', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' },
  searchIcon: { position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' },
  searchInput: { paddingLeft: 36, borderRadius: 14, fontSize: 14, flex: 1 },
  filterBtn: { fontSize: 20, padding: 8 },
  list: { flex: 1, overflowY: 'auto' },
  empty: { textAlign: 'center', color: 'var(--text-dim)', padding: 40 },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: 52, height: 52, borderRadius: 14, objectFit: 'cover' },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 14, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 },
  badge: { position: 'absolute', top: -4, right: -4, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  convoInfo: { flex: 1, minWidth: 0 },
  nameRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 },
  dot: online => ({ width: 8, height: 8, borderRadius: '50%', background: online ? 'var(--online)' : 'var(--away)', flexShrink: 0 }),
  username: { fontWeight: 700, color: 'var(--primary-light)', fontSize: 15 },
  age: { color: 'var(--text-dim)', fontSize: 13 },
  preview: { display: 'flex', alignItems: 'center', gap: 6 },
  unreadTag: { background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 },
  readTag: { background: 'var(--surface2)', color: 'var(--text-dim)', fontSize: 10, padding: '1px 6px', borderRadius: 4 },
  previewText: { fontSize: 13, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  time: { fontSize: 11, color: 'var(--text-dim)', marginTop: 2 },
  closeBtn: { color: 'var(--text-dim)', fontSize: 16, padding: 4 },
}

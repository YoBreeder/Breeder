import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import useStore from '../store'

const API = 'http://localhost:4000'

export default function MembersScreen() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  // Multiplier state
  const [multiplierMode, setMultiplierMode] = useState(false)
  const [selected, setSelected] = useState([])
  const [blastText, setBlastText] = useState('')
  const [blasting, setBlasting] = useState(false)
  const [blastDone, setBlastDone] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get('/members', { params: { search, online_only: onlineOnly } })
      setMembers(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [search, onlineOnly])

  const toggleSelect = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(x => x !== id))
    } else if (selected.length < 10) {
      setSelected([...selected, id])
    }
  }

  const handleCardClick = (m) => {
    if (multiplierMode) {
      toggleSelect(m.id)
    } else {
      nav(`/members/${m.id}`)
    }
  }

  const openMultiplier = () => {
    if (!user?.is_premium) { nav('/premium'); return }
    setMultiplierMode(true)
    setSelected([])
    setBlastText('')
    setBlastDone(false)
  }

  const cancelMultiplier = () => {
    setMultiplierMode(false)
    setSelected([])
  }

  const sendBlast = async () => {
    if (!blastText.trim() || selected.length === 0) return
    setBlasting(true)
    try {
      await api.post('/messages/blast', { to_ids: selected, content: blastText.trim() })
      setBlastDone(true)
      setTimeout(() => { cancelMultiplier() }, 2000)
    } catch {}
    setBlasting(false)
  }

  return (
    <div style={s.root}>
      {/* Search bar */}
      <div style={s.topBar}>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Search members, city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          style={{ ...s.filterBtn, ...(onlineOnly ? s.filterBtnActive : {}) }}
          onClick={() => setOnlineOnly(v => !v)}
          title="Online only"
        >
          <span style={s.onlineDot} />
          Online
        </button>
      </div>

      {/* Multiplier banner (when active) */}
      {multiplierMode && (
        <div style={s.multiplierBanner}>
          <div style={s.bannerTop}>
            <span style={s.bannerTitle}>✕10 MULTIPLIER</span>
            <span style={s.bannerCount}>{selected.length}/10 selected</span>
            <button style={s.bannerClose} onClick={cancelMultiplier}>✕</button>
          </div>
          <p style={s.bannerHint}>Tap up to 10 profiles, then type your message and blast it to all of them.</p>
          {selected.length > 0 && (
            <div style={s.blastRow}>
              <input
                style={s.blastInput}
                placeholder="Hey! Saw your profile…"
                value={blastText}
                onChange={e => setBlastText(e.target.value)}
              />
              <button style={s.blastBtn} onClick={sendBlast} disabled={blasting || !blastText.trim()}>
                {blastDone ? '✓ Sent!' : blasting ? '…' : `Send to ${selected.length}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Member list */}
      {loading ? (
        <div style={s.loading}>Finding guys near you…</div>
      ) : (
        <div style={s.list}>
          {members.map(m => (
            <MemberRow
              key={m.id}
              member={m}
              onClick={() => handleCardClick(m)}
              selectMode={multiplierMode}
              selected={selected.includes(m.id)}
            />
          ))}
          {members.length === 0 && (
            <div style={s.empty}>
              <div style={s.emptyIcon}>👥</div>
              <div>No members found nearby</div>
            </div>
          )}
        </div>
      )}

      {/* Multiplier FAB */}
      {!multiplierMode && (
        <button style={s.multiplierFab} onClick={openMultiplier} title="Multiplier — message 10 at once">
          <span style={s.fabX}>✕</span>
          <span style={s.fab10}>10</span>
          {!user?.is_premium && <span style={s.fabLock}>🔒</span>}
        </button>
      )}
    </div>
  )
}

function MemberRow({ member: m, onClick, selectMode, selected }) {
  const photo = m.photos?.[0] ? `${API}${m.photos[0]}` : null
  const isNew = Date.now() - new Date(m.created_at).getTime() < 7 * 86400000
  const minutesAgo = Math.floor((Date.now() - new Date(m.last_seen).getTime()) / 60000)
  const lastSeenStr = m.is_online ? 'Online now' : minutesAgo < 60 ? `${minutesAgo}m ago` : minutesAgo < 1440 ? `${Math.floor(minutesAgo/60)}h ago` : 'A while ago'

  return (
    <div style={{ ...s.row, ...(selected ? s.rowSelected : {}) }} onClick={onClick}>
      {/* Avatar */}
      <div style={s.avatarWrap}>
        {photo
          ? <img src={photo} alt={m.username} style={s.avatar} />
          : <div style={s.avatarPlaceholder}>👤</div>
        }
        <span style={s.statusDot(m.is_online)} />
        {m.is_boosted && <span style={s.boostRing} />}
      </div>

      {/* Info */}
      <div style={s.info}>
        <div style={s.nameLine}>
          <span style={s.username}>{m.username}</span>
          {m.age && <span style={s.age}>{m.age}</span>}
          {m.is_premium && <span style={s.verifiedBadge}>✓</span>}
          {isNew && <span style={s.newTag}>NEW</span>}
        </div>
        {m.role && <div style={s.role}>{m.role}</div>}
        <div style={s.meta}>
          {m.city && <span style={s.cityText}>📍 {m.city}</span>}
          <span style={{ ...s.lastSeen, ...(m.is_online ? s.lastSeenOnline : {}) }}>{lastSeenStr}</span>
        </div>
      </div>

      {/* Right side */}
      <div style={s.right}>
        {selectMode
          ? <div style={{ ...s.checkbox, ...(selected ? s.checkboxOn : {}) }}>
              {selected && <span style={s.checkmark}>✓</span>}
            </div>
          : <button style={s.msgQuick} onClick={e => { e.stopPropagation(); }}>💬</button>
        }
      </div>
    </div>
  )
}

const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' },
  topBar: { display: 'flex', gap: 8, padding: '12px 12px 8px', alignItems: 'center', flexShrink: 0 },
  searchWrap: { flex: 1, position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' },
  searchInput: { paddingLeft: 36, borderRadius: 50, fontSize: 14, height: 42, background: 'var(--surface2)', border: '1px solid var(--border)' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 42, borderRadius: 50, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: 13, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' },
  filterBtnActive: { background: 'rgba(34,197,94,0.12)', border: '1px solid #22C55E', color: '#22C55E' },
  onlineDot: { width: 8, height: 8, borderRadius: '50%', background: 'currentColor', flexShrink: 0 },

  // Multiplier banner
  multiplierBanner: { background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.15))', border: '1px solid var(--primary)', borderRadius: 16, margin: '0 12px 8px', padding: '14px 14px 10px', flexShrink: 0 },
  bannerTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  bannerTitle: { fontWeight: 800, fontSize: 15, color: 'var(--primary-light)', letterSpacing: 1, flex: 1 },
  bannerCount: { fontSize: 13, fontWeight: 700, color: 'var(--accent)' },
  bannerClose: { color: 'var(--text-dim)', fontSize: 16, padding: '2px 6px' },
  bannerHint: { fontSize: 12, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.4 },
  blastRow: { display: 'flex', gap: 8 },
  blastInput: { flex: 1, borderRadius: 50, fontSize: 13, padding: '0 14px', height: 38, background: 'var(--surface)', border: '1px solid var(--border)' },
  blastBtn: { padding: '0 16px', height: 38, borderRadius: 50, background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 },

  // List
  list: { flex: 1, overflowY: 'auto', padding: '4px 12px 90px' },
  loading: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', flexDirection: 'column', gap: 12, fontSize: 15 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 60, color: 'var(--text-dim)' },
  emptyIcon: { fontSize: 48, opacity: 0.3 },

  // Row card
  row: { display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: 'var(--surface)', borderRadius: 18, marginBottom: 8, border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.15s' },
  rowSelected: { border: '1.5px solid var(--primary)', background: 'rgba(124,58,237,0.08)' },

  // Avatar
  avatarWrap: { position: 'relative', flexShrink: 0, width: 58, height: 58 },
  avatar: { width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' },
  avatarPlaceholder: { width: 58, height: 58, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: '2px solid var(--border)' },
  statusDot: online => ({ position: 'absolute', bottom: 2, right: 2, width: 13, height: 13, borderRadius: '50%', background: online ? 'var(--online)' : 'var(--away)', border: '2px solid var(--surface)' }),
  boostRing: { position: 'absolute', inset: -3, borderRadius: '50%', border: '2px solid var(--primary-light)', animation: 'none' },

  // Info
  info: { flex: 1, minWidth: 0 },
  nameLine: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 },
  username: { fontWeight: 700, fontSize: 15, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  age: { fontSize: 14, color: 'var(--text-dim)', flexShrink: 0 },
  verifiedBadge: { background: 'rgba(59,130,246,0.15)', color: 'var(--accent)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  newTag: { background: 'rgba(124,58,237,0.2)', color: 'var(--primary-light)', borderRadius: 6, fontSize: 10, fontWeight: 800, padding: '1px 5px', letterSpacing: 0.5 },
  role: { fontSize: 12, color: 'var(--primary-light)', fontWeight: 600, marginBottom: 3 },
  meta: { display: 'flex', alignItems: 'center', gap: 10 },
  cityText: { fontSize: 12, color: 'var(--text-dim)' },
  lastSeen: { fontSize: 12, color: 'var(--text-dim)' },
  lastSeenOnline: { color: 'var(--online)', fontWeight: 600 },

  // Right
  right: { flexShrink: 0 },
  msgQuick: { width: 36, height: 36, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: 26, height: 26, borderRadius: '50%', border: '2px solid var(--border)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { background: 'var(--primary)', border: '2px solid var(--primary-light)' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 700 },

  // Multiplier FAB
  multiplierFab: { position: 'absolute', bottom: 80, right: 14, width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg, #4C1D95, var(--primary))', boxShadow: '0 4px 20px rgba(124,58,237,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', zIndex: 100 },
  fabX: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, lineHeight: 1 },
  fab10: { color: '#fff', fontSize: 18, fontWeight: 900, lineHeight: 1 },
  fabLock: { fontSize: 10, lineHeight: 1 },
}

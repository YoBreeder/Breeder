import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import useStore from '../store'

function kmBetween(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const MAX_BLAST = 5
const PULSE_WORDS = ['intercourse', 'penetration', 'lovemaking', 'copulation', 'fornication', 'mating', 'procreate']

export default function MembersScreen() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const userProfile = useStore(s => s.user)
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
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
      const { data } = await api.get('/members', { params: { search, city, online_only: onlineOnly } })
      setMembers(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [search, city, onlineOnly])

  const toggleSelect = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(x => x !== id))
    } else if (selected.length < MAX_BLAST) {
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
            placeholder="Search members…"
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
            <span style={s.bannerTitle}>×5 MULTIPLIER</span>
            <span style={s.bannerCount}>{selected.length}/{MAX_BLAST} selected</span>
            <button style={s.bannerClose} onClick={cancelMultiplier}>✕</button>
          </div>
          <p style={s.bannerHint}>Tap up to 5 profiles, type your message and blast it to all of them.</p>
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

      {/* Member grid */}
      {loading ? (
        <div style={s.loading}>Finding guys near you…</div>
      ) : (
        <div style={s.grid}>
          {members.map(m => (
            <MemberCard
              key={m.id}
              member={m}
              onClick={() => handleCardClick(m)}
              selectMode={multiplierMode}
              selected={selected.includes(m.id)}
              userLat={userProfile?.lat}
              userLng={userProfile?.lng}
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

      {/* City filter bar — always at the bottom */}
      <div style={s.cityBar}>
        <span style={s.cityBarIcon}>📍</span>
        <input
          style={s.cityInput}
          placeholder="Filter by city…"
          value={city}
          onChange={e => setCity(e.target.value)}
        />
        {city && (
          <button style={s.cityClear} onClick={() => setCity('')}>✕</button>
        )}
      </div>

      {/* ×5 Multiplier FAB — always visible */}
      {!multiplierMode && (
        <button style={s.multiplierFab} onClick={openMultiplier} title="×5 Multiplier — message 5 at once">
          <span style={s.fabX}>×</span>
          <span style={s.fab5}>5</span>
          {!user?.is_premium && <span style={s.fabLock}>🔒</span>}
        </button>
      )}
    </div>
  )
}

function MemberCard({ member: m, onClick, selectMode, selected, userLat, userLng }) {
  const photo = m.photos?.[0] ? `${API}${m.photos[0]}` : null
  const isNew = Date.now() - new Date(m.created_at).getTime() < 7 * 86400000
  const [playing, setPlaying] = React.useState(false)
  const audioRef = React.useRef(null)

  const dist = kmBetween(userLat, userLng, m.lat, m.lng)
  const distLabel = dist == null ? null : dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`

  const playVoiceDrop = (e) => {
    e.stopPropagation()
    if (!m.voice_drop) return
    if (playing) {
      audioRef.current?.pause()
      if (audioRef.current) audioRef.current.currentTime = 0
      setPlaying(false)
      return
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(`${API}${m.voice_drop}`)
      audioRef.current.onended = () => setPlaying(false)
    }
    audioRef.current.play()
    setPlaying(true)
  }

  return (
    <div style={{ ...s.card, ...(selected ? s.cardSelected : {}) }} onClick={onClick}>
      <div style={s.photoWrap}>
        {photo
          ? <img src={photo} alt={m.username} style={s.photo} />
          : <div style={s.photoPlaceholder}>👤</div>
        }

        {/* Bottom gradient overlay — role + distance */}
        <div style={s.cardOverlay}>
          <div style={s.cardOverlayRow}>
            {m.role && <span style={s.roleChip}>{m.role}</span>}
            {distLabel && <span style={s.distChip}>◎ {distLabel}</span>}
          </div>
          <div style={s.cardOverlayName}>{m.username}{m.age ? `, ${m.age}` : ''}</div>
        </div>

        {/* Online dot */}
        <span style={s.statusDot(m.is_online)} />

        {isNew && <span style={s.newTag}>NEW</span>}
        {m.is_boosted && !m.voice_drop && <span style={s.boostBadge}>⚡</span>}

        {/* Purple speaker — top right */}
        {m.voice_drop && !selectMode && (
          <button style={{ ...s.speakerBtn, ...(playing ? s.speakerBtnPlaying : {}) }} onClick={playVoiceDrop}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={playing ? '#fff' : '#c4b5fd'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              {playing
                ? <line x1="18" y1="9" x2="18" y2="15"/>
                : <>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  </>
              }
            </svg>
          </button>
        )}

        {selectMode && (
          <div style={{ ...s.checkbox, ...(selected ? s.checkboxOn : {}) }}>
            {selected && <span style={s.checkmark}>✓</span>}
          </div>
        )}
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

  multiplierBanner: { background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.15))', border: '1px solid var(--primary)', borderRadius: 16, margin: '0 12px 8px', padding: '14px 14px 10px', flexShrink: 0 },
  bannerTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  bannerTitle: { fontWeight: 800, fontSize: 15, color: 'var(--primary-light)', letterSpacing: 1, flex: 1 },
  bannerCount: { fontSize: 13, fontWeight: 700, color: 'var(--accent)' },
  bannerClose: { color: 'var(--text-dim)', fontSize: 16, padding: '2px 6px' },
  bannerHint: { fontSize: 12, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.4 },
  blastRow: { display: 'flex', gap: 8 },
  blastInput: { flex: 1, borderRadius: 50, fontSize: 13, padding: '0 14px', height: 38, background: 'var(--surface)', border: '1px solid var(--border)' },
  blastBtn: { padding: '0 16px', height: 38, borderRadius: 50, background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 },

  grid: { flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '8px 10px 80px', alignContent: 'start' },
  loading: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', flexDirection: 'column', gap: 12, fontSize: 15 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 60, color: 'var(--text-dim)', gridColumn: '1 / -1' },
  emptyIcon: { fontSize: 48, opacity: 0.3 },

  cityBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface)', borderTop: '1px solid var(--border)', flexShrink: 0 },
  cityBarIcon: { fontSize: 16, flexShrink: 0 },
  cityInput: { flex: 1, height: 36, borderRadius: 50, fontSize: 13, padding: '0 14px', background: 'var(--surface2)', border: '1px solid var(--border)' },
  cityClear: { fontSize: 14, color: 'var(--text-dim)', padding: '0 6px', flexShrink: 0 },

  card: { background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' },
  cardSelected: { border: '2px solid var(--primary)', background: 'rgba(124,58,237,0.08)' },

  photoWrap: { position: 'relative', width: '100%', aspectRatio: '3/4', background: '#111' },
  photo: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' },
  photoPlaceholder: { width: '100%', height: '100%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 },

  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.82))', padding: '28px 8px 8px', pointerEvents: 'none' },
  cardOverlayRow: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3, flexWrap: 'wrap' },
  cardOverlayName: { fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  roleChip: { fontSize: 9, fontWeight: 800, letterSpacing: 0.6, color: '#c4b5fd', background: 'rgba(124,58,237,0.55)', border: '1px solid rgba(196,181,253,0.4)', borderRadius: 6, padding: '2px 6px', textTransform: 'uppercase' },
  distChip: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3 },

  statusDot: online => ({ position: 'absolute', bottom: 38, right: 8, width: 10, height: 10, borderRadius: '50%', background: online ? '#22C55E' : 'rgba(255,255,255,0.25)', border: '2px solid rgba(0,0,0,0.5)' }),
  newTag: { position: 'absolute', top: 8, left: 8, background: 'var(--primary)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 8, letterSpacing: 0.5 },
  boostBadge: { position: 'absolute', top: 8, right: 8, fontSize: 16 },
  speakerBtn: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(88,28,220,0.75)', border: '1.5px solid rgba(196,181,253,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: 'transform 0.15s, background 0.15s' },
  speakerBtnPlaying: { background: 'rgba(124,58,237,0.95)', border: '1.5px solid #c4b5fd', transform: 'scale(1.12)' },
  checkbox: { position: 'absolute', top: 8, left: 8, width: 26, height: 26, borderRadius: '50%', border: '2px solid #fff', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { background: 'var(--primary)', border: '2px solid var(--primary-light)' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 700 },

  multiplierFab: { position: 'absolute', bottom: 60, right: 14, width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg, #4C1D95, var(--primary))', boxShadow: '0 4px 20px rgba(124,58,237,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', zIndex: 100 },
  fabX: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, lineHeight: 1 },
  fab5: { color: '#fff', fontSize: 20, fontWeight: 900, lineHeight: 1 },
  fabLock: { fontSize: 10, lineHeight: 1 },
}

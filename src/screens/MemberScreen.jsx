import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function MemberScreen() {
  const { id } = useParams()
  const nav = useNavigate()
  const [member, setMember] = useState(null)
  const [faved, setFaved] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [blocking, setBlocking] = useState(false)

  useEffect(() => {
    api.get(`/members/${id}`).then(r => setMember(r.data)).catch(() => {})
    api.get(`/blocks/${id}`).then(r => setBlocked(r.data.blocked)).catch(() => {})
  }, [id])

  const toggleFav = async () => {
    try {
      if (faved) { await api.delete(`/profile/favorites/${id}`); setFaved(false) }
      else        { await api.post(`/profile/favorites/${id}`);   setFaved(true) }
    } catch {}
  }

  const toggleBlock = async () => {
    setBlocking(true)
    try {
      if (blocked) {
        await api.delete(`/blocks/${id}`)
        setBlocked(false)
      } else {
        if (!window.confirm(`Block ${member?.username}? They won't see you and you won't see them.`)) { setBlocking(false); return }
        await api.post(`/blocks/${id}`)
        setBlocked(true)
        nav(-1)
      }
    } catch {}
    setBlocking(false)
  }

  if (!member) return <div style={s.loading}>Loading…</div>
  const photo = member.photos?.[0] ? `${API}${member.photos[0]}` : null

  return (
    <div style={s.root}>
      <button style={s.back} onClick={() => nav(-1)}>← Back</button>

      <div style={s.photoWrap}>
        {photo
          ? <img src={photo} alt="" style={s.photo} />
          : <div style={s.photoPlaceholder}>👤</div>
        }
        <div style={s.photoOverlay}>
          <div style={s.nameRow}>
            <span style={s.dot(member.is_online)} />
            <span style={s.username}>{member.username}</span>
            {member.is_premium && <span style={s.verified}>✓</span>}
            <span style={s.age}>{member.age}</span>
          </div>
          {member.city && <div style={s.city}>📍 {member.city}</div>}
        </div>
      </div>

      <div style={s.content}>
        {member.role && <div style={s.roleChip}>{member.role}</div>}
        {member.bio && <p style={s.bio}>{member.bio}</p>}

        <div style={s.actions}>
          <button style={s.msgBtn} onClick={() => nav(`/messages/${id}`)}>
            💬 Send message
          </button>
          <button style={{ ...s.favBtn, ...(faved ? s.favActive : {}) }} onClick={toggleFav}>
            {faved ? '★' : '☆'}
          </button>
        </div>
        <button style={{ ...s.blockBtn, ...(blocked ? s.blockBtnActive : {}) }} onClick={toggleBlock} disabled={blocking}>
          {blocked ? '🚫 Unblock user' : '🚫 Block user'}
        </button>
      </div>
    </div>
  )
}

const s = {
  root: { minHeight: '100%', background: 'var(--bg)' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' },
  back: { position: 'absolute', top: 12, left: 12, zIndex: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '6px 12px', borderRadius: 10, fontSize: 14 },
  photoWrap: { position: 'relative', aspectRatio: '1', background: 'var(--surface2)', maxHeight: 360 },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  photoPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, opacity: 0.2 },
  photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '24px 16px 16px' },
  nameRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  dot: online => ({ width: 10, height: 10, borderRadius: '50%', background: online ? 'var(--online)' : 'var(--away)' }),
  username: { fontWeight: 800, fontSize: 22, color: '#fff' },
  verified: { color: 'var(--accent)', fontSize: 16 },
  age: { fontSize: 18, color: 'rgba(255,255,255,0.8)' },
  city: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  content: { padding: '20px 16px' },
  roleChip: { display: 'inline-block', background: 'rgba(124,58,237,0.2)', border: '1px solid var(--primary-light)', color: 'var(--primary-light)', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600, marginBottom: 14 },
  bio: { color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 },
  actions: { display: 'flex', gap: 12 },
  msgBtn: { flex: 1, background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700 },
  favBtn: { width: 50, height: 50, borderRadius: 14, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' },
  favActive: { color: '#EAB308', borderColor: '#EAB308', background: 'rgba(234,179,8,0.1)' },
  blockBtn: { marginTop: 12, width: '100%', padding: '12px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' },
  blockBtnActive: { background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#EF4444' },
}

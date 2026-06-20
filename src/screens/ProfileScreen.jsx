import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import useStore from '../store'

const API = 'http://localhost:4000'
const ROLES = ['Breeder', 'Bottom', 'Versatile', 'Top', 'Side', 'Curious']

export default function ProfileScreen() {
  const nav = useNavigate()
  const { user, updateUser, logout } = useStore()
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    api.get('/profile/me').then(r => { setProfile(r.data); updateUser(r.data) }).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/profile/me', {
        bio: profile.bio, role: profile.role, city: profile.city, age: profile.age
      })
      updateUser(data)
      alert('Profile saved!')
    } catch {} finally { setSaving(false) }
  }

  const uploadPhoto = async e => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    try {
      const { data } = await api.post('/profile/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setProfile(p => ({ ...p, photos: [...(p.photos || []), data.url] }))
    } catch {}
  }

  const doLogout = () => { logout(); nav('/') }

  if (!profile) return <div style={s.loading}>Loading…</div>
  const photo = profile.photos?.[0] ? `${API}${profile.photos[0]}` : null

  return (
    <div style={s.root}>
      <div style={s.photoSection}>
        <div style={s.photoWrap} onClick={() => fileRef.current.click()}>
          {photo ? <img src={photo} alt="" style={s.photo} /> : <div style={s.photoPlaceholder}>👤<br /><span style={s.addPhoto}>Add photo</span></div>}
          <div style={s.photoEdit}>📷</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadPhoto} />
        <div style={s.username}>{profile.username}</div>
        {profile.is_premium && <div style={s.premiumBadge}>👑 Premium</div>}
      </div>

      <div style={s.form}>
        <label style={s.label}>Age</label>
        <input type="number" value={profile.age || ''} onChange={e => setProfile(p => ({ ...p, age: e.target.value }))} min={18} max={99} />

        <label style={s.label}>City</label>
        <input value={profile.city || ''} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} placeholder="Your city" />

        <label style={s.label}>Role</label>
        <div style={s.roleGrid}>
          {ROLES.map(r => (
            <button key={r} style={{ ...s.roleBtn, ...(profile.role === r ? s.roleBtnActive : {}) }}
              onClick={() => setProfile(p => ({ ...p, role: r }))}>
              {r}
            </button>
          ))}
        </div>

        <label style={s.label}>About me</label>
        <textarea rows={4} value={profile.bio || ''} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell others about yourself…" style={s.textarea} />

        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginTop: 8 }}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>

        <button className="btn btn-outline" onClick={() => nav('/premium')} style={{ marginTop: 10 }}>
          👑 Get Premium
        </button>

        <button style={s.logoutBtn} onClick={doLogout}>Sign out</button>
      </div>
    </div>
  )
}

const s = {
  root: { padding: '0 0 80px' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' },
  photoSection: { background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  photoWrap: { position: 'relative', width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface2)', cursor: 'pointer', border: '3px solid rgba(255,255,255,0.3)' },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  photoPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  addPhoto: { fontSize: 10 },
  photoEdit: { position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 },
  username: { fontSize: 22, fontWeight: 800, color: '#fff' },
  premiumBadge: { background: 'rgba(234,179,8,0.2)', border: '1px solid #EAB308', color: '#EAB308', borderRadius: 20, padding: '3px 12px', fontSize: 13, fontWeight: 600 },
  form: { padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', marginBottom: -4 },
  roleGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  roleBtn: { padding: '10px 4px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: 13, fontWeight: 600 },
  roleBtnActive: { background: 'rgba(124,58,237,0.2)', border: '1px solid var(--primary-light)', color: 'var(--primary-light)' },
  textarea: { resize: 'none', borderRadius: 12 },
  logoutBtn: { marginTop: 8, color: '#F87171', fontSize: 15, fontWeight: 600, padding: '12px', borderRadius: 14, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.05)' },
}

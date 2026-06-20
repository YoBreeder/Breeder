import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import useStore from '../store'

export default function RegisterScreen() {
  const nav = useNavigate()
  const login = useStore(s => s.login)
  const [form, setForm] = useState({ username: '', email: '', password: '', age: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      // Try to get location
      let lat, lng, city
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        )
        lat = pos.coords.latitude; lng = pos.coords.longitude
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        const d = await r.json()
        city = d.address?.city || d.address?.town || d.address?.county || ''
      } catch {}

      const { data } = await api.post('/auth/register', { ...form, age: Number(form.age), lat, lng, city })
      login(data.user, data.token)
      nav('/members')
    } catch (e) {
      setError(e.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.root}>
      <div style={s.back} onClick={() => nav('/')}>← Back</div>
      <div style={s.logo}>
        <span style={s.logoYo}>Yo</span><span style={s.logoBr}>Breeders</span>
      </div>
      <h2 style={s.title}>Create your account</h2>
      <form onSubmit={submit} style={s.form}>
        <input placeholder="Username" value={form.username} onChange={set('username')} required />
        <input placeholder="Email" type="email" value={form.email} onChange={set('email')} required />
        <input placeholder="Password" type="password" value={form.password} onChange={set('password')} required minLength={6} />
        <input placeholder="Age (must be 18+)" type="number" value={form.age} onChange={set('age')} required min={18} max={99} />
        {error && <div style={s.error}>{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Join YoBreeders'}
        </button>
      </form>
      <p style={s.signin}>Already a member? <span style={s.link} onClick={() => nav('/login')}>Sign in</span></p>
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'linear-gradient(160deg, #0D0B1E 0%, #1a0533 100%)' },
  back: { alignSelf: 'flex-start', color: 'var(--text-dim)', fontSize: 14, cursor: 'pointer', marginBottom: 16 },
  logo: { marginBottom: 8 },
  logoYo: { fontSize: 32, fontWeight: 900, color: 'var(--text)' },
  logoBr: { fontSize: 32, fontWeight: 900, color: 'var(--primary-light)' },
  title: { fontSize: 20, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 380 },
  error: { color: '#F87171', fontSize: 14, textAlign: 'center' },
  signin: { marginTop: 20, color: 'var(--text-dim)', fontSize: 14 },
  link: { color: 'var(--primary-light)', cursor: 'pointer' },
}

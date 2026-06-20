import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import useStore from '../store'

export default function LoginScreen() {
  const nav = useNavigate()
  const login = useStore(s => s.login)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.user, data.token)
      nav('/members')
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed')
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
      <h2 style={s.title}>Sign in</h2>
      <form onSubmit={submit} style={s.form}>
        <input placeholder="Email" type="email" value={form.email} onChange={set('email')} required />
        <input placeholder="Password" type="password" value={form.password} onChange={set('password')} required />
        {error && <div style={s.error}>{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p style={s.signup}>New here? <span style={s.link} onClick={() => nav('/register')}>Create account</span></p>
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
  signup: { marginTop: 20, color: 'var(--text-dim)', fontSize: 14 },
  link: { color: 'var(--primary-light)', cursor: 'pointer' },
}

import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'

export default function ResetPasswordScreen() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid or expired reset link')
    } finally { setLoading(false) }
  }

  return (
    <div style={s.root}>
      <div style={s.logo}><span style={s.yo}>Yo</span><span style={s.br}>Breeder</span></div>
      <h2 style={s.title}>Set new password</h2>

      {done ? (
        <div style={s.successBox}>
          <div style={{ fontSize: 48 }}>✅</div>
          <div style={s.successText}>Password updated! You can now sign in.</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => nav('/login')}>Sign in</button>
        </div>
      ) : !token ? (
        <div style={s.error}>Invalid reset link. Please request a new one.</div>
      ) : (
        <form onSubmit={submit} style={s.form}>
          <div style={s.passRow}>
            <input
              style={s.passInput}
              placeholder="New password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required minLength={6}
            />
            <button type="button" style={s.eyeBtn} onClick={() => setShowPass(v => !v)}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
          <input
            placeholder="Confirm password"
            type={showPass ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
          {error && <div style={s.error}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Set new password'}
          </button>
        </form>
      )}
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', background: 'linear-gradient(160deg, #0D0B1E 0%, #1a0533 100%)' },
  logo: { marginBottom: 12 },
  yo: { fontSize: 32, fontWeight: 800, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-1px' },
  br: { fontSize: 32, fontWeight: 800, color: '#A78BFA', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-1px' },
  title: { fontSize: 22, fontWeight: 700, color: '#F0EEFF', marginBottom: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 380 },
  passRow: { display: 'flex', alignItems: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  passInput: { flex: 1, border: 'none', borderRadius: 0, background: 'transparent', width: 'auto' },
  eyeBtn: { padding: '0 14px', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, opacity: 0.7 },
  error: { color: '#F87171', fontSize: 14, textAlign: 'center' },
  successBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, maxWidth: 320 },
  successText: { fontSize: 15, color: '#9B97C0', lineHeight: 1.6 },
}

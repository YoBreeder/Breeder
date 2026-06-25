import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import useStore from '../store'
import { useT } from '../i18n'
import SocialLogin from '../components/SocialLogin'

function spokenToEmail(said) {
  return said.trim()
    .replace(/\s+at\s+/gi, '@')
    .replace(/\s+dot\s+/gi, '.')
    .replace(/\s+/g, '')
    .toLowerCase()
}

export default function LoginScreen() {
  const nav = useNavigate()
  const login = useStore(s => s.login)
  const tr = useT()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [voiceMode, setVoiceMode] = useState(null)
  const [listening, setListening] = useState(true)

  const [forgot, setForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')

  const recogRef = useRef(null)
  const voiceModeRef = useRef(null)
  const formRef = useRef(form)
  const lastCmdRef = useRef({ cmd: '', time: 0 })

  useEffect(() => { formRef.current = form }, [form])
  useEffect(() => { voiceModeRef.current = voiceMode }, [voiceMode])

  const activateMode = (mode) => { setVoiceMode(mode); voiceModeRef.current = mode }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    const { email, password } = formRef.current
    if (!email || !password) return
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login(data.user, data.token)
      nav('/members')
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  const [noAccount, setNoAccount] = useState(false)

  const sendReset = async (e) => {
    if (e) e.preventDefault()
    setResetLoading(true); setResetError(''); setNoAccount(false)
    try {
      await api.post('/auth/forgot-password', { email: resetEmail })
      setResetSent(true)
    } catch (e) {
      if (e.response?.status === 404) {
        setNoAccount(true)
      } else {
        setResetError(e.response?.data?.error || 'Could not send reset email')
      }
    } finally { setResetLoading(false) }
  }

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    try { recogRef.current?.abort() } catch {}

    const recog = new SR()
    recog.lang = 'en-US'
    recog.continuous = true
    recog.interimResults = true
    recog.maxAlternatives = 1
    recog.onstart = () => setListening(true)

    const fire = (cmd, fn) => {
      const now = Date.now()
      if (lastCmdRef.current.cmd === cmd && now - lastCmdRef.current.time < 500) return
      lastCmdRef.current = { cmd, time: now }
      fn()
    }

    recog.onresult = (e) => {
      const result = e.results[e.results.length - 1]
      const said = result[0].transcript.trim()
      const low = said.toLowerCase()

      if ((low.includes('yo') && low.includes('breeder')) || low.includes('yobreeder')) {
        fire('exit', () => { try { window.close() } catch {} }); return
      }
      if (low.includes('back') || low.includes('atras') || low.includes('volver')) {
        fire('back', () => nav('/')); return
      }
      if (low.includes('show password') || low.includes('view password') || low.includes('reveal')) {
        fire('showpass', () => setShowPass(true)); return
      }
      if (low.includes('hide password') || low.includes('ocultar')) {
        fire('hidepass', () => setShowPass(false)); return
      }
      if (low.includes('forgot') || low.includes('reset password')) {
        fire('forgot', () => { setForgot(true); setResetEmail(formRef.current.email) }); return
      }
      if (low.includes('sign in') || low.includes('login') || low.includes('log in') || low.includes('submit') || low.includes('enter')) {
        fire('submit', () => submit()); return
      }
      if (low.includes('create account') || low.includes('register') || low.includes('join') || low.includes('sign up')) {
        fire('register', () => nav('/register')); return
      }
      if (low === 'email' || low.includes('enter email') || low.includes('my email')) {
        fire('email', () => activateMode('email')); return
      }
      if (low === 'password' || low.includes('enter password') || low.includes('my password')) {
        fire('password', () => activateMode('password')); return
      }

      const mode = voiceModeRef.current
      if (mode === 'email') {
        setForm(f => ({ ...f, email: spokenToEmail(said) }))
      } else if (mode === 'password') {
        setForm(f => ({ ...f, password: said.trim() }))
        activateMode(null)
      }
    }

    recog.onerror = (err) => {
      if (err.error === 'not-allowed' || err.error === 'service-not-allowed') setListening(false)
      else setTimeout(() => { try { recog.start() } catch {} }, 800)
    }
    recog.onend = () => setTimeout(() => { try { recog.start() } catch {} }, 800)

    recogRef.current = recog
    setListening(true)
    try { recog.start() } catch {}
    return () => { try { recog.abort() } catch {} }
  }, [forgot])

  if (forgot) return (
    <div style={s.root}>
      <div style={s.back} onClick={() => { setForgot(false); setResetSent(false); setResetError('') }}>← Back</div>
      <div style={s.logo}><span style={s.logoYo}>Yo</span><span style={s.logoBr}>Breeder</span></div>
      <h2 style={s.title}>Reset password</h2>
      {resetSent ? (
        <div style={s.successBox}>
          <div style={s.successIcon}>📧</div>
          <div style={s.successText}>Check your email — we sent a reset link to <strong>{resetEmail}</strong>.</div>
          <button className="btn btn-outline" style={{ marginTop: 20 }} onClick={() => setForgot(false)}>← Back to sign in</button>
        </div>
      ) : (
        <form onSubmit={sendReset} style={s.form}>
          <p style={s.resetHint}>Enter your email and we'll send a reset link.</p>
          <input placeholder="Your email address" type="email" value={resetEmail} onChange={e => { setResetEmail(e.target.value); setNoAccount(false); setResetError('') }} required />
          {noAccount && (
            <div style={s.noAccountBox}>
              <div style={s.noAccountMsg}>😕 That email isn't in our system.</div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => nav(`/register?email=${encodeURIComponent(resetEmail)}`)}
              >
                Create an account
              </button>
            </div>
          )}
          {resetError && <div style={s.error}>{resetError}</div>}
          {!noAccount && (
            <button className="btn btn-primary" type="submit" disabled={resetLoading}>
              {resetLoading ? 'Sending…' : 'Send reset link'}
            </button>
          )}
        </form>
      )}
    </div>
  )

  return (
    <div style={s.root}>
      <div style={s.back} onClick={() => nav('/')}>← Back</div>
      <div style={s.logo}><span style={s.logoYo}>Yo</span><span style={s.logoBr}>Breeder</span></div>

      <div style={s.micRow}>
        <span style={{ ...s.micDot, background: listening ? '#22C55E' : 'var(--text-dim)', boxShadow: listening ? '0 0 6px #22C55E' : 'none' }} />
        <span style={s.micLabel}>{listening ? 'Listening…' : 'Microphone inactive'}</span>
      </div>

      <h2 style={s.title}>Sign in</h2>

      <form onSubmit={e => { e.preventDefault(); submit() }} style={s.form}>
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          onFocus={() => activateMode('email')}
          required
        />

        <div style={s.passRow}>
          <input
            style={s.passInput}
            placeholder="Password"
            type={showPass ? 'text' : 'password'}
            value={form.password}
            onChange={set('password')}
            onFocus={() => activateMode('password')}
            required
          />
          <button type="button" style={s.eyeBtn} onClick={() => setShowPass(v => !v)}>
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>

        {error && <div style={s.error}>{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={s.forgotRow}>
          <span style={s.link} onClick={() => { setForgot(true); setResetEmail(form.email) }}>
            Forgot password
          </span>
        </div>
      </form>

      <SocialLogin label="Or sign in with" />

      <p style={s.signup}>
        New here?{' '}
        <span style={s.link} onClick={() => nav('/register')}>Create account</span>
      </p>
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'linear-gradient(160deg, #0D0B1E 0%, #1a0533 100%)' },
  back: { alignSelf: 'flex-start', color: 'var(--text-dim)', fontSize: 14, cursor: 'pointer', marginBottom: 16 },
  logo: { marginBottom: 8 },
  logoYo: { fontSize: 32, fontWeight: 800, color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-1px' },
  logoBr: { fontSize: 32, fontWeight: 800, color: 'var(--primary-light)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-1px' },
  micRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 20, padding: '6px 14px' },
  micDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0, transition: 'background 0.3s, box-shadow 0.3s' },
  micLabel: { fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 380 },
  passRow: { display: 'flex', alignItems: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  passInput: { flex: 1, border: 'none', borderRadius: 0, background: 'transparent', width: 'auto' },
  eyeBtn: { padding: '0 14px', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, opacity: 0.7 },
  error: { color: '#F87171', fontSize: 14, textAlign: 'center' },
  forgotRow: { textAlign: 'center', marginTop: -4 },
  resetHint: { fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 },
  noAccountBox: { display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 14 },
  noAccountMsg: { fontSize: 14, color: '#FCD34D', fontWeight: 600, textAlign: 'center' },
  successBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, maxWidth: 320 },
  successIcon: { fontSize: 48 },
  successText: { fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.6 },
  signup: { marginTop: 20, color: 'var(--text-dim)', fontSize: 14, textAlign: 'center' },
  link: { color: 'var(--primary-light)', cursor: 'pointer', fontSize: 13 },
}

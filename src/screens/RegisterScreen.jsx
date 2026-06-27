import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import useStore from '../store'
import { useT } from '../i18n'

function calcAge(dob) {
  if (!dob) return null
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

export default function RegisterScreen() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const preRole = params.get('role') || ''
  const preEmail = params.get('email') || ''
  const login = useStore(s => s.login)
  const tr = useT()
  const [form, setForm] = useState({ username: '', email: preEmail, password: '', dob: '', role: preRole })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const recogRef = useRef(null)
  const mountedRef = useRef(true)
  const restartTimerRef = useRef(null)

  // Voice: "back" returns to landing
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const lastCmd = { cmd: '', time: 0 }
    const fire = (cmd, fn) => {
      const now = Date.now()
      if (lastCmd.cmd === cmd && now - lastCmd.time < 500) return
      lastCmd.cmd = cmd; lastCmd.time = now
      fn()
    }
    const startVoice = () => {
      const recog = new SR()
      recog.lang = 'en-US'; recog.continuous = true; recog.interimResults = true; recog.maxAlternatives = 1
      recog.onresult = (e) => {
        const said = e.results[e.results.length - 1][0].transcript.toLowerCase()
        if ((said.includes('yo') && said.includes('breeder')) || said.includes('yobreeder') || said.includes('close app') || said.includes('exit app')) { fire('exit', () => { try { window.close() } catch {} }); return }
        if (said.includes('back') || said.includes('atras') || said.includes('volver')) { fire('back', () => nav('/')); return }
        if (said.includes('join') || said.includes('submit') || said.includes('unirse') || said.includes('sign up') || said.includes('registrar')) {
          fire('submit', () => document.querySelector('form')?.requestSubmit())
        }
      }
      recog.onend = () => { if (restartTimerRef.current) clearTimeout(restartTimerRef.current); restartTimerRef.current = setTimeout(() => { if (mountedRef.current) startVoice() }, 800) }
      recog.onerror = (e) => { if (e.error !== 'not-allowed' && e.error !== 'service-not-allowed') { if (restartTimerRef.current) clearTimeout(restartTimerRef.current); restartTimerRef.current = setTimeout(() => { if (mountedRef.current) startVoice() }, 800) } }
      recogRef.current = recog
      try { recog.start() } catch {}
    }
    startVoice()
    return () => { mountedRef.current = false; if (restartTimerRef.current) clearTimeout(restartTimerRef.current); try { recogRef.current?.abort() } catch {} }
  }, [])

  const age = calcAge(form.dob)
  const tooYoung = age !== null && age < 18

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!age || tooYoung) { setError('You must be 18 or older to join.'); return }
    setLoading(true); setError('')
    try {
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

      const { data } = await api.post('/auth/register', { ...form, age, lat, lng, city, role: form.role })
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
        <span style={s.logoYo}>Yo</span><span style={s.logoBr}>Breeder</span>
      </div>
      <div style={s.wordCloud}>
        {['intercourse','penetration','lovemaking','copulation','fornication','mating','procreate'].map((w,i) => (
          <span key={w} style={{ ...s.wordChip, opacity: 0.3 + (i % 3) * 0.15 }}>{w}</span>
        ))}
      </div>
      <h2 style={s.title}>{tr.createYourAccount}</h2>
      {form.role && (
        <div style={s.roleTag}>
          {tr.joiningAs} <strong>{form.role === 'Flex' ? tr.both : form.role}</strong>
          <span style={s.roleChange} onClick={() => {
            const next = form.role === 'Breeder' ? 'Receiver' : form.role === 'Receiver' ? 'Flex' : 'Breeder'
            setForm(f => ({ ...f, role: next }))
          }}>
            &nbsp;{tr.switchRole}
          </span>
        </div>
      )}
      <form onSubmit={submit} style={s.form}>
        <input placeholder={tr.username} value={form.username} onChange={set('username')} required />
        <input placeholder={tr.email} type="email" value={form.email} onChange={set('email')} required />
        <div style={s.passRow}>
          <input style={s.passInput} placeholder={tr.password} type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} required minLength={6} />
          <button type="button" style={s.eyeBtn} onClick={() => setShowPass(v => !v)}>{showPass ? '🙈' : '👁️'}</button>
        </div>

        {/* Date of birth → auto-calculates age */}
        <div style={s.dobWrap}>
          <label style={s.dobLabel}>Date of Birth</label>
          <input
            style={{ ...s.dobInput, ...(tooYoung ? s.dobError : {}) }}
            type="date"
            value={form.dob}
            onChange={set('dob')}
            max={new Date().toISOString().split('T')[0]}
            required
          />
          <div style={s.dobHint}>👆 Tap the year in the upper left corner of this screen to jump to your birth year</div>
          {age !== null && (
            <div style={{ ...s.ageDisplay, ...(tooYoung ? s.ageDisplayError : {}) }}>
              {tooYoung
                ? '⚠️ Must be 18 or older to join'
                : `🎂 Age: ${age}`}
            </div>
          )}
        </div>

        {error && <div style={s.error}>{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading || tooYoung}>
          {loading ? tr.creatingAccount : tr.joinYoBreeder}
        </button>
      </form>
      <p style={s.signin}>{tr.alreadyMember} <span style={s.link} onClick={() => nav('/login')}>{tr.signIn}</span></p>
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'linear-gradient(160deg, #0D0B1E 0%, #1a0533 100%)' },
  back: { alignSelf: 'flex-start', color: 'var(--text-dim)', fontSize: 14, cursor: 'pointer', marginBottom: 16 },
  logo: { marginBottom: 8 },
  logoYo: { fontSize: 32, fontWeight: 800, color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-1px' },
  logoBr: { fontSize: 32, fontWeight: 800, color: 'var(--primary-light)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-1px' },
  title: { fontSize: 20, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 380 },
  error: { color: '#F87171', fontSize: 14, textAlign: 'center' },
  signin: { marginTop: 20, color: 'var(--text-dim)', fontSize: 14 },
  link: { color: 'var(--primary-light)', cursor: 'pointer' },
  roleTag: { background: 'rgba(124,58,237,0.15)', border: '1px solid var(--primary)', borderRadius: 12, padding: '8px 16px', fontSize: 14, color: 'var(--primary-light)', marginBottom: 8 },
  roleChange: { color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 },
  passRow: { display: 'flex', alignItems: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  passInput: { flex: 1, border: 'none', borderRadius: 0, background: 'transparent', padding: '12px 14px' },
  eyeBtn: { padding: '0 14px', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, opacity: 0.7 },

  dobWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  dobHint: { fontSize: 11, color: 'rgba(167,139,250,0.6)', paddingLeft: 2, letterSpacing: 0.2 },
  dobLabel: { fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', paddingLeft: 2 },
  dobInput: { borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--surface2)', padding: '12px 14px', fontSize: 15, color: 'var(--text)', width: '100%', boxSizing: 'border-box' },
  dobError: { borderColor: '#F87171' },
  ageDisplay: { fontSize: 14, fontWeight: 700, color: '#22C55E', paddingLeft: 4 },
  ageDisplayError: { color: '#F87171' },

  wordCloud: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 340, marginBottom: 4 },
  wordChip: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--primary-light)', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, padding: '3px 10px' },
}

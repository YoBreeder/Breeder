import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'
import { useT } from '../i18n'

// Maps spoken fragments → canonical word (matches SCATTERED_WORDS)
const WORD_TRIGGERS = {
  'intercourse':   'intercourse',
  'relaciones':    'intercourse',
  'coito':         'intercourse',
  'penetration':   'penetration',
  'penetracion':   'penetration',
  'lovemaking':    'lovemaking',
  'love making':   'lovemaking',
  'hacer el amor': 'lovemaking',
  'copulation':    'copulation',
  'copulacion':    'copulation',
  'copula':        'copulation',
  'fornication':   'fornication',
  'fornicacion':   'fornication',
  'mating':        'mating',
  'apareamiento':  'mating',
  'procreate':     'procreate',
  'procrear':      'procreate',
  'procreacion':   'procreate',
}

// Always-on voice — auto-starts immediately, no interaction required
function useAlwaysOnVoice(nav, setListening, setLitWord) {
  const recogRef = useRef(null)
  const audioCtxRef = useRef(null)
  const activeRef = useRef(false)
  const litTimerRef = useRef(null)
  const lastCmdRef = useRef({ cmd: '', time: 0 })

  const keepAudioAlive = () => {
    try {
      if (audioCtxRef.current) return
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      const ctx = new AC()
      const gain = ctx.createGain()
      gain.gain.value = 0
      const osc = ctx.createOscillator()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      audioCtxRef.current = ctx
    } catch {}
  }

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR || activeRef.current) return
    keepAudioAlive()
    const recog = new SR()
    recog.lang = 'en-US'
    recog.continuous = true
    recog.interimResults = true
    recog.maxAlternatives = 1
    recog.onstart = () => setListening(true)

    const fire = (cmd, fn) => {
      const now = Date.now()
      if (lastCmdRef.current.cmd === cmd && now - lastCmdRef.current.time < 180) return
      lastCmdRef.current = { cmd, time: now }
      fn()
    }

    recog.onresult = (e) => {
      const result = e.results[e.results.length - 1]
      const said = result[0].transcript.toLowerCase().trim()

      // ── Exit app ───────────────────────────────────────────────────
      if ((said.includes('yo') && said.includes('breeder')) || said.includes('yobreeder') || said.includes('close app') || said.includes('exit app')) {
        fire('exit', () => { try { window.close() } catch {} }); return
      }

      // Navigation — react immediately on interim results
      if (said.includes('close') || said.includes('cerrar')) {
        fire('close', () => nav(-1))
      } else if (said.includes('back') || said.includes('atras') || said.includes('volver')) {
        fire('back', () => nav(-1))
      } else if (said.includes('inbox') || said.includes('in box') || said.includes('messages') || said.includes('bandeja')) {
        fire('inbox', () => nav('/messages'))
      } else if (said.includes('profile') || said.includes('perfil') || said.includes('profilo')) {
        fire('profile', () => nav('/profile'))
      } else if (said.includes('members') || said.includes('member') || said.includes('miembros')) {
        fire('members', () => nav('/members'))
      } else if (said.includes('map') || said.includes('mapa') || said.includes('mappa')) {
        fire('map', () => nav('/map'))
      } else if (said.includes('views') || said.includes('visitas')) {
        fire('views', () => nav('/views'))
      } else if (said.includes('premium')) {
        fire('premium', () => nav('/premium'))
      } else if (said.includes('voice drop') || said.includes('voicedrop')) {
        fire('voicedrop', () => nav('/voicedrop'))
      } else if (said.includes('cypher') || said.includes('cipher') || said.includes('quantum')) {
        fire('cypher', () => nav('/cypher'))
      }

      // Word flash — only on final to avoid flicker
      if (result.isFinal) {
        for (const [trigger, canonical] of Object.entries(WORD_TRIGGERS)) {
          if (said.includes(trigger)) {
            if (litTimerRef.current) clearTimeout(litTimerRef.current)
            setLitWord(canonical)
            litTimerRef.current = setTimeout(() => setLitWord(null), 1400)
            break
          }
        }
      }
    }
    recog.onerror = (e) => {
      activeRef.current = false
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setListening(false)
      } else {
        setTimeout(() => start(), 250)
      }
    }
    recog.onend = () => {
      activeRef.current = false
      setTimeout(() => start(), 250)
    }
    recogRef.current = recog
    activeRef.current = true
    try { recog.start() } catch {}
  }

  useEffect(() => {
    // Wait for first user interaction — avoids browser mic-start sounds on mobile
    const onInteract = () => {
      document.removeEventListener('click', onInteract)
      document.removeEventListener('touchstart', onInteract)
      start()
    }
    document.addEventListener('click', onInteract)
    document.addEventListener('touchstart', onInteract)
    return () => {
      document.removeEventListener('click', onInteract)
      document.removeEventListener('touchstart', onInteract)
      try { recogRef.current?.abort() } catch {}
      try { audioCtxRef.current?.close() } catch {}
      if (litTimerRef.current) clearTimeout(litTimerRef.current)
    }
  }, [])
}

function useUnreadCount() {
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    const fetch = () => api.get('/messages').then(r => {
      const total = r.data.reduce((sum, c) => sum + Number(c.unread_count || 0), 0)
      setUnread(total)
    }).catch(() => {})
    fetch()
    const iv = setInterval(fetch, 30000)
    return () => clearInterval(iv)
  }, [])
  return unread
}

export default function Layout({ children }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const active = path => pathname === path
  const unread = useUnreadCount()
  const tr = useT()
  const [listening, setListening] = useState(false)
  const [litWord, setLitWord] = useState(null)
  useAlwaysOnVoice(nav, setListening, setLitWord)

  return (
    <div style={s.root}>
      <style>{`
        @keyframes bgWordFlash {
          0%   { opacity: 0.04; color: var(--primary-light); text-shadow: none; }
          15%  { opacity: 1;    color: #ffffff;               text-shadow: 0 0 22px rgba(167,139,250,1), 0 0 44px rgba(124,58,237,0.7); }
          100% { opacity: 0.04; color: var(--primary-light); text-shadow: none; }
        }
      `}</style>
      <WordBackground litWord={litWord} />
      <header style={s.header}>
        <button style={s.menuBtn} onClick={() => nav('/profile')}>☰</button>
        <div style={s.logo} onClick={() => nav('/members')}>
          <span style={s.yo}>Yo</span><span style={s.br}>Breeder</span>
          <span style={{ ...s.listeningDot, background: listening ? '#22C55E' : 'rgba(255,255,255,0.2)', boxShadow: listening ? '0 0 6px #22C55E' : 'none' }} title="Listening" />
        </div>
        <button style={s.avatarBtn} onClick={() => nav('/profile')}>
          <div style={s.avatar}>👤</div>
        </button>
      </header>

      <div style={s.body}>
        {/* Scrollable side rail */}
        <nav style={s.rail}>
          <NavBtn icon="👥" label={tr.members}    active={active('/members')}   onClick={() => nav('/members')} />
          <NavBtn icon="📍" label={tr.map}        active={active('/map')}       onClick={() => nav('/map')} />
          <NavBtn icon="👁"  label={tr.views}     active={active('/views')}     onClick={() => nav('/views')} />
          <NavBtn icon="💬" label={tr.inbox}      active={active('/messages')}  onClick={() => nav('/messages')} badge={unread} />
          <NavBtn icon="👤" label={tr.profile}    active={active('/profile')}   onClick={() => nav('/profile')} />
          <NavBtn icon="👑" label={tr.premium}    active={active('/premium')}   onClick={() => nav('/premium')} />
          <NavBtn icon="🎙️" label={tr.voicedrop}  active={active('/voicedrop')} onClick={() => nav('/voicedrop')} />
          <NavBtn icon="✦"   label="Cypher QI"     active={active('/cypher')}    onClick={() => nav('/cypher')} />
          <NavBtn icon="×5"  label={tr.multiplier} active={false}              onClick={() => nav('/members')} />
          <NavBtn icon="🚫"  label="Blocked"       active={active('/blocked')}  onClick={() => nav('/blocked')} />
          <NavBtn icon="⚙️" label={tr.settings}   active={false}               onClick={() => nav('/profile')} />
        </nav>

        <main style={s.main}>{children}</main>
      </div>
    </div>
  )
}

// Each entry: [word, top%, left%, rotation, opacity, fontSize]
const SCATTERED_WORDS = [
  ['intercourse',  '4%',  '8%',  -18, 0.045, 11],
  ['penetration',  '11%', '55%',  12, 0.035, 10],
  ['lovemaking',   '22%', '78%', -22, 0.05,  10],
  ['copulation',   '32%', '5%',   15, 0.04,  11],
  ['fornication',  '38%', '62%', -10, 0.035, 10],
  ['mating',       '48%', '30%',  25, 0.055, 13],
  ['procreate',    '55%', '82%', -15, 0.04,  11],
  ['intercourse',  '63%', '12%',  20, 0.035, 10],
  ['penetration',  '70%', '50%', -25, 0.04,  11],
  ['lovemaking',   '77%', '22%',   8, 0.05,  10],
  ['copulation',   '83%', '70%', -18, 0.035, 10],
  ['fornication',  '90%', '40%',  14, 0.045, 11],
  ['mating',       '16%', '18%', -28, 0.04,  12],
  ['procreate',    '60%', '68%',  22, 0.04,  10],
]

function WordBackground({ litWord }) {
  return (
    <div style={wb.wrap} aria-hidden="true">
      {SCATTERED_WORDS.map(([word, top, left, rotate, opacity, size], i) => {
        const isLit = litWord === word
        return (
          <span key={i} style={{
            position: 'absolute', top, left,
            transform: `rotate(${rotate}deg)`,
            fontSize: size,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'var(--primary-light)',
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            // When lit: animation handles opacity/color/glow
            // When not lit: inline opacity controls visibility
            ...(isLit
              ? { animation: 'bgWordFlash 1.4s ease-out forwards' }
              : { opacity }),
          }}>
            {word}
          </span>
        )
      })}
    </div>
  )
}

const wb = {
  wrap: { position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' },
}

function NavBtn({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{ ...s.navBtn, ...(active ? s.navBtnActive : {}) }}>
      <div style={s.navIconWrap}>
        <span style={s.navIcon}>{icon}</span>
        {badge > 0 && <span style={s.navBadge}>{badge > 9 ? '9+' : badge}</span>}
      </div>
      <span style={s.navLabel}>{label}</span>
    </button>
  )
}

const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 480, margin: '0 auto', background: 'var(--bg)' },
  header: { background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  menuBtn: { fontSize: 22, color: '#fff', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logo: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  listeningDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block', transition: 'background 0.4s, box-shadow 0.4s' },
  yo: { fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' },
  br: { fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.75)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' },
  avatarBtn: { width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatar: { fontSize: 20 },

  body: { flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 },

  rail: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    width: 58, flexShrink: 0,
    background: 'var(--surface)', borderRight: '1px solid var(--border)',
    padding: '8px 0',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  navBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    width: 54, padding: '10px 4px', borderRadius: 12,
    opacity: 0.45, transition: 'opacity 0.15s, background 0.15s',
    flexShrink: 0,
  },
  navBtnActive: { opacity: 1, background: 'rgba(124,58,237,0.18)' },
  navIconWrap: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 20 },
  navBadge: { position: 'absolute', top: -5, right: -8, background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 800, borderRadius: 10, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' },
  navLabel: { fontSize: 9, color: 'var(--text-dim)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 },

  main: { flex: 1, overflowY: 'auto', overflowX: 'hidden' },
}

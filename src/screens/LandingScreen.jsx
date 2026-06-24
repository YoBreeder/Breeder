import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store'
import { LANGUAGES, useT } from '../i18n'

const ROLES = ['Breeder', 'Receiver', 'Both']

const TICKER_WORDS_BASE = [
  { display: 'intercourse',   canonical: 'intercourse' },
  { display: 'relaciones',    canonical: 'intercourse' },
  { display: 'penetration',   canonical: 'penetration' },
  { display: 'penetración',   canonical: 'penetration' },
  { display: 'lovemaking',    canonical: 'lovemaking' },
  { display: 'hacer el amor', canonical: 'lovemaking' },
  { display: 'copulation',    canonical: 'copulation' },
  { display: 'cópula',        canonical: 'copulation' },
  { display: 'fornication',   canonical: 'fornication' },
  { display: 'fornicación',   canonical: 'fornication' },
  { display: 'mating',        canonical: 'mating' },
  { display: 'apareamiento',  canonical: 'mating' },
  { display: 'procreate',     canonical: 'procreate' },
  { display: 'procrear',      canonical: 'procreate' },
]
const TICKER_ITEMS = [...TICKER_WORDS_BASE, ...TICKER_WORDS_BASE]

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

export default function LandingScreen() {
  const nav = useNavigate()
  const { lang, setLang } = useStore()
  const tr = useT()
  const [selectedRole, setSelectedRole] = useState(null)
  const [listening, setListening] = useState(true) // stay green unless mic denied
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [showLegal, setShowLegal] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [litWord, setLitWord] = useState(null)
  const [shakeRole, setShakeRole] = useState(false)
  const [litCard, setLitCard] = useState(null)   // 0 | 1 | 2
  const [litTag, setLitTag] = useState(null)      // 'raw' | 'real' | 'dc'
  const [bullAnim, setBullAnim] = useState(false)
  const recogRef = useRef(null)
  const audioCtxRef = useRef(null)
  const roleRef = useRef(null)
  const litTimerRef = useRef(null)
  const litCardTimerRef = useRef(null)
  const litTagTimerRef = useRef(null)
  const bullTimerRef = useRef(null)
  const restartTimerRef = useRef(null)
  const startedRef = useRef(false)
  const lastCmdRef = useRef({ cmd: '', time: 0 })
  const currentLang = LANGUAGES.find(l => l.code === lang)
  // Refs so voice callbacks always see current modal state
  const showLangPickerRef = useRef(false)
  const showLegalRef = useRef(false)
  const showTermsRef = useRef(false)
  useEffect(() => { showLangPickerRef.current = showLangPicker }, [showLangPicker])
  useEffect(() => { showLegalRef.current = showLegal }, [showLegal])
  useEffect(() => { showTermsRef.current = showTerms }, [showTerms])

  useEffect(() => {
    startListening()
    return () => {
      try { recogRef.current?.abort() } catch {}
      try { audioCtxRef.current?.close() } catch {}
      if (litTimerRef.current) clearTimeout(litTimerRef.current)
      if (litCardTimerRef.current) clearTimeout(litCardTimerRef.current)
      if (litTagTimerRef.current) clearTimeout(litTagTimerRef.current)
      if (bullTimerRef.current) clearTimeout(bullTimerRef.current)
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    }
  }, [])

  const scheduleRestart = (delay = 800) => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    restartTimerRef.current = setTimeout(() => {
      if (!document.hidden) startListening()
    }, delay)
  }

  const keepAudioAlive = () => {
    try {
      if (audioCtxRef.current) return
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      const ctx = new AC()
      const gain = ctx.createGain()
      gain.gain.value = 0 // completely silent
      const osc = ctx.createOscillator()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      audioCtxRef.current = ctx
    } catch {}
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (startedRef.current) return // already running, don't restart
    keepAudioAlive()
    try { recogRef.current?.abort() } catch {}

    const recog = new SR()
    recog.lang = 'en-US'
    recog.continuous = true
    recog.interimResults = true  // react mid-speech, not after pause
    recog.maxAlternatives = 1

    recog.onstart = () => { startedRef.current = true; setListening(true) }

    const fire = (cmd, fn) => {
      const now = Date.now()
      if (lastCmdRef.current.cmd === cmd && now - lastCmdRef.current.time < 500) return
      lastCmdRef.current = { cmd, time: now }
      fn()
    }

    recog.onresult = (e) => {
      const result = e.results[e.results.length - 1]
      const said = result[0].transcript.toLowerCase().trim()

      // ── Exit / close app ──────────────────────────────────────────
      if ((said.includes('yo') && said.includes('breeder')) || said.includes('yobreeder') || said.includes('close app') || said.includes('exit')) {
        fire('exit', () => { try { window.close() } catch {} }); return
      }

      // ── Role selection ────────────────────────────────────────────
      if (said.includes('breeder') || said.includes('reproductor') || said.includes('reproducteur') || said.includes('riproduttore')) {
        fire('breeder', () => { roleRef.current = 'Breeder'; setSelectedRole('Breeder'); animateBull() }); return
      }
      if (said.includes('receiver') || said.includes('receptor') || said.includes('récepteur') || said.includes('ricevitore') || said.includes('receive')) {
        fire('receiver', () => { roleRef.current = 'Receiver'; setSelectedRole('Receiver') }); return
      }
      if (said.includes('both') || said.includes('ambos') || said.includes('deux') || said.includes('entrambi')) {
        fire('both', () => { roleRef.current = 'Both'; setSelectedRole('Both') }); return
      }

      // ── Navigation ────────────────────────────────────────────────
      if (said.includes('sign in') || said.includes('log in') || said.includes('login') || said.includes('iniciar sesion')) {
        fire('signin', () => nav('/login')); return
      }
      if (said.includes('join') || said.includes('unirse') || said.includes('register') || said.includes('registrar')) {
        fire('join', () => { if (!roleRef.current) { nudgeRole(); return } nav(`/register?role=${roleRef.current}`) }); return
      }
      if (said.includes('enter') || said.includes('entrar') || said.includes('entra') || said.includes('center')) {
        fire('enter', () => { if (!roleRef.current) { nudgeRole(); return } nav(`/register?role=${roleRef.current}`) }); return
      }

      // ── Close any open panel ──────────────────────────────────────
      if (said.includes('close') || said.includes('cerrar') || said.includes('cancel')) {
        fire('close', () => {
          if (showLangPickerRef.current) { setShowLangPicker(false); return }
          if (showLegalRef.current)      { setShowLegal(false); return }
          if (showTermsRef.current)      { setShowTerms(false); return }
        }); return
      }

      // ── Language selection (when picker is open) ──────────────────
      if (showLangPickerRef.current) {
        if (said.includes('english') || said.includes('ingles') || said.includes('inglés')) {
          fire('lang-en', () => { setLang('en'); setShowLangPicker(false) }); return
        }
        if (said.includes('spanish') || said.includes('español') || said.includes('espanol') || said.includes('español')) {
          fire('lang-es', () => { setLang('es'); setShowLangPicker(false) }); return
        }
        if (said.includes('french') || said.includes('français') || said.includes('frances') || said.includes('francés') || said.includes('france')) {
          fire('lang-fr', () => { setLang('fr'); setShowLangPicker(false) }); return
        }
        if (said.includes('italian') || said.includes('italiano') || said.includes('italia')) {
          fire('lang-it', () => { setLang('it'); setShowLangPicker(false) }); return
        }
        if (said.includes('hindi') || said.includes('india') || said.includes('हिंदी')) {
          fire('lang-hi', () => { setLang('hi'); setShowLangPicker(false) }); return
        }
      }

      // ── UI toggles ────────────────────────────────────────────────
      if (said.includes('language') || said.includes('idioma') || said.includes('tongue')) {
        fire('lang', () => setShowLangPicker(v => !v)); return
      }
      if (said.includes('legal notice') || said.includes('aviso legal')) {
        fire('legal', () => setShowLegal(v => !v)); return
      }
      if (said.includes('terms of service') || said.includes('terms') || said.includes('terminos')) {
        fire('terms', () => setShowTerms(v => !v)); return
      }

      // ── Feature card illumination ─────────────────────────────────
      if (said.includes('member grid') || said.includes('members grid')) {
        fire('card0', () => flashCard(0)); return
      }
      if (said.includes('live map') || said.includes('life map')) {
        fire('card1', () => flashCard(1)); return
      }
      if (said.includes('multiplier') || said.includes('times five') || said.includes('times 5') || said.includes('x5')) {
        fire('card2', () => flashCard(2)); return
      }

      // ── Community tag illumination ────────────────────────────────
      if (said === 'raw' || said.includes(' raw') || said.includes('raw ')) {
        fire('raw', () => flashTag('raw')); return
      }
      if (said === 'real' || said.includes(' real') || said.includes('real ')) {
        fire('real', () => flashTag('real')); return
      }
      if (said === 'dc' || said.includes(' dc') || said.includes('dc ') || said.includes('d.c.')) {
        fire('dc', () => flashTag('dc')); return
      }

      // ── Word flash (only on final result to avoid flicker) ────────
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
      startedRef.current = false
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setListening(false) // only go amber if mic is actually blocked
      } else {
        scheduleRestart(800)
      }
    }

    recog.onend = () => {
      startedRef.current = false
      // Don't touch listening state — stay green during the brief restart gap
      scheduleRestart(800)
    }

    recogRef.current = recog
    try { recog.start() } catch {}
  }

  const selectRole = (role) => {
    roleRef.current = role; setSelectedRole(role)
    if (!startedRef.current) startListening()
  }

  const nudgeRole = () => {
    setShakeRole(true)
    setTimeout(() => setShakeRole(false), 600)
  }

  const flashCard = (idx) => {
    if (litCardTimerRef.current) clearTimeout(litCardTimerRef.current)
    setLitCard(idx)
    litCardTimerRef.current = setTimeout(() => setLitCard(null), 1600)
  }

  const flashTag = (tag) => {
    if (litTagTimerRef.current) clearTimeout(litTagTimerRef.current)
    setLitTag(tag)
    litTagTimerRef.current = setTimeout(() => setLitTag(null), 1600)
  }

  const animateBull = () => {
    if (bullTimerRef.current) clearTimeout(bullTimerRef.current)
    setBullAnim(true)
    bullTimerRef.current = setTimeout(() => setBullAnim(false), 1400)
  }

  const goEnter = () => {
    if (!roleRef.current) { nudgeRole(); return }
    nav(`/register?role=${roleRef.current}`)
  }

  const handleMicTap = () => { if (!startedRef.current) startListening() }

  return (
    <div style={s.root}>
      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); } 50% { box-shadow: 0 0 0 7px rgba(34,197,94,0); } }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
        @keyframes wordFlash {
          0%   { color: rgba(167,139,250,0.6); transform: scale(1);    text-shadow: none; }
          12%  { color: #ffffff;               transform: scale(1.45); text-shadow: 0 0 18px rgba(167,139,250,1), 0 0 36px rgba(124,58,237,0.9); }
          40%  { color: #e9d5ff;               transform: scale(1.2);  text-shadow: 0 0 10px rgba(167,139,250,0.7); }
          100% { color: rgba(167,139,250,0.6); transform: scale(1);    text-shadow: none; }
        }
        @keyframes bullGreet {
          0%   { transform: scale(1) scaleX(1);    filter: none; }
          20%  { transform: scale(1.4) scaleX(-1); filter: drop-shadow(0 0 10px rgba(167,139,250,0.9)); }
          55%  { transform: scale(1.55) scaleX(-1); filter: drop-shadow(0 0 18px rgba(124,58,237,1)); }
          80%  { transform: scale(1.2) scaleX(1);  filter: drop-shadow(0 0 8px rgba(167,139,250,0.5)); }
          100% { transform: scale(1) scaleX(1);    filter: none; }
        }
        @keyframes cardGlow {
          0%,100% { box-shadow: 0 0 0 0 transparent; border-color: inherit; }
          40%     { box-shadow: 0 0 22px rgba(167,139,250,0.7), 0 0 40px rgba(124,58,237,0.35); border-color: rgba(167,139,250,0.8); }
        }
        @keyframes tagGlow {
          0%,100% { color: rgba(167,139,250,0.35); text-shadow: none; background: transparent; border-color: rgba(167,139,250,0.15); }
          40%     { color: #ffffff; text-shadow: 0 0 14px rgba(167,139,250,1), 0 0 28px rgba(124,58,237,0.8); background: rgba(124,58,237,0.2); border-color: rgba(167,139,250,0.8); }
        }
        @keyframes sayItPulse {
          0%,100% { text-shadow: none; opacity: 1; }
          50%     { text-shadow: 0 0 12px rgba(167,139,250,0.8), 0 0 24px rgba(124,58,237,0.5); opacity: 0.9; }
        }
      `}</style>
      <div style={s.blob1} />
      <div style={s.blob2} />

      {/* Legal notice modal */}
      {showLegal && (
        <div style={s.modalOverlay} onClick={() => setShowLegal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>Legal Notice</div>
            <p style={s.modalBody}>YoBreeder is an adult platform intended for users 18 years of age and older. By using this app you confirm you are of legal age in your jurisdiction. All content is consensual between adults.</p>
            <button style={s.modalClose} onClick={() => setShowLegal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Terms of Service modal */}
      {showTerms && (
        <div style={s.modalOverlay} onClick={() => setShowTerms(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>Terms of Service</div>
            <p style={s.modalBody}>By creating an account you agree to use YoBreeder responsibly. You must be 18+. No harassment, no fake profiles, no sharing of content without consent. We reserve the right to remove accounts that violate these terms.</p>
            <button style={s.modalClose} onClick={() => setShowTerms(false)}>Close</button>
          </div>
        </div>
      )}

      <div style={s.content}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={{ ...s.logoIcon, animation: bullAnim ? 'bullGreet 1.4s ease forwards' : 'none' }}>🐂</div>
          <div style={s.logoText}>
            <span style={s.yo}>Yo</span><span style={s.breeders}>Breeder</span>
          </div>
          <div style={s.tagline}>{tr.tagline}</div>
          <div style={s.communityTags}>
            {['RAW', 'REAL', 'DC'].map(tag => (
              <span key={tag} style={{ ...s.communityTag, animation: litTag === tag.toLowerCase() ? 'tagGlow 1.6s ease forwards' : 'none' }}>{tag}</span>
            ))}
          </div>
          <div style={s.micRow} onClick={handleMicTap}>
            <span style={{
              ...s.micDot,
              background: listening ? '#22C55E' : '#F59E0B',
              animation: listening ? 'pulse 1.5s infinite' : 'none',
              boxShadow: listening ? '0 0 6px #22C55E' : '0 0 4px #F59E0B',
            }} />
            <span style={s.micLabel}>{listening ? 'Listening…' : '🎙️ Tap to enable voice'}</span>
          </div>
        </div>

        {/* Role selector */}
        <div>
          <div style={s.sayItHint}>
            <span style={s.sayItMain}>🎙️ say it</span>
            <span style={s.sayItSep}>·</span>
            <span style={s.sayItOr}>or tap below</span>
          </div>
          <div style={{ ...s.roles, animation: shakeRole ? 'shake 0.55s ease' : 'none', outline: shakeRole ? '2px solid #F59E0B' : 'none', outlineOffset: 2 }}>
            {ROLES.map((role, i) => (
              <React.Fragment key={role}>
                {i > 0 && <div style={s.roleDivider} />}
                <button
                  style={{ ...s.roleChip, ...(selectedRole === role ? s.roleChipActive : {}) }}
                  onClick={() => selectRole(role)}
                >
                  <span style={s.roleLabel}>
                    {role === 'Breeder' ? tr.breeder : role === 'Receiver' ? tr.receiver : tr.both}
                  </span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Bilingual word ticker */}
        <div style={s.tickerWrap}>
          <div style={s.tickerInner}>
            {TICKER_ITEMS.map((item, i) => (
              <span key={i} style={{ ...s.tickerWord, ...(litWord === item.canonical ? s.tickerWordLit : {}) }}>
                {item.display}<span style={s.tickerDot}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div style={s.cards}>
          <FeatureCard icon="👥" title={tr.featureGrid}       desc={tr.featureGridDesc}       accent="#7C3AED" lit={litCard === 0} />
          <FeatureCard icon="🗺️" title={tr.featureMap}        desc={tr.featureMapDesc}         accent="#3B82F6" lit={litCard === 1} />
          <FeatureCard icon="×5"  title={tr.featureMultiplier} desc={tr.featureMultiplierDesc}  accent="#A78BFA" premium lit={litCard === 2} />
        </div>

        {shakeRole && (
          <div style={s.roleHint}>⚠️ Choose Breeder, Receiver, or Both first</div>
        )}

        {/* Enter button */}
        <button style={{ ...s.enterBtn, ...(selectedRole ? s.enterBtnActive : s.enterBtnLocked) }} onClick={goEnter}>
          <span style={s.enterIcon}>🎙️</span>
          <span style={s.enterLabel}>
            {selectedRole
              ? `"Enter" → ${selectedRole === 'Breeder' ? tr.breeder : selectedRole === 'Receiver' ? tr.receiver : tr.both}`
              : tr.sayEnter}
          </span>
          <span style={s.enterSub}>{tr.orTapHere}</span>
        </button>

        <div style={s.loginRow}>
          {tr.alreadyMember}{' '}
          <span style={s.loginLink} onClick={() => nav('/login')}>{tr.signIn}</span>
        </div>

        <div style={s.legal}>
          <span style={s.legalLink} onClick={() => setShowLegal(true)}>Legal notice</span>
          <span style={s.dot}>·</span>
          <span style={s.legalLink} onClick={() => setShowTerms(true)}>Terms of Service</span>
          <span style={s.dot}>·</span>
          <div style={s.langWrap}>
            <button style={s.langBtn} onClick={() => setShowLangPicker(v => !v)}>
              <span>{currentLang?.flag}</span>
              <span style={s.langBtnLabel}>{currentLang?.label}</span>
              <span style={s.langChevron}>▾</span>
            </button>
            {showLangPicker && (
              <div style={s.langDropdown}>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    style={{ ...s.langOption, ...(lang === l.code ? s.langOptionActive : {}) }}
                    onClick={() => { setLang(l.code); setShowLangPicker(false) }}
                  >
                    <span>{l.flag}</span>
                    <span style={s.langLabel}>{l.label}</span>
                    {lang === l.code && <span style={s.langCheck}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc, accent, premium, lit }) {
  return (
    <div style={{
      ...s.featureCard,
      borderColor: lit ? accent : `${accent}33`,
      animation: lit ? 'cardGlow 1.6s ease forwards' : 'none',
      transition: 'border-color 0.3s',
    }}>
      <div style={{ ...s.featureIcon, color: accent, filter: lit ? `drop-shadow(0 0 8px ${accent})` : 'none', transition: 'filter 0.3s' }}>{icon}</div>
      <div style={s.featureTitle}>{title}{premium && <span style={s.premTag}>PRO</span>}</div>
      <div style={s.featureDesc}>{desc}</div>
    </div>
  )
}

const s = {
  root: { minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '10px 16px' },
  blob1: { position: 'absolute', top: -100, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', pointerEvents: 'none' },
  blob2: { position: 'absolute', bottom: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', pointerEvents: 'none' },
  content: { width: '100%', maxWidth: 420, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12 },

  logoWrap: { textAlign: 'center', paddingTop: 4 },
  logoIcon: { fontSize: 36, marginBottom: 2 },
  logoText: { fontSize: 34, fontWeight: 900, lineHeight: 1 },
  yo: { color: '#fff' },
  breeders: { color: 'var(--primary-light)' },
  tagline: { fontSize: 11, color: 'var(--text-dim)', marginTop: 4, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 },
  micRow: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 8, cursor: 'pointer', padding: '5px 14px', borderRadius: 20, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)' },
  micDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0, transition: 'background 0.3s, box-shadow 0.3s' },
  micLabel: { fontSize: 11, color: 'var(--text-dim)', fontWeight: 500, whiteSpace: 'nowrap' },

  communityTags: { display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8 },
  communityTag: { fontSize: 9, fontWeight: 900, letterSpacing: 2.5, color: 'rgba(167,139,250,0.35)', padding: '3px 9px', borderRadius: 20, border: '1px solid rgba(167,139,250,0.15)', textTransform: 'uppercase', userSelect: 'none' },

  sayItHint: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', marginBottom: 6 },
  sayItMain: { fontSize: 13, fontWeight: 800, color: 'var(--primary-light)', letterSpacing: 0.5, animation: 'sayItPulse 2.5s ease-in-out infinite' },
  sayItSep: { fontSize: 11, color: 'var(--text-dim)', opacity: 0.4 },
  sayItOr: { fontSize: 10, fontWeight: 500, color: 'var(--text-dim)', opacity: 0.6, letterSpacing: 0.3 },
  roles: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', borderRadius: 16, padding: '12px 0', border: '1px solid var(--border)' },
  roleChip: { flex: 1, textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', borderRadius: 12, transition: 'color 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  roleChipActive: { color: 'var(--primary-light)', background: 'rgba(124,58,237,0.15)', boxShadow: 'inset 0 0 0 1.5px var(--primary)' },
  roleLabel: { fontSize: 16, fontWeight: 800, color: 'inherit', letterSpacing: 0.3 },
  roleMic: { fontSize: 10, opacity: 0.45 },
  roleDivider: { width: 1, height: 24, background: 'var(--border)', flexShrink: 0 },

  tickerWrap: { overflow: 'hidden', borderTop: '1px solid rgba(124,58,237,0.2)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '7px 0', maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' },
  tickerInner: { display: 'flex', whiteSpace: 'nowrap', animation: 'ticker 36s linear infinite' },
  tickerWord: { fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(167,139,250,0.6)', display: 'inline-flex', alignItems: 'center' },
  tickerWordLit: { animation: 'wordFlash 1.4s ease-out forwards' },
  tickerDot: { margin: '0 7px', opacity: 0.4 },

  cards: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
  featureCard: { background: 'var(--surface)', borderRadius: 12, padding: '10px 6px', border: '1px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' },
  featureIcon: { fontSize: 18, fontWeight: 900 },
  featureTitle: { fontSize: 10, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'center' },
  featureDesc: { fontSize: 9, color: 'var(--text-dim)', lineHeight: 1.35 },
  premTag: { background: 'rgba(167,139,250,0.2)', color: 'var(--primary-light)', borderRadius: 4, fontSize: 7, fontWeight: 800, padding: '1px 3px' },

  langWrap: { position: 'relative' },
  langBtn: { display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline' },
  langBtnLabel: { fontSize: 11 },
  langChevron: { fontSize: 9, opacity: 0.7 },
  langDropdown: { position: 'absolute', bottom: '130%', right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 155, animation: 'fadeIn 0.15s ease', zIndex: 20 },
  langOption: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', fontSize: 13, color: 'var(--text)', cursor: 'pointer' },
  langOptionActive: { background: 'rgba(124,58,237,0.15)', color: 'var(--primary-light)' },
  langLabel: { flex: 1, textAlign: 'left' },
  langCheck: { color: 'var(--primary-light)', fontWeight: 700, fontSize: 12 },

  enterBtn: { width: '100%', padding: '14px 16px', borderRadius: 18, background: 'linear-gradient(135deg, #1e1b4b, #3730a3)', border: '2px solid rgba(124,58,237,0.4)', color: '#fff', cursor: 'pointer', textAlign: 'center', boxShadow: '0 0 24px rgba(124,58,237,0.25)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 },
  enterBtnActive: { background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', border: '2px solid var(--primary-light)', boxShadow: '0 0 32px rgba(124,58,237,0.5)' },
  enterBtnLocked: { opacity: 0.45, cursor: 'default' },
  roleHint: { textAlign: 'center', fontSize: 12, color: '#F59E0B', fontWeight: 700, animation: 'fadeIn 0.2s ease' },
  enterIcon: { fontSize: 26 },
  enterLabel: { fontSize: 15, fontWeight: 800, letterSpacing: 0.3 },
  enterSub: { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500 },

  loginRow: { textAlign: 'center', fontSize: 12, color: 'var(--text-dim)' },
  loginLink: { color: 'var(--primary-light)', fontWeight: 600, cursor: 'pointer' },
  legal: { display: 'flex', gap: 8, justifyContent: 'center', paddingBottom: 4, alignItems: 'center' },
  legalLink: { fontSize: 10, color: 'var(--text-dim)', textDecoration: 'underline', cursor: 'pointer' },
  dot: { color: 'var(--text-dim)', fontSize: 10 },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { background: 'var(--surface)', borderRadius: 20, padding: 28, maxWidth: 360, width: '100%', animation: 'fadeInUp 0.2s ease', border: '1px solid var(--border)' },
  modalTitle: { fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 14 },
  modalBody: { fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 20 },
  modalClose: { width: '100%', padding: '12px', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' },
}

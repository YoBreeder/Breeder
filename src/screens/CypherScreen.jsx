import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import useStore from '../store'

export default function CypherScreen() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const [tab, setTab] = useState('match') // match | party

  return (
    <div style={s.root}>
      <style>{`
        @keyframes orbPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.6), 0 0 40px rgba(139,92,246,0.3); transform: scale(1); }
          50%      { box-shadow: 0 0 0 24px rgba(139,92,246,0), 0 0 80px rgba(139,92,246,0.5); transform: scale(1.06); }
        }
        @keyframes orbThink {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.7), 0 0 40px rgba(59,130,246,0.4); transform: scale(1) rotate(0deg); }
          50%  { box-shadow: 0 0 0 32px rgba(59,130,246,0), 0 0 100px rgba(59,130,246,0.6); transform: scale(1.1) rotate(180deg); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.7), 0 0 40px rgba(59,130,246,0.4); transform: scale(1) rotate(360deg); }
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        @keyframes partyPulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <div style={s.header}>
        <div style={s.logo}>
          <span style={s.cypherText}>CYPHER</span>
          <span style={s.qiText}>QI</span>
        </div>
        <div style={s.subtitle}>Quantum Intelligence · AI Matching</div>
      </div>

      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(tab === 'match' ? s.tabActive : {}) }} onClick={() => setTab('match')}>
          ✦ Match
        </button>
        <button style={{ ...s.tab, ...(tab === 'party' ? s.tabActive : {}) }} onClick={() => setTab('party')}>
          🎉 Party <span style={s.premiumBadge}>PRO</span>
        </button>
      </div>

      {tab === 'match' ? <MatchMode nav={nav} /> : <PartyMode nav={nav} user={user} />}
    </div>
  )
}

// ── Cypher conversation steps ─────────────────────────────────────────────
// greeting → vibe_choice → detail_prompt → listening/typing → thinking → results

function CypherBubble({ text, delay = 0 }) {
  return (
    <div style={{ ...c.bubbleRow, animationDelay: `${delay}ms` }}>
      <div style={c.cypherAvatar}>✦</div>
      <div style={c.cypherBubble}>{text}</div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div style={c.userBubbleRow}>
      <div style={c.userBubble}>{text}</div>
    </div>
  )
}

function MatchMode({ nav }) {
  const [step, setStep] = useState('greeting')   // greeting | detail_prompt | input | thinking | results | error
  const [vibe, setVibe] = useState('')            // 'casual' | 'serious'
  const [detail, setDetail] = useState('')
  const [interim, setInterim] = useState('')
  const [listening, setListening] = useState(false)
  const [matches, setMatches] = useState([])
  const [summary, setSummary] = useState('')
  const recogRef = useRef(null)
  const mountedRef = useRef(true)
  const restartRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (restartRef.current) clearTimeout(restartRef.current)
      try { recogRef.current?.abort() } catch {}
    }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [step, matches])

  const pickVibe = (v) => {
    setVibe(v)
    setStep('detail_prompt')
  }

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    try { recogRef.current?.abort() } catch {}
    const recog = new SR()
    recog.lang = 'en-US'; recog.continuous = false; recog.interimResults = true; recog.maxAlternatives = 1
    recog.onstart = () => setListening(true)
    recog.onresult = e => {
      const t = e.results[e.results.length - 1][0].transcript
      setInterim(t)
      if (e.results[e.results.length - 1].isFinal) { setDetail(t); setInterim('') }
    }
    recog.onend = () => { setListening(false); if (mountedRef.current) setInterim('') }
    recog.onerror = () => setListening(false)
    recogRef.current = recog
    try { recog.start() } catch {}
  }

  const submit = async () => {
    const text = detail.trim()
    if (!text) return
    setStep('thinking')
    try {
      const intent = `${vibe === 'casual' ? 'casual encounter: ' : 'serious connection: '}${text}`
      const { data } = await api.post('/cypher/match', { intent })
      if (!mountedRef.current) return
      setMatches(data.matches || [])
      setSummary(data.criteria?.summary || text)
      setStep('results')
    } catch {
      if (mountedRef.current) setStep('error')
    }
  }

  const reset = () => { setStep('greeting'); setVibe(''); setDetail(''); setInterim(''); setMatches([]); setSummary('') }

  return (
    <div style={c.chat}>

      {/* Cypher greeting */}
      <CypherBubble text="Hi! This is Cypher, and I'll be your matching guide." delay={0} />
      <CypherBubble text="So let's see — are you looking for something casual or something more serious?" delay={120} />

      {/* Vibe choice */}
      {step === 'greeting' && (
        <div style={c.choiceRow}>
          <button style={c.choiceBtn} onClick={() => pickVibe('casual')}>Casual</button>
          <button style={c.choiceBtn} onClick={() => pickVibe('serious')}>More Serious</button>
        </div>
      )}

      {/* User picked */}
      {vibe !== '' && <UserBubble text={vibe === 'casual' ? 'Casual' : 'More Serious'} />}

      {/* Cypher follow-up */}
      {(step === 'detail_prompt' || step === 'input' || step === 'thinking' || step === 'results' || step === 'error') && (
        <CypherBubble
          text={vibe === 'casual'
            ? "Can you give me some details about what you're looking for when it comes to your next encounter? Don't be shy — you can be as detailed as you like."
            : "Tell me a bit about what you're looking for in a more serious connection. What matters most to you?"}
          delay={0}
        />
      )}

      {/* User's detail reply */}
      {detail !== '' && <UserBubble text={detail} />}

      {/* Input area */}
      {(step === 'detail_prompt' || step === 'input') && (
        <div style={c.inputWrap}>
          <div style={c.inputRow}>
            <textarea
              style={c.textarea}
              placeholder={listening ? (interim || 'Listening…') : 'Type or tap the mic…'}
              value={listening ? interim : detail}
              onChange={e => { if (!listening) setDetail(e.target.value) }}
              rows={3}
            />
            <button
              style={{ ...c.micBtn, ...(listening ? c.micBtnActive : {}) }}
              onClick={startVoice}
            >🎙️</button>
          </div>
          {(detail.trim() || interim.trim()) && !listening && (
            <button style={c.sendBtn} onClick={submit}>Find my match ✦</button>
          )}
        </div>
      )}

      {/* Thinking */}
      {step === 'thinking' && (
        <div style={c.thinkingRow}>
          <div style={c.cypherAvatar}>✦</div>
          <div style={c.thinkingBubble}>
            <div style={c.dot} /><div style={c.dot} /><div style={c.dot} />
          </div>
        </div>
      )}

      {/* Results */}
      {step === 'results' && (
        <>
          <CypherBubble text={matches.length > 0 ? `Found ${matches.length} match${matches.length > 1 ? 'es' : ''} for you ✦` : 'No matches right now — try broadening your details.'} />
          {summary && (
            <div style={s.summaryBox}>
              <span style={s.summaryLabel}>Cypher understood: </span>
              <span style={s.summaryText}>"{summary}"</span>
            </div>
          )}
          <div style={s.matchList}>
            {matches.map((m, i) => (
              <div key={m.id} style={{ ...s.matchCard, animationDelay: `${i * 60}ms` }} onClick={() => nav(`/members/${m.id}`)}>
                <div style={s.matchRank}>#{i + 1}</div>
                <div style={s.matchAvatar}>
                  {m.photos?.[0] ? <img src={m.photos[0]} alt="" style={s.matchPhoto} /> : <div style={s.matchAvatarFallback}>👤</div>}
                  {m.is_online && <div style={s.onlineDot} />}
                </div>
                <div style={s.matchInfo}>
                  <div style={s.matchName}>{m.username}</div>
                  <div style={s.matchMeta}>{m.role} · {m.age ? `${m.age}yo` : ''}{m.city ? ` · ${m.city}` : ''}</div>
                </div>
                <div style={s.matchScore}>
                  <div style={s.scoreBar}><div style={{ ...s.scoreFill, width: `${Math.min(100, m.score)}%` }} /></div>
                  <div style={s.scoreLabel}>{m.score}%</div>
                </div>
              </div>
            ))}
          </div>
          <button style={{ ...s.retryBtn, marginTop: 24 }} onClick={reset}>Start over ↺</button>
        </>
      )}

      {step === 'error' && (
        <>
          <CypherBubble text="Something went wrong on my end. Want to try again?" />
          <button style={s.retryBtn} onClick={reset}>Try again</button>
        </>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

const c = {
  chat: { width: '100%', padding: '8px 16px 120px', display: 'flex', flexDirection: 'column', gap: 12 },
  bubbleRow: { display: 'flex', alignItems: 'flex-start', gap: 10, animation: 'fadeUp 0.35s ease both' },
  cypherAvatar: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #4c1d95, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#A78BFA', flexShrink: 0, marginTop: 2, boxShadow: '0 0 12px rgba(109,40,217,0.5)' },
  cypherBubble: { background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.3)', borderRadius: '4px 18px 18px 18px', padding: '12px 16px', fontSize: 14, color: '#E9D5FF', lineHeight: 1.55, maxWidth: '85%' },
  userBubbleRow: { display: 'flex', justifyContent: 'flex-end', animation: 'fadeUp 0.3s ease both' },
  userBubble: { background: 'rgba(124,58,237,0.35)', border: '1px solid rgba(124,58,237,0.5)', borderRadius: '18px 4px 18px 18px', padding: '10px 16px', fontSize: 14, color: '#F0EEFF', maxWidth: '80%' },
  choiceRow: { display: 'flex', gap: 10, paddingLeft: 42, flexWrap: 'wrap' },
  choiceBtn: { padding: '10px 22px', borderRadius: 50, background: 'rgba(109,40,217,0.2)', border: '1px solid rgba(109,40,217,0.5)', color: '#C4B5FD', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' },
  inputWrap: { paddingLeft: 42, display: 'flex', flexDirection: 'column', gap: 10 },
  inputRow: { display: 'flex', gap: 8, alignItems: 'flex-end' },
  textarea: { flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(109,40,217,0.4)', borderRadius: 16, padding: '12px 14px', color: '#F0EEFF', fontSize: 14, lineHeight: 1.5, resize: 'none', fontFamily: 'inherit' },
  micBtn: { width: 44, height: 44, borderRadius: '50%', background: 'rgba(109,40,217,0.2)', border: '1px solid rgba(109,40,217,0.4)', fontSize: 20, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  micBtnActive: { background: 'rgba(109,40,217,0.5)', border: '1px solid #A78BFA', boxShadow: '0 0 12px rgba(109,40,217,0.6)' },
  sendBtn: { alignSelf: 'flex-end', padding: '11px 24px', borderRadius: 50, background: 'linear-gradient(135deg, #6d28d9, #4c1d95)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' },
  thinkingRow: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  thinkingBubble: { background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.3)', borderRadius: '4px 18px 18px 18px', padding: '14px 20px', display: 'flex', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#A78BFA', animation: 'orbPulse 1.2s ease-in-out infinite' },
}

function PartyMode({ nav, user }) {
  const [phase, setPhase] = useState('idle') // idle | listening | thinking | results | error | locked
  const [intent, setIntent] = useState('')
  const [transcript, setTranscript] = useState('')
  const [party, setParty] = useState([])
  const [summary, setSummary] = useState('')
  const [inviting, setInviting] = useState(false)
  const [invited, setInvited] = useState(false)
  const recogRef = useRef(null)

  useEffect(() => () => { try { recogRef.current?.abort() } catch {} }, [])

  const startVoice = () => {
    if (!user?.is_premium) { setPhase('locked'); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setIntent(''); return }
    const recog = new SR()
    recog.lang = 'en-US'; recog.interimResults = true; recog.maxAlternatives = 1
    recog.onresult = e => {
      const t = e.results[e.results.length - 1][0].transcript
      setTranscript(t)
      if (e.results[e.results.length - 1].isFinal) { setIntent(t); recog.stop() }
    }
    recog.onend = () => { if (transcript || intent) buildParty(intent || transcript) }
    recog.onerror = () => setPhase('idle')
    recogRef.current = recog
    recog.start(); setPhase('listening'); setTranscript('')
  }

  const buildParty = async (text) => {
    if (!text.trim()) { setPhase('idle'); return }
    setPhase('thinking')
    try {
      const { data } = await api.post('/cypher/party', { intent: text })
      setParty(data.party || []); setSummary(data.criteria?.summary || text); setPhase('results')
    } catch (e) {
      if (e.response?.data?.premium_required) setPhase('locked')
      else setPhase('error')
    }
  }

  const inviteAll = async () => {
    setInviting(true)
    try {
      await Promise.all(party.map(m =>
        api.post('/messages/send', {
          recipientId: m.id,
          content: `🎉 Cypher QI assembled a party for us. Tap to connect before we meet.`
        }).catch(() => {})
      ))
      setInvited(true)
    } finally { setInviting(false) }
  }

  const reset = () => { setPhase('idle'); setIntent(''); setTranscript(''); setParty([]); setSummary(''); setInvited(false) }

  if (phase === 'locked') return (
    <div style={s.lockedWrap}>
      <div style={s.lockIcon}>👑</div>
      <div style={s.lockTitle}>Cypher Party is Premium</div>
      <div style={s.lockDesc}>AI assembles a compatible group for you — matched by desire, not just role. Upgrade to unlock.</div>
      <button style={s.upgradeBtn} onClick={() => nav('/premium')}>Upgrade to Premium</button>
      <button style={s.retryBtn} onClick={() => setPhase('idle')}>← Back</button>
    </div>
  )

  return (
    <>
      <div style={s.partyHint}>
        {phase === 'idle' && <div style={s.partyDesc}>Tell Cypher what kind of party you want. It will find the right people and invite them for you.</div>}
      </div>

      <div style={s.orbWrap}>
        <div style={{ ...s.orb, ...(phase === 'listening' ? s.orbListening : {}), ...(phase === 'thinking' ? s.orbPartyThink : {}), ...(phase === 'results' ? s.orbPartyDone : {}) }}
          onClick={phase === 'idle' ? startVoice : phase === 'results' ? reset : undefined}>
          {phase === 'idle'      && <span style={s.orbIcon}>🎉</span>}
          {phase === 'listening' && <span style={s.orbIcon}>👂</span>}
          {phase === 'thinking'  && <div style={s.spinner} />}
          {phase === 'results'   && <span style={s.orbIcon}>🎉</span>}
          {phase === 'error'     && <span style={s.orbIcon}>⚠️</span>}
          {phase === 'thinking'  && <div style={s.scanLine} />}
        </div>
        <div style={s.orbLabel}>
          {phase === 'idle'      && 'Tap and describe your party'}
          {phase === 'listening' && (transcript || 'Listening…')}
          {phase === 'thinking'  && 'Cypher is assembling your party…'}
          {phase === 'results'   && `Party of ${party.length + 1} assembled · tap orb to reset`}
          {phase === 'error'     && 'Could not build party · try again'}
        </div>
      </div>

      {phase === 'idle' && (
        <div style={s.textFallback}>
          <input style={s.textInput}
            placeholder='e.g. "5 guys, 2 tops 3 bottoms tonight"'
            value={intent} onChange={e => setIntent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && intent.trim() && buildParty(intent)} />
          {intent.trim() && <button style={s.goBtn} onClick={() => buildParty(intent)}>Build my party ✦</button>}
          {!user?.is_premium && (
            <div style={s.premiumNudge}>
              <span>👑 Premium feature · </span>
              <span style={{ color: '#A78BFA', cursor: 'pointer' }} onClick={() => nav('/premium')}>Upgrade</span>
            </div>
          )}
        </div>
      )}

      {phase === 'results' && summary && (
        <div style={s.summaryBox}>
          <span style={s.summaryLabel}>Party vibe: </span>
          <span style={s.summaryText}>"{summary}"</span>
        </div>
      )}

      {phase === 'results' && party.length > 0 && (
        <>
          <div style={s.partyGrid}>
            {party.map((m, i) => (
              <div key={m.id} style={{ ...s.partyCard, animationDelay: `${i * 80}ms` }}>
                <div style={s.partyAvatarWrap}>
                  {m.photos?.[0]
                    ? <img src={m.photos[0]} alt="" style={s.partyPhoto} />
                    : <div style={s.partyAvatarFallback}>👤</div>}
                  {m.is_online && <div style={s.onlineDot} />}
                </div>
                <div style={s.partyName}>{m.username}</div>
                <div style={s.partyRole}>{m.role}</div>
                {m.distance_miles != null && <div style={s.partyDist}>{m.distance_miles}mi</div>}
              </div>
            ))}
            {/* You */}
            <div style={{ ...s.partyCard, border: '1px solid rgba(167,139,250,0.5)' }}>
              <div style={s.partyAvatarWrap}>
                <div style={{ ...s.partyAvatarFallback, background: 'rgba(109,40,217,0.3)' }}>👤</div>
              </div>
              <div style={s.partyName}>You</div>
              <div style={{ ...s.partyRole, color: '#A78BFA' }}>Host</div>
            </div>
          </div>

          {!invited ? (
            <button style={s.inviteBtn} disabled={inviting} onClick={inviteAll}>
              {inviting ? 'Sending invites…' : `🎉 Invite all ${party.length} members`}
            </button>
          ) : (
            <div style={s.invitedBox}>
              ✅ Invites sent — they'll see your message in their inbox
            </div>
          )}
        </>
      )}

      {phase === 'results' && party.length === 0 && (
        <div style={s.noMatches}>Not enough members available right now. Try again later or broaden the vibe.</div>
      )}

      {phase === 'error' && <button style={s.retryBtn} onClick={reset}>Try again</button>}
    </>
  )
}

const s = {
  root: { minHeight: '100%', background: 'linear-gradient(180deg, #0a0618 0%, #0D0B1E 40%)', paddingBottom: 80, display: 'flex', flexDirection: 'column', alignItems: 'center' },

  header: { width: '100%', padding: '28px 20px 16px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(109,40,217,0.3) 0%, transparent 100%)' },
  logo: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 },
  cypherText: { fontSize: 36, fontWeight: 900, letterSpacing: 6, color: '#fff', textShadow: '0 0 30px rgba(139,92,246,0.8)' },
  qiText: { fontSize: 18, fontWeight: 900, letterSpacing: 3, color: '#A78BFA', textShadow: '0 0 20px rgba(167,139,250,0.8)' },
  subtitle: { fontSize: 11, color: '#6D40D9', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginTop: 6 },

  tabs: { display: 'flex', gap: 8, padding: '0 20px 16px', width: '100%' },
  tab: { flex: 1, padding: '10px 0', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9B97C0', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabActive: { background: 'rgba(109,40,217,0.2)', border: '1px solid rgba(109,40,217,0.5)', color: '#F0EEFF' },
  premiumBadge: { fontSize: 9, fontWeight: 800, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', borderRadius: 4, padding: '1px 5px', letterSpacing: 0.5 },

  orbWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '24px 20px 16px' },
  orb: { width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #4c1d95, #1e0a3c)', border: '2px solid rgba(139,92,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: '0 0 40px rgba(139,92,246,0.3)', transition: 'all 0.3s' },
  orbListening: { animation: 'orbPulse 1.2s ease-in-out infinite', background: 'radial-gradient(circle at 35% 35%, #6d28d9, #2e1065)', border: '2px solid rgba(139,92,246,0.9)' },
  orbThinking: { animation: 'orbThink 2s linear infinite', background: 'radial-gradient(circle at 35% 35%, #1d4ed8, #0a1628)', border: '2px solid rgba(59,130,246,0.9)' },
  orbPartyThink: { animation: 'orbThink 2s linear infinite', background: 'radial-gradient(circle at 35% 35%, #b45309, #1a0a00)', border: '2px solid rgba(245,158,11,0.9)' },
  orbDone: { background: 'radial-gradient(circle at 35% 35%, #4c1d95, #1e0a3c)', border: '2px solid #A78BFA', boxShadow: '0 0 60px rgba(167,139,250,0.5)' },
  orbPartyDone: { background: 'radial-gradient(circle at 35% 35%, #92400e, #1a0a00)', border: '2px solid #f59e0b', boxShadow: '0 0 60px rgba(245,158,11,0.4)' },
  orbIcon: { fontSize: 44, zIndex: 2 },
  spinner: { width: 40, height: 40, border: '3px solid rgba(59,130,246,0.2)', borderTop: '3px solid #3B82F6', borderRadius: '50%', position: 'absolute' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.8), transparent)', animation: 'scanLine 1.5s linear infinite' },
  orbLabel: { fontSize: 13, color: '#9B97C0', textAlign: 'center', maxWidth: 280, lineHeight: 1.5, fontStyle: 'italic', minHeight: 40 },

  textFallback: { width: '100%', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 },
  textInput: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 50, padding: '12px 20px', color: '#F0EEFF', fontSize: 14 },
  goBtn: { alignSelf: 'center', padding: '11px 28px', borderRadius: 50, background: 'linear-gradient(135deg, #6d28d9, #4c1d95)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', letterSpacing: 0.5 },

  summaryBox: { margin: '4px 20px 8px', padding: '10px 16px', background: 'rgba(109,40,217,0.12)', border: '1px solid rgba(109,40,217,0.3)', borderRadius: 12, animation: 'fadeUp 0.3s ease' },
  summaryLabel: { fontSize: 11, color: '#6D40D9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 },
  summaryText: { fontSize: 13, color: '#C4B5FD', fontStyle: 'italic' },

  noMatches: { color: '#9B97C0', fontSize: 14, textAlign: 'center', padding: '32px 20px' },

  matchList: { width: '100%', padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 },
  matchCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', cursor: 'pointer', animation: 'fadeUp 0.4s ease both', transition: 'border-color 0.2s' },
  matchRank: { fontSize: 11, fontWeight: 800, color: '#6D40D9', width: 24, flexShrink: 0, textAlign: 'center' },
  matchAvatar: { position: 'relative', flexShrink: 0 },
  matchPhoto: { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' },
  matchAvatarFallback: { width: 44, height: 44, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22C55E', border: '2px solid var(--surface)' },
  matchInfo: { flex: 1, minWidth: 0 },
  matchName: { fontWeight: 700, fontSize: 15, color: '#F0EEFF' },
  matchMeta: { fontSize: 11, color: '#9B97C0', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  matchScore: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 },
  scoreBar: { width: 48, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' },
  scoreFill: { height: '100%', background: 'linear-gradient(90deg, #6d28d9, #A78BFA)', borderRadius: 2 },
  scoreLabel: { fontSize: 10, color: '#A78BFA', fontWeight: 700 },

  retryBtn: { marginTop: 24, padding: '12px 32px', borderRadius: 50, background: 'rgba(109,40,217,0.2)', border: '1px solid rgba(109,40,217,0.4)', color: '#A78BFA', fontWeight: 700, fontSize: 14, cursor: 'pointer' },

  // Party mode
  partyHint: { width: '100%', padding: '0 20px' },
  partyDesc: { fontSize: 13, color: '#9B97C0', textAlign: 'center', lineHeight: 1.6, padding: '0 8px' },
  premiumNudge: { textAlign: 'center', fontSize: 12, color: '#6D40D9', marginTop: 4 },

  partyGrid: { width: '100%', padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', animation: 'fadeUp 0.4s ease' },
  partyCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 10px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', width: 90, animation: 'fadeUp 0.4s ease both', cursor: 'pointer' },
  partyAvatarWrap: { position: 'relative' },
  partyPhoto: { width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' },
  partyAvatarFallback: { width: 52, height: 52, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 },
  partyName: { fontWeight: 700, fontSize: 12, color: '#F0EEFF', textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  partyRole: { fontSize: 10, color: '#9B97C0', fontWeight: 600 },
  partyDist: { fontSize: 10, color: '#6D40D9' },

  inviteBtn: { margin: '16px 20px 0', padding: '14px 28px', borderRadius: 50, background: 'linear-gradient(135deg, #b45309, #d97706)', color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', letterSpacing: 0.3, width: 'calc(100% - 40px)' },
  invitedBox: { margin: '16px 20px 0', padding: '14px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 14, color: '#22C55E', fontWeight: 600, fontSize: 14, textAlign: 'center', animation: 'fadeUp 0.3s ease' },

  lockedWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 28px', gap: 14, textAlign: 'center' },
  lockIcon: { fontSize: 56 },
  lockTitle: { fontSize: 22, fontWeight: 800, color: '#F0EEFF' },
  lockDesc: { fontSize: 14, color: '#9B97C0', lineHeight: 1.6, maxWidth: 300 },
  upgradeBtn: { marginTop: 8, padding: '14px 36px', borderRadius: 50, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' },
}

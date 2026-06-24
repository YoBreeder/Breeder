import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function CypherScreen() {
  const nav = useNavigate()
  const [phase, setPhase] = useState('idle') // idle | listening | thinking | results | error
  const [intent, setIntent] = useState('')
  const [transcript, setTranscript] = useState('')
  const [matches, setMatches] = useState([])
  const [summary, setSummary] = useState('')
  const recogRef = useRef(null)

  useEffect(() => () => { try { recogRef.current?.abort() } catch {} }, [])

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setIntent(''); setPhase('idle'); return }
    const recog = new SR()
    recog.lang = 'en-US'
    recog.interimResults = true
    recog.maxAlternatives = 1
    recog.onresult = e => {
      const t = e.results[e.results.length - 1][0].transcript
      setTranscript(t)
      if (e.results[e.results.length - 1].isFinal) {
        setIntent(t)
        recog.stop()
      }
    }
    recog.onend = () => {
      if (transcript || intent) runMatch(intent || transcript)
    }
    recog.onerror = () => setPhase('idle')
    recogRef.current = recog
    recog.start()
    setPhase('listening')
    setTranscript('')
  }

  const runMatch = async (text) => {
    if (!text.trim()) { setPhase('idle'); return }
    setPhase('thinking')
    try {
      const { data } = await api.post('/cypher/match', { intent: text })
      setMatches(data.matches || [])
      setSummary(data.criteria?.summary || text)
      setPhase('results')
    } catch {
      setPhase('error')
    }
  }

  const reset = () => {
    setPhase('idle'); setIntent(''); setTranscript(''); setMatches([]); setSummary('')
  }

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
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>
          <span style={s.cypherText}>CYPHER</span>
          <span style={s.qiText}>QI</span>
        </div>
        <div style={s.subtitle}>Quantum Intelligence · AI Matching</div>
      </div>

      {/* Orb */}
      <div style={s.orbWrap}>
        <div style={{
          ...s.orb,
          ...(phase === 'listening' ? s.orbListening : {}),
          ...(phase === 'thinking' ? s.orbThinking : {}),
          ...(phase === 'results' ? s.orbDone : {}),
        }}
          onClick={phase === 'idle' ? startVoice : phase === 'results' ? reset : undefined}
        >
          {phase === 'idle'     && <span style={s.orbIcon}>🎙️</span>}
          {phase === 'listening'&& <span style={s.orbIcon}>👂</span>}
          {phase === 'thinking' && <div style={s.spinner} />}
          {phase === 'results'  && <span style={s.orbIcon}>✦</span>}
          {phase === 'error'    && <span style={s.orbIcon}>⚠️</span>}
          {phase === 'thinking' && <div style={s.scanLine} />}
        </div>

        <div style={s.orbLabel}>
          {phase === 'idle'      && 'Tap orb and speak your intent'}
          {phase === 'listening' && (transcript || 'Listening…')}
          {phase === 'thinking'  && 'Cypher QI is analyzing…'}
          {phase === 'results'   && `✦ ${matches.length} matches found · tap to reset`}
          {phase === 'error'     && 'Could not connect · try again'}
        </div>
      </div>

      {/* Text fallback */}
      {phase === 'idle' && (
        <div style={s.textFallback}>
          <input
            style={s.textInput}
            placeholder='Or type what you\'re looking for…'
            value={intent}
            onChange={e => setIntent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && intent.trim() && runMatch(intent)}
          />
          {intent.trim() && (
            <button style={s.goBtn} onClick={() => runMatch(intent)}>Find matches ✦</button>
          )}
        </div>
      )}

      {/* Summary */}
      {phase === 'results' && summary && (
        <div style={s.summaryBox}>
          <span style={s.summaryLabel}>Cypher understood: </span>
          <span style={s.summaryText}>"{summary}"</span>
        </div>
      )}

      {/* Results */}
      {phase === 'results' && matches.length === 0 && (
        <div style={s.noMatches}>No matches found right now. Try broadening your search.</div>
      )}

      {phase === 'results' && matches.length > 0 && (
        <div style={s.matchList}>
          {matches.map((m, i) => (
            <div key={m.id} style={{ ...s.matchCard, animationDelay: `${i * 60}ms` }}
              onClick={() => nav(`/members/${m.id}`)}>
              <div style={s.matchRank}>#{i + 1}</div>
              <div style={s.matchAvatar}>
                {m.photos?.[0]
                  ? <img src={m.photos[0]} alt="" style={s.matchPhoto} />
                  : <div style={s.matchAvatarFallback}>👤</div>
                }
                {m.is_online && <div style={s.onlineDot} />}
              </div>
              <div style={s.matchInfo}>
                <div style={s.matchName}>{m.username}</div>
                <div style={s.matchMeta}>
                  {m.role} · {m.age ? `${m.age}yo` : ''}
                  {m.distance_miles != null ? ` · ${m.distance_miles}mi` : ''}
                  {m.city ? ` · ${m.city}` : ''}
                </div>
              </div>
              <div style={s.matchScore}>
                <div style={s.scoreBar}>
                  <div style={{ ...s.scoreFill, width: `${Math.min(100, m.score)}%` }} />
                </div>
                <div style={s.scoreLabel}>{m.score}%</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === 'error' && (
        <button style={s.retryBtn} onClick={reset}>Try again</button>
      )}
    </div>
  )
}

const s = {
  root: { minHeight: '100%', background: 'linear-gradient(180deg, #0a0618 0%, #0D0B1E 40%)', paddingBottom: 80, display: 'flex', flexDirection: 'column', alignItems: 'center' },

  header: { width: '100%', padding: '28px 20px 16px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(109,40,217,0.3) 0%, transparent 100%)' },
  logo: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 },
  cypherText: { fontSize: 36, fontWeight: 900, letterSpacing: 6, color: '#fff', textShadow: '0 0 30px rgba(139,92,246,0.8)' },
  qiText: { fontSize: 18, fontWeight: 900, letterSpacing: 3, color: '#A78BFA', textShadow: '0 0 20px rgba(167,139,250,0.8)' },
  subtitle: { fontSize: 11, color: '#6D40D9', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginTop: 6 },

  orbWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '32px 20px 20px' },
  orb: { width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #4c1d95, #1e0a3c)', border: '2px solid rgba(139,92,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: '0 0 40px rgba(139,92,246,0.3)', transition: 'all 0.3s' },
  orbListening: { animation: 'orbPulse 1.2s ease-in-out infinite', background: 'radial-gradient(circle at 35% 35%, #6d28d9, #2e1065)', border: '2px solid rgba(139,92,246,0.9)' },
  orbThinking: { animation: 'orbThink 2s linear infinite', background: 'radial-gradient(circle at 35% 35%, #1d4ed8, #0a1628)', border: '2px solid rgba(59,130,246,0.9)' },
  orbDone: { background: 'radial-gradient(circle at 35% 35%, #4c1d95, #1e0a3c)', border: '2px solid #A78BFA', boxShadow: '0 0 60px rgba(167,139,250,0.5)' },
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
}

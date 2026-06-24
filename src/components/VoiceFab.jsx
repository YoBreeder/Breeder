import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function VoiceFab() {
  const nav = useNavigate()
  const [state, setState] = useState('idle') // idle | listening | heard
  const recogRef = useRef(null)

  const listen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const recog = new SR()
    recog.lang = 'en-US'
    recog.interimResults = false
    recog.maxAlternatives = 3
    recog.onresult = (e) => {
      const said = Array.from(e.results[0]).map(r => r.transcript.toLowerCase()).join(' ')
      if (said.includes('inbox') || said.includes('in box') || said.includes('messages')) {
        setState('heard')
        setTimeout(() => { nav('/messages'); setState('idle') }, 500)
      } else {
        setState('idle')
      }
    }
    recog.onerror = () => setState('idle')
    recog.onend = () => setState(s => s === 'listening' ? 'idle' : s)
    recogRef.current = recog
    recog.start()
    setState('listening')
  }

  const stop = () => { recogRef.current?.stop(); setState('idle') }

  return (
    <>
      {state === 'listening' && (
        <div style={s.toast}>Listening… say "Inbox"</div>
      )}
      <button
        style={{ ...s.fab, ...(state === 'listening' ? s.fabActive : {}), ...(state === 'heard' ? s.fabHeard : {}) }}
        onClick={state === 'listening' ? stop : listen}
        title='Say "Inbox" to open messages'
      >
        {state === 'heard' ? '✅' : state === 'listening' ? '👂' : '🎙️'}
      </button>
    </>
  )
}

const s = {
  fab: {
    position: 'fixed', bottom: 90, right: 16,
    width: 46, height: 46, borderRadius: '50%',
    background: 'linear-gradient(135deg, #1e1b4b, #3730a3)',
    boxShadow: '0 4px 16px rgba(55,48,163,0.5)',
    border: '2px solid rgba(255,255,255,0.12)',
    fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 200, transition: 'all 0.2s',
  },
  fabActive: {
    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
    boxShadow: '0 0 0 6px rgba(124,58,237,0.25), 0 4px 20px rgba(124,58,237,0.6)',
    transform: 'scale(1.1)',
  },
  fabHeard: {
    background: 'linear-gradient(135deg, #064e3b, #059669)',
    boxShadow: '0 0 20px rgba(52,211,153,0.5)',
  },
  toast: {
    position: 'fixed', bottom: 145, right: 10,
    background: 'rgba(15,10,30,0.92)', color: '#fff',
    borderRadius: 16, padding: '7px 14px',
    fontSize: 12, fontWeight: 600, zIndex: 300,
    border: '1px solid rgba(124,58,237,0.4)',
    backdropFilter: 'blur(8px)',
    whiteSpace: 'nowrap',
  },
}

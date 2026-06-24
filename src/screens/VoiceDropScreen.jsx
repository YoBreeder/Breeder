import React, { useState, useRef } from 'react'
import api from '../api'

const MAX_SECONDS = 30

export default function VoiceDropScreen() {
  const [status, setStatus] = useState('idle') // idle | recording | uploading | done | error
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS)
  const [audioUrl, setAudioUrl] = useState(null)
  const [savedUrl, setSavedUrl] = useState(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        setStatus('preview')
      }
      mediaRef.current = recorder
      recorder.start()
      setStatus('recording')
      setSecondsLeft(MAX_SECONDS)

      let secs = MAX_SECONDS
      timerRef.current = setInterval(() => {
        secs--
        setSecondsLeft(secs)
        if (secs <= 0) stopRecording()
      }, 1000)
    } catch {
      setStatus('error')
    }
  }

  const stopRecording = () => {
    clearInterval(timerRef.current)
    mediaRef.current?.stop()
  }

  const uploadDrop = async () => {
    setStatus('uploading')
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const fd = new FormData()
      fd.append('audio', blob, 'voicedrop.webm')
      const { data } = await api.post('/profile/voicedrop', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSavedUrl(`${API}${data.url}`)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const deleteDrop = async () => {
    try {
      await api.delete('/profile/voicedrop')
      setSavedUrl(null)
      setAudioUrl(null)
      setStatus('idle')
    } catch {}
  }

  const reset = () => {
    setAudioUrl(null)
    setSecondsLeft(MAX_SECONDS)
    setStatus('idle')
  }

  return (
    <div style={s.root}>
      <div style={s.title}>🎙️ VoiceDrop</div>
      <p style={s.subtitle}>Record a 30-second intro. Other members hear your voice before messaging.</p>

      {status === 'idle' && (
        <button style={s.bigBtn} onClick={startRecording}>
          <span style={s.bigIcon}>🎙️</span>
          <span>Tap to Record</span>
        </button>
      )}

      {status === 'recording' && (
        <div style={s.recordingWrap}>
          <div style={s.pulse} />
          <div style={s.timer}>{secondsLeft}s</div>
          <div style={s.hint}>Recording… tap to stop</div>
          <button style={s.stopBtn} onClick={stopRecording}>■ Stop</button>
        </div>
      )}

      {status === 'preview' && audioUrl && (
        <div style={s.previewWrap}>
          <div style={s.previewLabel}>Preview your VoiceDrop</div>
          <audio src={audioUrl} controls style={s.audio} />
          <div style={s.previewBtns}>
            <button style={s.rerecordBtn} onClick={reset}>Re-record</button>
            <button style={s.saveBtn} onClick={uploadDrop}>Save VoiceDrop</button>
          </div>
        </div>
      )}

      {status === 'uploading' && (
        <div style={s.center}>Saving your VoiceDrop…</div>
      )}

      {status === 'done' && savedUrl && (
        <div style={s.doneWrap}>
          <div style={s.doneTitle}>✓ VoiceDrop saved!</div>
          <audio src={savedUrl} controls style={s.audio} />
          <div style={s.doneBtns}>
            <button style={s.rerecordBtn} onClick={reset}>Record new</button>
            <button style={s.deleteBtn} onClick={deleteDrop}>Delete</button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div style={s.error}>
          <div>Microphone access denied or recording failed.</div>
          <button style={s.rerecordBtn} onClick={reset}>Try again</button>
        </div>
      )}
    </div>
  )
}

const s = {
  root: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', gap: 24, height: '100%' },
  title: { fontSize: 26, fontWeight: 900, color: 'var(--text)' },
  subtitle: { fontSize: 14, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5, maxWidth: 280 },
  bigBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 160, height: 160, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', boxShadow: '0 8px 32px rgba(124,58,237,0.5)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', border: 'none' },
  bigIcon: { fontSize: 48 },
  recordingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  pulse: { width: 120, height: 120, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '3px solid #EF4444', animation: 'pulse 1s ease-in-out infinite' },
  timer: { fontSize: 48, fontWeight: 900, color: '#EF4444' },
  hint: { fontSize: 14, color: 'var(--text-dim)' },
  stopBtn: { padding: '12px 32px', borderRadius: 50, background: '#EF4444', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' },
  previewWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 320 },
  previewLabel: { fontSize: 16, fontWeight: 700, color: 'var(--text)' },
  audio: { width: '100%', borderRadius: 12 },
  previewBtns: { display: 'flex', gap: 12, width: '100%' },
  rerecordBtn: { flex: 1, padding: '12px 0', borderRadius: 50, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  saveBtn: { flex: 1, padding: '12px 0', borderRadius: 50, background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' },
  center: { color: 'var(--text-dim)', fontSize: 16 },
  doneWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 320 },
  doneTitle: { fontSize: 20, fontWeight: 800, color: 'var(--online)' },
  doneBtns: { display: 'flex', gap: 12, width: '100%' },
  deleteBtn: { flex: 1, padding: '12px 0', borderRadius: 50, background: 'rgba(239,68,68,0.12)', border: '1px solid #EF4444', color: '#EF4444', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  error: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#EF4444', textAlign: 'center' },
}

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../api'
import useStore from '../store'

const API = 'http://localhost:4000'

export default function ChatScreen() {
  const { id } = useParams()
  const nav = useNavigate()
  const token = useStore(s => s.token)
  const myId = useStore(s => s.user?.id)
  const [member, setMember] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const bottomRef = useRef()
  const socketRef = useRef()

  useEffect(() => {
    api.get(`/members/${id}`).then(r => setMember(r.data)).catch(() => {})
    api.get(`/messages/${id}`).then(r => setMessages(r.data)).catch(() => {})

    const socket = io(API, { auth: { token } })
    socketRef.current = socket
    socket.on('new_message', msg => {
      if (msg.from_id === id || msg.to_id === id) setMessages(m => [...m, msg])
    })
    socket.on('message_sent', msg => setMessages(m => [...m, msg]))
    return () => socket.disconnect()
  }, [id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = e => {
    e.preventDefault()
    if (!input.trim()) return
    socketRef.current?.emit('send_message', { to: id, content: input.trim() })
    setInput('')
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button style={s.back} onClick={() => nav('/messages')}>←</button>
        {member && (
          <>
            <div style={s.avatar}>
              {member.photos?.[0]
                ? <img src={`${API}${member.photos[0]}`} alt="" style={s.avatarImg} />
                : <span>👤</span>
              }
            </div>
            <div>
              <div style={s.name}>{member.username} <span style={s.age}>{member.age}</span></div>
              <div style={s.status}>{member.is_online ? '🟢 Online' : '⚫ Offline'}</div>
            </div>
          </>
        )}
      </div>

      <div style={s.messages}>
        {messages.map(m => (
          <div key={m.id} style={{ ...s.msgRow, justifyContent: m.from_id === myId ? 'flex-end' : 'flex-start' }}>
            <div style={{ ...s.bubble, ...(m.from_id === myId ? s.myBubble : s.theirBubble) }}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form style={s.inputRow} onSubmit={send}>
        <input
          style={s.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message…"
          autoFocus
        />
        <button type="submit" style={s.sendBtn} disabled={!input.trim()}>➤</button>
      </form>
    </div>
  )
}

const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100%' },
  header: { background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  back: { fontSize: 22, color: '#fff' },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: 'var(--surface2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  name: { fontWeight: 700, fontSize: 16, color: '#fff' },
  age: { fontWeight: 400, color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  status: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  messages: { flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8 },
  msgRow: { display: 'flex' },
  bubble: { maxWidth: '75%', padding: '10px 14px', borderRadius: 18, fontSize: 15, lineHeight: 1.45 },
  myBubble: { background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff', borderBottomRightRadius: 4 },
  theirBubble: { background: 'var(--surface2)', color: 'var(--text)', borderBottomLeftRadius: 4 },
  inputRow: { display: 'flex', gap: 8, padding: '10px 12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 },
  input: { flex: 1, borderRadius: 22, padding: '11px 16px', fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
}

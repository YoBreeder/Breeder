import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useStore from '../store'

export default function OAuthCallbackScreen() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const login = useStore(s => s.login)

  useEffect(() => {
    const token = params.get('token')
    const userStr = params.get('user')
    const error = params.get('error')

    if (error) {
      nav(`/login?oauth_error=${encodeURIComponent(error)}`)
      return
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))
        login(user, token)
        nav('/members', { replace: true })
      } catch {
        nav('/login')
      }
    } else {
      nav('/login')
    }
  }, [])

  return (
    <div style={s.root}>
      <div style={s.spinner} />
      <div style={s.label}>Signing you in…</div>
    </div>
  )
}

const s = {
  root: { minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0D0B1E', gap: 20 },
  spinner: { width: 44, height: 44, border: '3px solid rgba(124,58,237,0.2)', borderTop: '3px solid #7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  label: { fontSize: 15, color: 'rgba(255,255,255,0.5)' },
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component {
  state = { err: null, info: null }
  static getDerivedStateFromError(err) { return { err } }
  componentDidCatch(err, info) { this.setState({ err, info }) }
  render() {
    if (this.state.err) return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0D0B1E', color: '#F0EEFF', padding: 32, textAlign: 'center', gap: 16 }}>
        <div style={{ fontSize: 40 }}>🐂</div>
        <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' }}><span style={{ color: '#fff' }}>Yo</span><span style={{ color: '#A78BFA' }}>Breeder</span></div>
        <div style={{ fontSize: 14, color: '#9B97C0' }}>Something went wrong. Please refresh.</div>
        <div style={{ fontSize: 11, color: '#6D40D9', maxWidth: 340, wordBreak: 'break-all', background: 'rgba(109,40,217,0.1)', border: '1px solid rgba(109,40,217,0.3)', borderRadius: 8, padding: '8px 12px', textAlign: 'left' }}>
          {String(this.state.err)}
        </div>
        <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '12px 28px', borderRadius: 50, background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>Refresh</button>
      </div>
    )
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter><App /></BrowserRouter>
  </ErrorBoundary>
)

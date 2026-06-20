import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../api'
import useStore from '../store'

const API = 'http://localhost:4000'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: null, iconUrl: null, shadowUrl: null })

function avatarIcon(photoUrl) {
  return L.divIcon({
    html: `<div style="width:42px;height:42px;border-radius:50%;overflow:hidden;border:2px solid #7C3AED;background:#1E1A38;">
      ${photoUrl ? `<img src="${API}${photoUrl}" style="width:100%;height:100%;object-fit:cover;" />` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>'}
    </div>`,
    className: '',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  })
}

export default function MapScreen() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const [pins, setPins] = useState([])
  const [city, setCity] = useState('')
  const center = user?.lat && user?.lng ? [user.lat, user.lng] : [25.7617, -80.1918]

  useEffect(() => {
    api.get('/members/map/pins').then(r => setPins(r.data)).catch(() => {})
  }, [])

  return (
    <div style={s.root}>
      <div style={s.searchRow}>
        <span style={s.icon}>🔍</span>
        <input style={s.input} placeholder="Go to a city" value={city} onChange={e => setCity(e.target.value)} />
        <button style={s.filterBtn}>⚙️</button>
      </div>

      <MapContainer center={center} zoom={13} style={s.map} zoomControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {pins.filter(p => p.lat && p.lng).map(p => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={avatarIcon(p.photos?.[0])}>
            <Popup>
              <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => nav(`/members/${p.id}`)}>
                <strong style={{ color: '#7C3AED' }}>{p.username}</strong>, {p.age}<br />
                {p.city}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div style={s.fab}>
        <button style={s.fabBtn} title="Go invisible">👻</button>
        <button style={s.fabBtn} title="My location" onClick={() => {}}>📍</button>
      </div>
    </div>
  )
}

const s = {
  root: { position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' },
  searchRow: { position: 'absolute', top: 12, left: 12, right: 12, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 8 },
  icon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', zIndex: 1 },
  input: { flex: 1, paddingLeft: 36, borderRadius: 14, fontSize: 14, background: 'rgba(22,19,43,0.95)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)' },
  filterBtn: { width: 44, height: 44, borderRadius: 14, background: 'rgba(22,19,43,0.95)', border: '1px solid var(--border)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  map: { flex: 1, width: '100%' },
  fab: { position: 'absolute', right: 12, bottom: 80, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 1000 },
  fabBtn: { width: 46, height: 46, borderRadius: '50%', background: 'rgba(22,19,43,0.95)', border: '1px solid var(--border)', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' },
}

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useStore from './store'
import LandingScreen   from './screens/LandingScreen'
import LoginScreen     from './screens/LoginScreen'
import RegisterScreen  from './screens/RegisterScreen'
import MembersScreen   from './screens/MembersScreen'
import MapScreen       from './screens/MapScreen'
import MessagesScreen  from './screens/MessagesScreen'
import ChatScreen      from './screens/ChatScreen'
import ProfileScreen   from './screens/ProfileScreen'
import MemberScreen    from './screens/MemberScreen'
import ViewsScreen     from './screens/ViewsScreen'
import PremiumScreen   from './screens/PremiumScreen'
import VoiceDropScreen from './screens/VoiceDropScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import CypherScreen    from './screens/CypherScreen'
import OAuthCallbackScreen from './screens/OAuthCallbackScreen'
import Layout          from './components/Layout'

function Guard({ children }) {
  const token = useStore(s => s.token)
  return token ? children : <Navigate to="/" replace />
}

export default function App() {
  const token = useStore(s => s.token)
  return (
    <Routes>
      <Route path="/"           element={token ? <Navigate to="/members" /> : <LandingScreen />} />
      <Route path="/login"      element={<LoginScreen />} />
      <Route path="/oauth-callback" element={<OAuthCallbackScreen />} />
      <Route path="/register"       element={<RegisterScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route path="/members"    element={<Guard><Layout><MembersScreen /></Layout></Guard>} />
      <Route path="/members/:id" element={<Guard><Layout><MemberScreen /></Layout></Guard>} />
      <Route path="/map"        element={<Guard><Layout><MapScreen /></Layout></Guard>} />
      <Route path="/messages"   element={<Guard><Layout><MessagesScreen /></Layout></Guard>} />
      <Route path="/messages/:id" element={<Guard><Layout><ChatScreen /></Layout></Guard>} />
      <Route path="/views"      element={<Guard><Layout><ViewsScreen /></Layout></Guard>} />
      <Route path="/profile"    element={<Guard><Layout><ProfileScreen /></Layout></Guard>} />
      <Route path="/premium"    element={<Guard><Layout><PremiumScreen /></Layout></Guard>} />
      <Route path="/voicedrop"  element={<Guard><Layout><VoiceDropScreen /></Layout></Guard>} />
      <Route path="/cypher"     element={<Guard><Layout><CypherScreen /></Layout></Guard>} />
    </Routes>
  )
}

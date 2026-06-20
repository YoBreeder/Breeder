import { create } from 'zustand'

const useStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('yob_user') || 'null'),
  token: localStorage.getItem('yob_token') || null,

  login: (user, token) => {
    localStorage.setItem('yob_token', token)
    localStorage.setItem('yob_user', JSON.stringify(user))
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('yob_token')
    localStorage.removeItem('yob_user')
    set({ user: null, token: null })
  },

  updateUser: (patch) => set(s => {
    const updated = { ...s.user, ...patch }
    localStorage.setItem('yob_user', JSON.stringify(updated))
    return { user: updated }
  }),
}))

export default useStore

import { create } from 'zustand'

const ls = {
  get: (k, fallback = null) => { try { return localStorage.getItem(k) } catch { return fallback } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch {} },
  remove: (k) => { try { localStorage.removeItem(k) } catch {} },
}

const useStore = create((set) => ({
  user: (() => { try { return JSON.parse(ls.get('yob_user') || 'null') } catch { return null } })(),
  token: ls.get('yob_token'),
  lang: ls.get('yob_lang') || 'en',

  login: (user, token) => {
    ls.set('yob_token', token)
    ls.set('yob_user', JSON.stringify(user))
    set({ user, token })
  },

  logout: () => {
    ls.remove('yob_token')
    ls.remove('yob_user')
    set({ user: null, token: null })
  },

  updateUser: (patch) => set(s => {
    const updated = { ...s.user, ...patch }
    ls.set('yob_user', JSON.stringify(updated))
    return { user: updated }
  }),

  setLang: (lang) => {
    ls.set('yob_lang', lang)
    set({ lang })
  },
}))

export default useStore

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { get, post } from '../lib/api'

/**
 * AuthContext — บัญชีผู้ใช้
 *  - โทเค็นเข้าสู่ระบบเก็บใน localStorage (เปิดเว็บใหม่ก็ยังล็อกอินอยู่)
 *  - guest = เลือกเล่นแบบแขก (ไม่มีบัญชี/สถิติ)
 */
const TOKEN_KEY = 'secret-faker:auth:v1'
const GUEST_KEY = 'secret-faker:guest:v1'
const AuthContext = createContext(null)

const read = (k) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k, v) => {
  try {
    if (v) localStorage.setItem(k, v)
    else localStorage.removeItem(k)
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => read(TOKEN_KEY))
  const [account, setAccount] = useState(null)
  const [ready, setReady] = useState(() => !read(TOKEN_KEY))
  const [guest, setGuestState] = useState(() => read(GUEST_KEY) === '1')
  const tokenRef = useRef(token)
  tokenRef.current = token

  // ตรวจโทเค็นที่เก็บไว้ตอนเปิดเว็บ
  useEffect(() => {
    if (!token) {
      setAccount(null)
      setReady(true)
      return
    }
    let cancelled = false
    get('/api/auth/me', token).then((r) => {
      if (cancelled) return
      if (r.ok) setAccount(r.account)
      else if (r.status === 401) {
        write(TOKEN_KEY, null)
        setToken(null)
        setAccount(null)
      }
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [token])

  const setGuest = useCallback((v) => {
    write(GUEST_KEY, v ? '1' : null)
    setGuestState(v)
  }, [])

  const enter = useCallback(
    (r) => {
      if (!r.ok) return r
      write(TOKEN_KEY, r.token)
      setGuest(false)
      setAccount(r.account)
      setReady(true)
      setToken(r.token)
      return { ok: true }
    },
    [setGuest],
  )

  const login = useCallback(async (username, password) => enter(await post('/api/auth/login', { username, password })), [enter])
  const register = useCallback(
    async (username, password) => enter(await post('/api/auth/register', { username, password })),
    [enter],
  )

  const logout = useCallback(async () => {
    const t = tokenRef.current
    write(TOKEN_KEY, null)
    setToken(null)
    setAccount(null)
    if (t) post('/api/auth/logout', {}, t)
  }, [])

  const apply = (r) => {
    if (r.ok) setAccount(r.account)
    return r
  }
  const saveProfile = useCallback(
    async (displayName) => apply(await post('/api/auth/profile', { displayName }, tokenRef.current)),
    [],
  )
  const uploadAvatar = useCallback(
    async (image) => apply(await post('/api/auth/avatar', { image }, tokenRef.current)),
    [],
  )
  const unlockCreator = useCallback(
    async (code) => apply(await post('/api/creator/unlock', { code }, tokenRef.current)),
    [],
  )

  const value = useMemo(
    () => ({ token, account, ready, guest, setGuest, login, register, logout, saveProfile, uploadAvatar, unlockCreator }),
    [token, account, ready, guest, setGuest, login, register, logout, saveProfile, uploadAvatar, unlockCreator],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { eventsUrl, get, post } from '../lib/api'
import { useAuth } from './AuthContext'

/**
 * RoomContext — เชื่อมกับเซิร์ฟเวอร์จริง
 *  - session (code, playerId, token) เก็บใน localStorage เพื่อให้รีเฟรชแล้วกลับเข้าห้องเดิมได้
 *  - สถานะห้อง/เกมมาจากเซิร์ฟเวอร์แบบเรียลไทม์ (Server-Sent Events)
 *  - ข้อมูลลับ (บทบาทคนอื่น, คำลับของตัวปลอม) ไม่เคยถูกส่งมาที่เครื่องนี้
 *  - การเชื่อมต่อทนทาน: ถ้า SSE ขาด/เงียบเกิน 40 วิ จะต่อใหม่เอง และถ้าเซิร์ฟเวอร์ตอบผิดปกติ (เช่น Render กำลังตื่น)
 *    จะเรียก /check ก่อนว่าถูกเตะจริงหรือแค่เน็ตหลุด — ไม่เตะผู้เล่นออกจากห้องเพราะ 502 ชั่วคราว
 */

const STORAGE_KEY = 'secret-faker:session:v2'
const RoomContext = createContext(null)
const STALE_MS = 40_000 // เซิร์ฟเวอร์ส่ง ping ทุก 15 วิ ถ้าเงียบเกินนี้ถือว่าค้าง
const CHAT_CLIENT_KEEP = 100

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function RoomProvider({ children }) {
  const [session, setSession] = useState(loadSession)
  const [room, setRoom] = useState(null)
  const [game, setGame] = useState(null)
  const [online, setOnline] = useState(true)
  const [lostReason, setLostReason] = useState('')
  const [chat, setChat] = useState([])
  const [creatorAlert, setCreatorAlert] = useState(null) // ผู้สร้างเพิ่งเข้าห้อง { id, name, legend, key }
  const [connKey, setConnKey] = useState(0) // เพิ่มค่าเพื่อบังคับต่อ SSE ใหม่
  const lastEventRef = useRef(Date.now())
  const sessionRef = useRef(session)
  sessionRef.current = session
  const { token: authToken } = useAuth()
  const authRef = useRef(authToken)
  authRef.current = authToken

  useEffect(() => {
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable — ignore */
    }
  }, [session])

  // เชื่อมต่อรับสถานะแบบเรียลไทม์
  useEffect(() => {
    if (!session) {
      setRoom(null)
      setGame(null)
      setChat([])
      setCreatorAlert(null)
      return
    }
    let closed = false
    let retry = null
    const touch = () => {
      lastEventRef.current = Date.now()
    }
    touch()
    const reconnect = (delay = 0) => {
      clearTimeout(retry)
      retry = setTimeout(() => !closed && setConnKey((k) => k + 1), delay)
    }

    const es = new EventSource(eventsUrl(session))
    es.onopen = () => {
      touch()
      setOnline(true)
    }
    es.addEventListener('state', (e) => {
      touch()
      const data = JSON.parse(e.data)
      setRoom(data.room)
      setGame(data.game)
      setOnline(true)
    })
    es.addEventListener('ping', touch)
    es.addEventListener('creator-alert', (e) => {
      touch()
      setCreatorAlert({ ...JSON.parse(e.data), key: Date.now() })
    })
    es.addEventListener('chat', (e) => {
      touch()
      const m = JSON.parse(e.data)
      setChat((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m].slice(-CHAT_CLIENT_KEEP)))
    })
    es.addEventListener('chat-history', (e) => {
      touch()
      const list = JSON.parse(e.data)
      setChat((prev) => {
        const ids = new Set(prev.map((x) => x.id))
        const merged = [...list.filter((x) => !ids.has(x.id)), ...prev].sort((a, b) => a.id - b.id)
        return merged.slice(-CHAT_CLIENT_KEEP)
      })
    })
    es.onerror = () => {
      setOnline(false)
      // CLOSED = เบราว์เซอร์เลิกต่อเอง (เซิร์ฟเวอร์ตอบไม่ใช่ 200) → ถามเซิร์ฟเวอร์ก่อนว่าถูกเตะจริงไหม
      // (CONNECTING = เบราว์เซอร์กำลังต่อใหม่ให้เองอยู่แล้ว)
      if (es.readyState !== EventSource.CLOSED) return
      es.close()
      get(`/api/rooms/${session.code}/check?pid=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`).then((r) => {
        if (closed) return
        if (r.status === 401 || r.status === 404) {
          setLostReason('sessionExpired')
          setSession(null)
        } else {
          reconnect(2500) // เน็ตหลุด / เซิร์ฟเวอร์กำลังตื่น → ลองใหม่
        }
      })
    }

    // เงียบนานผิดปกติ (เช่น มือถือพักแอป, เน็ตเปลี่ยน) → ต่อใหม่
    const watchdog = setInterval(() => {
      if (Date.now() - lastEventRef.current > STALE_MS) {
        setOnline(false)
        reconnect()
      }
    }, 10_000)
    const wake = () => {
      if (document.visibilityState === 'hidden') return
      if (Date.now() - lastEventRef.current > 20_000) reconnect()
    }
    document.addEventListener('visibilitychange', wake)
    window.addEventListener('online', wake)

    return () => {
      closed = true
      clearTimeout(retry)
      clearInterval(watchdog)
      document.removeEventListener('visibilitychange', wake)
      window.removeEventListener('online', wake)
      es.close()
    }
  }, [session, connKey])

  const act = useCallback((type, extra = {}) => {
    const s = sessionRef.current
    if (!s) return Promise.resolve({ ok: false, error: 'sessionExpired' })
    return post(`/api/rooms/${s.code}/action`, { pid: s.playerId, token: s.token, type, ...extra })
  }, [])

  const leaveRoom = useCallback(() => {
    const s = sessionRef.current
    setSession(null)
    if (s) post(`/api/rooms/${s.code}/action`, { pid: s.playerId, token: s.token, type: 'LEAVE' })
  }, [])

  const enter = useCallback(
    async (path, body) => {
      const old = sessionRef.current
      const r = await post(path, body)
      if (!r.ok) return r
      if (old) post(`/api/rooms/${old.code}/action`, { pid: old.playerId, token: old.token, type: 'LEAVE' })
      setLostReason('')
      setRoom(null)
      setGame(null)
      setChat([])
      setSession({ code: r.code, playerId: r.playerId, token: r.token })
      return { ok: true, code: r.code }
    },
    [],
  )

  const sendChat = useCallback((text) => act('CHAT', { text }), [act])
  const setPrivacy = useCallback((isPrivate) => act('SET_PRIVACY', { value: isPrivate }), [act])

  const uploadAvatar = useCallback((image) => {
    const s = sessionRef.current
    if (!s) return Promise.resolve({ ok: false, error: 'sessionExpired' })
    return post(`/api/rooms/${s.code}/avatar`, { pid: s.playerId, token: s.token, image })
  }, [])

  const createRoom = useCallback(
    ({ nickname, roomName, maxPlayers, isPrivate }) =>
      enter('/api/rooms', { nickname, roomName, maxPlayers, isPrivate, auth: authRef.current }),
    [enter],
  )
  const joinRoom = useCallback(
    ({ nickname, code }) => enter(`/api/rooms/${code}/join`, { nickname, auth: authRef.current }),
    [enter],
  )

  const me = room?.players.find((p) => p.id === session?.playerId) ?? null

  const value = useMemo(
    () => ({
      session,
      room,
      game,
      me,
      isHost: !!me?.isHost,
      online,
      lostReason,
      clearLost: () => setLostReason(''),
      createRoom,
      joinRoom,
      leaveRoom,
      act,
      chat,
      creatorAlert,
      clearCreatorAlert: () => setCreatorAlert(null),
      sendChat,
      setPrivacy,
      uploadAvatar,
    }),
    [session, room, game, me, online, lostReason, chat, creatorAlert, createRoom, joinRoom, leaveRoom, act, sendChat, setPrivacy, uploadAvatar],
  )

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}

export function useRoom() {
  const ctx = useContext(RoomContext)
  if (!ctx) throw new Error('useRoom must be used inside <RoomProvider>')
  return ctx
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { eventsUrl, post } from '../lib/api'
import { useAuth } from './AuthContext'

/**
 * RoomContext — เชื่อมกับเซิร์ฟเวอร์จริง
 *  - session (code, playerId, token) เก็บใน localStorage เพื่อให้รีเฟรชแล้วกลับเข้าห้องเดิมได้
 *  - สถานะห้อง/เกมมาจากเซิร์ฟเวอร์แบบเรียลไทม์ (Server-Sent Events)
 *  - ข้อมูลลับ (บทบาทคนอื่น, คำลับของตัวปลอม) ไม่เคยถูกส่งมาที่เครื่องนี้
 */

const STORAGE_KEY = 'secret-faker:session:v2'
const RoomContext = createContext(null)

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
      return
    }
    const es = new EventSource(eventsUrl(session))
    es.onopen = () => setOnline(true)
    es.addEventListener('state', (e) => {
      const data = JSON.parse(e.data)
      setRoom(data.room)
      setGame(data.game)
      setOnline(true)
    })
    es.onerror = () => {
      setOnline(false)
      // CLOSED = เซิร์ฟเวอร์ปฏิเสธ (ห้องหายหรือเราถูกเอาออกแล้ว) ไม่ใช่แค่เน็ตหลุดชั่วคราว
      if (es.readyState === EventSource.CLOSED) {
        setLostReason('sessionExpired')
        setSession(null)
      }
    }
    return () => es.close()
  }, [session])

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
      setSession({ code: r.code, playerId: r.playerId, token: r.token })
      return { ok: true, code: r.code }
    },
    [],
  )

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
      uploadAvatar,
    }),
    [session, room, game, me, online, lostReason, createRoom, joinRoom, leaveRoom, act, uploadAvatar],
  )

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}

export function useRoom() {
  const ctx = useContext(RoomContext)
  if (!ctx) throw new Error('useRoom must be used inside <RoomProvider>')
  return ctx
}

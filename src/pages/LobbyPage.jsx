import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Background from '../components/Background'
import Button from '../components/Button'
import ConnectionBanner from '../components/ConnectionBanner'
import LangSwitch from '../components/LangSwitch'
import SoundToggle from '../components/SoundToggle'
import ChatPanel from '../components/ChatPanel'
import Loading from '../components/Loading'
import RoomCodeBadge from '../components/RoomCodeBadge'
import { EmptySlot, PlayerCard } from '../components/PlayerCard'
import Toast from '../components/Toast'
import { CheckIcon, CopyIcon, GlobeIcon, LockIcon, LogoutIcon, PencilIcon, PlayIcon } from '../components/Icons'
import { useRoom } from '../context/RoomContext'
import { useLang } from '../i18n/LanguageContext'
import { MIN_PLAYERS_TO_START } from '../../shared/gameLogic.js'
import { cx } from '../lib/utils'
import { sfx } from '../lib/sound'

/** เสียงประกอบห้องรอ: มีคนเข้า/ออก/กดพร้อม + เสียงเริ่มเกม (แยกเป็นคอมโพเนนต์เพื่อไม่ชนกับ early return ของหน้า) */
function LobbySfx({ room, meId }) {
  const prev = useRef(null)
  useEffect(() => {
    const cur = { n: room.players.length, ready: room.players.filter((p) => p.ready).length }
    const p = prev.current
    prev.current = cur
    if (!p) return
    if (cur.n > p.n) sfx.join()
    else if (cur.n < p.n) sfx.leave()
    else if (cur.ready > p.ready) sfx.ready()
  }, [room.players, meId])
  return null
}

export default function LobbyPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { session, room, me, isHost, act, leaveRoom, setPrivacy } = useRoom()
  const { t } = useLang()
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  // ไม่มีสิทธิ์ในห้องนี้ (เช่นเปิดลิงก์ตรง) → ไปหน้าเข้าห้องพร้อมรหัสที่กรอกให้แล้ว
  if (!session || session.code !== code.toUpperCase()) return <Navigate to={`/join?code=${code}`} replace />
  if (!room) return <Loading />
  if (room.inGame) return <Navigate to={`/game/${room.code}`} replace />

  const players = room.players
  const readyCount = players.filter((p) => p.ready).length
  const allReady = readyCount === players.length
  const enoughPlayers = players.length >= MIN_PLAYERS_TO_START
  const canStart = isHost && allReady && enoughPlayers

  const slots = Array.from({ length: room.maxPlayers }, (_, i) => players[i] ?? null)

  const hint = !isHost
    ? t('lobby.hint.waitHost')
    : !enoughPlayers
      ? t('lobby.hint.need', { n: MIN_PLAYERS_TO_START })
      : !allReady
        ? t('lobby.hint.allReady')
        : t('lobby.hint.ok')

  const leave = () => {
    leaveRoom()
    navigate('/')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/join?code=${room.code}`)
      setToast(t('lobby.linkCopied'))
    } catch {
      /* clipboard blocked */
    }
  }

  const start = async () => {
    const r = await act('START')
    if (!r.ok) {
      sfx.error()
      setToast(t(`err.${r.error}`))
    } else {
      sfx.start()
    }
  }

  const togglePrivacy = async () => {
    const r = await setPrivacy(!room.isPrivate)
    if (!r.ok) setToast(t(`err.${r.error}`))
  }

  const PrivacyIcon = room.isPrivate ? LockIcon : GlobeIcon
  const privacyLabel = room.isPrivate ? t('lobby.private') : t('lobby.public')

  return (
    <div className="relative min-h-screen">
      <Background />
      <ConnectionBanner />
      <LobbySfx room={room} meId={me?.id} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
          {/* ซ้าย: ชื่อห้อง + ผู้เล่น */}
          <section>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="break-words font-display text-4xl leading-tight sm:text-5xl">{room.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {isHost ? (
                    <button
                      type="button"
                      onClick={togglePrivacy}
                      title={t('lobby.togglePrivacy')}
                      className="chip hover:border-gold active:scale-95"
                    >
                      <PrivacyIcon size={16} />
                      {privacyLabel}
                      <PencilIcon size={14} className="text-felt-300" />
                    </button>
                  ) : (
                    <span className="chip">
                      <PrivacyIcon size={16} />
                      {privacyLabel}
                    </span>
                  )}
                  <span className="text-base text-felt-200">
                    {t('lobby.playersCount', { n: players.length, max: room.maxPlayers })}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <SoundToggle />
                <LangSwitch />
                <Button variant="ghost" size="md" icon={<LogoutIcon size={18} />} onClick={leave} className="!px-3">
                  <span className="hidden sm:inline">{t('common.leave')}</span>
                </Button>
              </div>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {slots.map((player, i) =>
                player ? (
                  <PlayerCard key={player.id} player={player} index={i} isMe={player.id === me?.id} />
                ) : (
                  <EmptySlot key={`empty-${i}`} />
                ),
              )}
            </div>
          </section>

          {/* ขวา: รหัสห้อง + กติกา + ปุ่มเริ่ม */}
          <aside className="space-y-5">
            <RoomCodeBadge code={room.code} />
            <button
              onClick={copyLink}
              className="flex w-full items-center justify-center gap-2 py-1 text-base font-semibold text-felt-200 underline decoration-felt-500 decoration-2 underline-offset-4 hover:text-paper"
            >
              <CopyIcon size={16} />
              {t('lobby.copyLink')}
            </button>

            <div className="panel space-y-6 p-5 sm:p-6">
              <div className="paper-flat rule-lines p-4" style={{ backgroundSize: '100% 1.75rem' }}>
                <p className="label-ink">{t('lobby.rules')}</p>
                <p className="mt-1.5 text-base leading-7 text-ink">{t('lobby.rulesText')}</p>
              </div>

              <div className="flex items-end justify-between gap-4">
                <p className="label">{t('lobby.playersReady')}</p>
                <p className="font-display leading-none">
                  <span className="text-5xl text-mint">{readyCount}</span>
                  <span className="mx-1 text-3xl text-felt-500">/</span>
                  <span className="text-3xl text-felt-200">{players.length}</span>
                </p>
              </div>

              {!isHost && (
                <Button
                  variant={me?.ready ? 'secondary' : 'primary'}
                  className="w-full"
                  onClick={() => act('TOGGLE_READY')}
                  icon={me?.ready ? null : <CheckIcon size={22} />}
                >
                  {me?.ready ? t('lobby.readyCancel') : t('lobby.ready')}
                </Button>
              )}

              {isHost && (
                <Button className="w-full" disabled={!canStart} icon={<PlayIcon size={20} />} onClick={start}>
                  {t('lobby.start')}
                </Button>
              )}

              <p className={cx('text-center text-base', canStart ? 'font-semibold text-mint' : 'text-felt-300')}>{hint}</p>
            </div>

            <ChatPanel variant="inline" />
          </aside>
        </div>
      </main>
      <Toast message={toast} />
    </div>
  )
}

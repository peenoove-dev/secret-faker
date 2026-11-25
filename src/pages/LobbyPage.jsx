import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Background from '../components/Background'
import Button from '../components/Button'
import ConnectionBanner from '../components/ConnectionBanner'
import LangSwitch from '../components/LangSwitch'
import Loading from '../components/Loading'
import RoomCodeBadge from '../components/RoomCodeBadge'
import { EmptySlot, PlayerCard } from '../components/PlayerCard'
import Toast from '../components/Toast'
import { LogoutIcon, PlayIcon } from '../components/Icons'
import { useRoom } from '../context/RoomContext'
import { useLang } from '../i18n/LanguageContext'
import { MIN_PLAYERS_TO_START } from '../../shared/gameLogic.js'
import { cx } from '../lib/utils'

export default function LobbyPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { session, room, me, isHost, act, leaveRoom } = useRoom()
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
    if (!r.ok) setToast(t(`err.${r.error}`))
  }

  return (
    <div className="relative min-h-screen">
      <Background />
      <ConnectionBanner />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
          {/* Left: title + players */}
          <section className="animate-fade-up">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="break-words font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  {room.name}
                </h1>
                <div className="mt-3 flex items-center gap-3 text-sm text-slate-400">
                  <span className="rounded-full border border-neon-purple/40 bg-neon-purple/15 px-3 py-1 text-xs font-bold text-purple-300">
                    {room.isPrivate ? t('lobby.private') : t('lobby.public')}
                  </span>
                  <span>{t('lobby.playersCount', { n: players.length, max: room.maxPlayers })}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <LangSwitch />
                <Button variant="ghost" size="md" icon={<LogoutIcon width={18} height={18} />} onClick={leave}>
                  <span className="hidden sm:inline">{t('common.leave')}</span>
                </Button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {slots.map((player, i) =>
                player ? (
                  <PlayerCard key={player.id} player={player} index={i} isMe={player.id === me?.id} />
                ) : (
                  <EmptySlot key={`empty-${i}`} index={i} />
                ),
              )}
            </div>
          </section>

          {/* Right: code + rules + actions */}
          <aside className="space-y-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
            <RoomCodeBadge code={room.code} />
            <button
              onClick={copyLink}
              className="w-full text-center text-sm font-medium text-slate-400 underline-offset-4 transition hover:text-neon-blue hover:underline"
            >
              {t('lobby.copyLink')}
            </button>

            <div className="card space-y-6 p-5 sm:p-6">
              <div className="rounded-2xl border border-white/5 bg-ink-900/70 p-4">
                <p className="label-tiny !text-[9px]">{t('lobby.rules')}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{t('lobby.rulesText')}</p>
              </div>

              <div className="text-center">
                <p className="font-display text-4xl font-bold">
                  <span className="text-neon-green">{readyCount}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-neon-green">{players.length}</span>
                </p>
                <p className="label-tiny mt-1">{t('lobby.playersReady')}</p>
              </div>

              {!isHost && (
                <button
                  onClick={() => act('TOGGLE_READY')}
                  className={cx(
                    'h-12 w-full rounded-2xl font-display text-base font-bold transition active:scale-[0.97]',
                    me?.ready
                      ? 'bg-ink-700 text-slate-300 hover:bg-ink-600'
                      : 'bg-neon-green text-ink-950 shadow-[0_0_24px_rgba(52,211,153,0.4)] hover:brightness-110',
                  )}
                >
                  {me?.ready ? t('lobby.readyCancel') : t('lobby.ready')}
                </button>
              )}

              {isHost && (
                <div>
                  <Button
                    className="w-full"
                    disabled={!canStart}
                    icon={<PlayIcon width={18} height={18} />}
                    onClick={start}
                  >
                    {t('lobby.start')}
                  </Button>
                  <p
                    className={cx(
                      'mt-4 text-center font-mono text-[10px] font-bold uppercase tracking-wider',
                      canStart ? 'text-neon-green' : 'text-slate-500',
                    )}
                  >
                    {hint}
                  </p>
                </div>
              )}

              {!isHost && <p className="text-center text-xs text-slate-500">{hint}</p>}
            </div>
          </aside>
        </div>
      </main>
      <Toast message={toast} />
    </div>
  )
}

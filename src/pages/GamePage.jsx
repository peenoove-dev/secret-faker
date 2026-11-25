import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Background from '../components/Background'
import Button from '../components/Button'
import ConnectionBanner from '../components/ConnectionBanner'
import LangSwitch from '../components/LangSwitch'
import Loading from '../components/Loading'
import Toast from '../components/Toast'
import { LogoutIcon } from '../components/Icons'
import RevealPhase from '../components/game/RevealPhase'
import CluePhase from '../components/game/CluePhase'
import VotePhase from '../components/game/VotePhase'
import EliminationPhase from '../components/game/EliminationPhase'
import GameOverPhase from '../components/game/GameOverPhase'
import { useRoom } from '../context/RoomContext'
import { useLang } from '../i18n/LanguageContext'
import { getPlayer } from '../../shared/gameLogic.js'
import { cx } from '../lib/utils'

export default function GamePage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { session, room, game, isHost, act, leaveRoom } = useRoom()
  const { t, loc } = useLang()
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  if (!session || session.code !== code.toUpperCase()) return <Navigate to="/" replace />
  if (!room) return <Loading />
  if (!game) return <Navigate to={`/lobby/${room.code}`} replace />

  const me = getPlayer(game, game.meId)
  const isFaker = me.role === 'imposter'
  const showRole = game.phase !== 'reveal'

  // ทุกคำสั่งไปเซิร์ฟเวอร์ ถ้าไม่สำเร็จให้แจ้งเตือน (ยกเว้นส่งคำใบ้ซึ่งแสดงที่ช่องกรอกเอง)
  const send = async (type, extra) => {
    const r = await act(type, extra)
    if (!r.ok && type !== 'SUBMIT_CLUE') setToast(t(`err.${r.error}`))
    return r
  }

  const leave = () => {
    leaveRoom()
    navigate('/')
  }

  return (
    <div className="relative min-h-screen">
      <Background />
      <ConnectionBanner />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        {/* top bar */}
        <header className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold leading-none">
              SECRET <span className="text-gradient">FAKER</span>
            </p>
            <p className="label-tiny mt-1.5">
              {t('game.round', { n: game.round })} · {loc(game.category)}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {showRole && (
              <span
                className={cx(
                  'rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider',
                  isFaker
                    ? 'border-neon-pink/40 bg-neon-pink/10 text-neon-pink'
                    : 'border-neon-blue/40 bg-neon-blue/10 text-neon-blue',
                )}
              >
                {isFaker ? t('game.fakerNoWord') : t('game.word', { word: loc(game.word) })}
              </span>
            )}
            <LangSwitch />
            <Button variant="ghost" size="md" className="!px-3" onClick={leave} aria-label={t('game.leaveAria')}>
              <LogoutIcon width={18} height={18} />
            </Button>
          </div>
        </header>

        {/* key forces a fresh mount (and animation) on each phase / round */}
        <div key={`${game.phase}-${game.round}`}>
          {game.phase === 'reveal' && <RevealPhase game={game} act={send} />}
          {game.phase === 'clues' && <CluePhase game={game} act={send} />}
          {game.phase === 'voting' && <VotePhase game={game} act={send} />}
          {game.phase === 'elimination' && <EliminationPhase game={game} act={send} isHost={isHost} />}
          {game.phase === 'gameover' && (
            <GameOverPhase
              game={game}
              isHost={isHost}
              onPlayAgain={() => send('PLAY_AGAIN')}
              onBackToLobby={() => send('BACK_TO_LOBBY')}
            />
          )}
        </div>
      </main>
      <Toast message={toast} />
    </div>
  )
}

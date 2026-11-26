import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Background from '../components/Background'
import Button from '../components/Button'
import ConnectionBanner from '../components/ConnectionBanner'
import LangSwitch from '../components/LangSwitch'
import SoundToggle from '../components/SoundToggle'
import ChatPanel from '../components/ChatPanel'
import Loading from '../components/Loading'
import Toast from '../components/Toast'
import { LogoutIcon } from '../components/Icons'
import { LogoMark } from '../components/Logo'
import RevealPhase from '../components/game/RevealPhase'
import CluePhase from '../components/game/CluePhase'
import DrawPhase from '../components/game/DrawPhase'
import VotePhase from '../components/game/VotePhase'
import EliminationPhase from '../components/game/EliminationPhase'
import GameOverPhase from '../components/game/GameOverPhase'
import CreatorPanel from '../components/game/CreatorPanel'
import { useRoom } from '../context/RoomContext'
import { useLang } from '../i18n/LanguageContext'
import { didIWin, getPlayer } from '../../shared/gameLogic.js'
import { cx } from '../lib/utils'
import { sfx, vibrate } from '../lib/sound'

/** เสียงประกอบเกม: ตอบสนองการเปลี่ยนเฟส / ถึงตาเรา / มีคนส่งคำใบ้ / มีคนโหวต */
function GameSfx({ game }) {
  const prev = useRef(null)
  useEffect(() => {
    const speakerId = game.turnOrder[game.turnIndex]
    const cur = {
      phase: game.phase,
      round: game.round,
      clues: game.mode === 'draw' ? game.strokes.length : game.clues.length, // เสียงตอนมีคนส่งคำใบ้/วาดเส้น
      votes: game.voteCount,
      myTurn: game.phase === 'clues' && speakerId === game.meId,
    }
    const p = prev.current
    prev.current = cur
    if (!p) {
      if (cur.phase === 'reveal') sfx.reveal()
      return
    }
    if (cur.phase !== p.phase || cur.round !== p.round) {
      if (cur.phase === 'reveal') sfx.reveal()
      else if (cur.phase === 'clues' || cur.phase === 'voting') sfx.phase()
      else if (cur.phase === 'elimination') {
        const out = game.lastResult && getPlayer(game, game.lastResult.eliminatedId)
        if (out?.role === 'imposter') sfx.caught()
        else sfx.eliminated()
      } else if (cur.phase === 'gameover') {
        if (didIWin(game)) sfx.win()
        else sfx.lose()
      }
    } else {
      if (cur.clues > p.clues) sfx.clue()
      if (cur.votes > p.votes) sfx.vote()
    }
    if (cur.myTurn && !p.myTurn) sfx.yourTurn()
  }, [game])
  return null
}

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
    if (!r.ok && type !== 'SUBMIT_CLUE') {
      sfx.error()
      setToast(t(`err.${r.error}`))
    }
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
      <GameSfx game={game} />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        {/* top bar */}
        <header className="mb-8 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark size={40} />
            <div className="min-w-0">
              <p className="truncate font-display text-xl leading-tight">{loc(game.category)}</p>
              <p className="text-[15px] leading-tight text-felt-300">{t('game.round', { n: game.round })}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <SoundToggle />
            <LangSwitch />
            <Button variant="ghost" size="md" className="!px-3" onClick={leave} aria-label={t('game.leaveAria')}>
              <LogoutIcon size={18} />
            </Button>
          </div>
        </header>

        {showRole && (
          <p
            className={cx(
              '-mt-3 mb-6 inline-block rounded-lg border-2 px-3 py-1 text-base font-bold shadow-card-sm',
              isFaker ? 'border-ember-deep bg-ember text-paper' : 'border-mint-deep bg-mint text-ink',
            )}
          >
            {isFaker ? t('game.fakerNoWord') : t('game.word', { word: loc(game.word) })}
          </p>
        )}

        {/* key forces a fresh mount (and animation) on each phase / round */}
        <div key={`${game.phase}-${game.round}`}>
          {game.phase === 'reveal' && <RevealPhase game={game} act={send} />}
          {game.phase === 'clues' && (game.mode === 'draw' ? <DrawPhase game={game} act={send} /> : <CluePhase game={game} act={send} />)}
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
      <ChatPanel variant="floating" canWrite={me.alive || game.phase === 'gameover'} />
      <CreatorPanel game={game} act={send} />
      <Toast message={toast} />
    </div>
  )
}

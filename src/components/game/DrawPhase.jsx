import { useEffect, useState } from 'react'
import Button from '../Button'
import DrawingBoard, { ColorDot, ColorLegend } from './DrawingBoard'
import SpyHint from './SpyHint'
import { BRUSH_WIDTHS, drawColor } from '../../../shared/drawing.js'
import { getPlayer } from '../../../shared/gameLogic.js'
import { useLang } from '../../i18n/LanguageContext'
import useCountdown from '../../lib/useCountdown'
import { cx } from '../../lib/utils'
import { sfx } from '../../lib/sound'

const BRUSH_LABELS = ['draw.brushThin', 'draw.brushMid', 'draw.brushThick']

/** เฟสวาดรูป (โหมดวาดรูป): ผลัดกันวาดคนละหนึ่งเส้นบนผืนผ้าใบเดียวกัน */
export default function DrawPhase({ game, act }) {
  const { t, loc } = useLang()
  const speakerId = game.turnOrder[game.turnIndex]
  const speaker = getPlayer(game, speakerId)
  const myTurn = speakerId === game.meId
  const me = getPlayer(game, game.meId)
  const myColor = drawColor(me.colorIndex)
  const [brush, setBrush] = useState(1)
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)
  const secs = useCountdown(game.turnDeadline)

  // เปลี่ยนตา (รวมถึงโดนข้ามเพราะหมดเวลา) → ทิ้งเส้นที่ยังไม่ได้ยืนยัน
  useEffect(() => {
    setPending(null)
  }, [game.turnIndex])

  useEffect(() => {
    if (myTurn && secs !== null && secs > 0 && secs <= 5) sfx.tick()
  }, [secs, myTurn])

  const confirm = async () => {
    if (!pending || busy) return
    setBusy(true)
    const r = await act('DRAW_STROKE', { stroke: pending })
    setBusy(false)
    if (r.ok) setPending(null)
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <h2 className="font-display text-3xl leading-tight">{t('draw.title')}</h2>
      <p className="mt-1 text-base text-felt-200">{t('draw.desc')}</p>

      {game.candidates && (
        <div className="paper-flat mt-4 p-4">
          <SpyHint candidates={game.candidates} compact />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="label">{t('draw.lineOf', { a: Math.min(game.turnIndex + 1, game.turnOrder.length), b: game.turnOrder.length })}</p>
        {secs !== null && (
          <p className={cx('text-base font-bold tabular-nums', secs <= 5 ? 'text-ember-soft' : 'text-felt-200')}>
            {t('draw.time', { s: secs })}
          </p>
        )}
      </div>

      <ColorLegend game={game} activeId={speakerId} className="mt-2" />

      <div className="mt-4">
        <DrawingBoard
          game={game}
          canDraw={myTurn}
          pending={pending}
          brush={brush}
          onFinish={(pts) => setPending({ pts, w: brush })}
        />
      </div>

      <div className="mt-5">
        {myTurn ? (
          <div className="panel space-y-4 border-gold p-4 sm:p-5">
            <div>
              <p className="flex items-center gap-2 font-display text-xl leading-tight">
                <ColorDot player={me} className="!h-5 !w-5" />
                {t('draw.yourTurn')}
              </p>
              <p className="mt-1 text-base text-felt-200">{t('draw.yourColor', { color: loc(myColor) })}</p>
              <p className="mt-1 text-[15px] text-felt-300">{t('draw.how')}</p>
            </div>

            <div>
              <span className="label mb-1.5 block">{t('draw.brush')}</span>
              <div className="flex gap-2">
                {BRUSH_WIDTHS.map((w, i) => (
                  <button
                    key={w}
                    type="button"
                    aria-pressed={brush === i}
                    aria-label={t(BRUSH_LABELS[i])}
                    onClick={() => {
                      sfx.click()
                      setBrush(i)
                    }}
                    className={cx(
                      'flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border-2 text-base font-bold transition-colors',
                      brush === i ? 'border-gold bg-gold text-ink' : 'border-felt-600 bg-felt-950 text-felt-200 hover:bg-felt-800',
                    )}
                  >
                    <span
                      aria-hidden
                      className="rounded-full"
                      style={{ width: 6 + i * 5, height: 6 + i * 5, background: myColor.hex }}
                    />
                    {t(BRUSH_LABELS[i])}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" disabled={!pending || busy} onClick={() => setPending(null)}>
                {t('draw.clear')}
              </Button>
              <Button className="flex-[1.6]" disabled={!pending || busy} onClick={confirm}>
                {t('draw.confirm')}
              </Button>
            </div>
          </div>
        ) : speaker ? (
          <p className="flex items-center justify-center gap-2 py-3 text-center text-base text-felt-200">
            <ColorDot player={speaker} className="!h-4 !w-4" />
            <span className="font-bold text-paper">
              {t('draw.waiting', { name: speaker.name, color: loc(drawColor(speaker.colorIndex)) })}
            </span>
            <span className="animate-blink">…</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

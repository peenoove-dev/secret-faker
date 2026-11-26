import { useId, useRef, useState } from 'react'
import {
  BRUSH_WIDTHS,
  CANVAS_SIZE,
  MAX_STROKE_POINTS,
  MIN_POINT_GAP,
  drawColor,
  strokePath,
} from '../../../shared/drawing.js'
import { useLang } from '../../i18n/LanguageContext'
import { cx } from '../../lib/utils'

const clamp = (n) => Math.min(CANVAS_SIZE, Math.max(0, n))

/** ป้ายสีของผู้เล่น: จุดสี + ชื่อ (ชื่อสีไว้ให้คนตาบอดสีด้วย) */
export function ColorDot({ player, className }) {
  const c = drawColor(player.colorIndex)
  return (
    <span
      aria-hidden
      className={cx('inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-ink/50', className)}
      style={{ background: c.hex }}
    />
  )
}

export function ColorLegend({ game, activeId, className }) {
  const { t, loc } = useLang()
  // เรียงตามลำดับที่ผลัดกันวาด (คนที่ออกจากเกมไปแล้วก็ยังโชว์ เพราะเส้นของเขายังอยู่บนภาพ)
  const order = [...new Set([...game.turnOrder, ...game.strokes.map((s) => s.playerId), ...game.players.map((p) => p.id)])]
  const players = order.map((id) => game.players.find((p) => p.id === id)).filter(Boolean)
  return (
    <ul className={cx('flex flex-wrap gap-2', className)}>
      {players.map((p) => (
        <li
          key={p.id}
          className={cx(
            'chip',
            p.id === activeId && '!border-gold !bg-felt-700 ring-2 ring-gold/60',
            !p.alive && 'opacity-50',
          )}
        >
          <ColorDot player={p} />
          <span className="max-w-[7rem] truncate">{p.id === game.meId ? t('clue.you') : p.name}</span>
          <span className="text-felt-300">{loc(drawColor(p.colorIndex))}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * ผืนผ้าใบวาดรูป (SVG สี่เหลี่ยมจัตุรัส พิกัด 0–1000 ไม่ผูกกับขนาดหน้าจอ)
 *  - แสดงทุกเส้นของเกม แต่ละเส้นสีตามผู้เล่น
 *  - canDraw: เปิดให้วาดได้ (ตาของเรา) — ลากแล้วยกนิ้ว = จบเส้น เรียก onFinish(points)
 *  - pending: เส้นที่เราวาดแล้วแต่ยังไม่ยืนยัน (แสดงด้วยสีของเรา)
 */
export default function DrawingBoard({ game, canDraw = false, pending = null, brush = 1, onFinish, className }) {
  const gid = useId().replace(/:/g, '')
  const svgRef = useRef(null)
  const ptsRef = useRef(null)
  const [live, setLive] = useState(null)
  const knownCount = useRef(game.strokes.length) // เส้นที่มีอยู่ตอนเปิดหน้า ไม่ต้องเล่นแอนิเมชัน

  const me = game.players.find((p) => p.id === game.meId)
  const colorOf = (id) => drawColor(game.players.find((p) => p.id === id)?.colorIndex ?? 0).hex
  const myHex = drawColor(me?.colorIndex ?? 0).hex

  const toPoint = (e) => {
    const r = svgRef.current.getBoundingClientRect()
    return [
      Math.round(clamp(((e.clientX - r.left) / r.width) * CANVAS_SIZE)),
      Math.round(clamp(((e.clientY - r.top) / r.height) * CANVAS_SIZE)),
    ]
  }

  const finish = () => {
    const pts = ptsRef.current
    ptsRef.current = null
    setLive(null)
    if (pts?.length) onFinish?.(pts)
  }

  const down = (e) => {
    if (!canDraw || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* บางเบราว์เซอร์ไม่รองรับ — ข้ามได้ */
    }
    ptsRef.current = [toPoint(e)]
    setLive([...ptsRef.current])
  }

  const move = (e) => {
    const pts = ptsRef.current
    if (!pts) return
    const p = toPoint(e)
    const last = pts[pts.length - 1]
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < MIN_POINT_GAP) return
    pts.push(p)
    setLive([...pts])
    if (pts.length >= MAX_STROKE_POINTS) finish() // เส้นยาวเกินกำหนด → จบเส้นให้เอง
  }

  const line = (pts, w, hex, extra) => (
    <path
      d={strokePath(pts)}
      fill="none"
      stroke={hex}
      strokeWidth={BRUSH_WIDTHS[w] ?? BRUSH_WIDTHS[1]}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...extra}
    />
  )

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      role="img"
      aria-label="canvas"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={finish}
      style={{ touchAction: canDraw ? 'none' : 'auto', aspectRatio: '1 / 1' }}
      className={cx(
        'block w-full select-none rounded-xl bg-paper',
        canDraw ? 'cursor-crosshair ring-4 ring-gold ring-offset-2 ring-offset-felt-900' : 'shadow-card',
        className,
      )}
    >
      <defs>
        <pattern id={`dots-${gid}`} width="50" height="50" patternUnits="userSpaceOnUse">
          <circle cx="25" cy="25" r="1.6" fill="#2a1f1a" fillOpacity="0.16" />
        </pattern>
      </defs>
      <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill={`url(#dots-${gid})`} />

      {game.strokes.map((s, i) => {
        const animate = i >= knownCount.current && s.playerId !== game.meId
        return (
          <g key={i}>
            {line(s.pts, s.w, colorOf(s.playerId), { pathLength: 1, className: animate ? 'stroke-anim' : undefined })}
          </g>
        )
      })}
      {pending && !live && <g>{line(pending.pts, pending.w, myHex)}</g>}
      {live && <g>{line(live, brush, myHex)}</g>}
    </svg>
  )
}

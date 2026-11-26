import { useEffect, useRef, useState } from 'react'
import { useRoom } from '../context/RoomContext'
import { useLang } from '../i18n/LanguageContext'
import { sfx } from '../lib/sound'
import { cx } from '../lib/utils'
import { ChatIcon, CloseIcon } from './Icons'

const QUICK = ['q1', 'q2', 'q3', 'q4'] // ข้อความด่วน (ดูคำแปลที่ chat.q1 – chat.q4)

const hhmm = (ts) => {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function Messages({ chat, meId, t }) {
  const boxRef = useRef(null)
  const stick = useRef(true)

  // เลื่อนลงล่างสุดเมื่อมีข้อความใหม่ — ยกเว้นผู้ใช้เลื่อนขึ้นไปอ่านย้อนหลังอยู่
  useEffect(() => {
    const el = boxRef.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [chat])

  return (
    <div
      ref={boxRef}
      onScroll={(e) => {
        const el = e.currentTarget
        stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
      }}
      className="flex-1 space-y-2 overflow-y-auto px-3 py-3"
      aria-live="polite"
    >
      {chat.length === 0 && <p className="py-6 text-center text-[15px] text-felt-300">{t('chat.empty')}</p>}
      {chat.map((m) =>
        m.sys ? (
          <p key={m.id} className="animate-slide-in text-center text-sm text-felt-300">
            {t(`chat.sys.${m.sys}`, { name: m.name })}
          </p>
        ) : (
          <div key={m.id} className={cx('flex animate-slide-in flex-col', m.pid === meId ? 'items-end' : 'items-start')}>
            <span className="mb-0.5 px-1 text-sm text-felt-300">
              {m.pid === meId ? t('common.you') : m.name} <span className="text-felt-500">{hhmm(m.ts)}</span>
            </span>
            <span
              className={cx(
                'max-w-[85%] break-words rounded-xl px-3 py-1.5 text-base leading-snug',
                m.pid === meId ? 'rounded-br-sm bg-gold text-ink' : 'rounded-bl-sm bg-felt-700 text-paper',
              )}
            >
              {m.text}
            </span>
          </div>
        ),
      )}
    </div>
  )
}

function Composer({ canWrite, onSend, t }) {
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async (value) => {
    const v = value.trim()
    if (!v || busy) return
    setBusy(true)
    const r = await onSend(v)
    setBusy(false)
    if (!r.ok) {
      sfx.error()
      setErr(t(`err.${r.error}`))
      return
    }
    sfx.send()
    setText('')
    setErr('')
  }

  if (!canWrite) {
    return <p className="border-t-2 border-felt-600 px-3 py-3 text-center text-[15px] text-felt-300">{t('chat.muted')}</p>
  }
  return (
    <div className="border-t-2 border-felt-600 p-2">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {QUICK.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => send(t(`chat.${k}`))}
            className="rounded-full border-2 border-felt-600 bg-felt-950 px-3 py-0.5 text-[15px] font-semibold text-felt-200 hover:border-felt-500 hover:text-paper active:scale-95"
          >
            {t(`chat.${k}`)}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(text)
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          maxLength={200}
          onChange={(e) => {
            setText(e.target.value)
            setErr('')
          }}
          placeholder={t('chat.placeholder')}
          aria-label={t('chat.placeholder')}
          enterKeyHint="send"
          className="h-10 min-w-0 flex-1 rounded-lg border-2 border-paper-edge bg-paper px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-gold"
        />
        <button
          type="submit"
          disabled={!text.trim() || busy}
          className="h-10 rounded-lg bg-gold px-4 text-base font-bold text-ink shadow-[0_2px_0_0_#8a5f0b] active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:bg-felt-700 disabled:text-felt-300 disabled:shadow-none"
        >
          {t('chat.send')}
        </button>
      </form>
      {err && <p className="mt-1.5 text-sm font-semibold text-ember-soft">{err}</p>}
    </div>
  )
}

/**
 * แชตห้อง
 *  - variant="inline": การ์ดในห้องรอ
 *  - variant="floating": ปุ่มลอยมุมซ้ายล่าง (ในเกม) พร้อมตัวเลขข้อความที่ยังไม่อ่าน
 */
export default function ChatPanel({ variant = 'inline', canWrite = true, className }) {
  const { chat, me, sendChat } = useRoom()
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(0) // id ข้อความล่าสุดที่เปิดอ่านแล้ว
  const lastId = chat.length ? chat[chat.length - 1].id : 0
  const prevId = useRef(lastId)
  const meId = me?.id

  // เสียงเตือนเมื่อมีข้อความจากคนอื่น
  useEffect(() => {
    const fresh = chat.filter((m) => m.id > prevId.current)
    prevId.current = lastId
    if (fresh.some((m) => !m.sys && m.pid !== meId)) sfx.chat()
  }, [chat, lastId, meId])

  useEffect(() => {
    if (variant === 'inline' || open) setSeen(lastId)
  }, [variant, open, lastId])

  const unread = variant === 'floating' && !open ? chat.filter((m) => !m.sys && m.id > seen && m.pid !== meId).length : 0

  if (variant === 'inline') {
    return (
      <section className={cx('panel flex h-[22rem] flex-col overflow-hidden', className)}>
        <p className="label border-b-2 border-felt-600 px-4 py-2.5">{t('chat.title')}</p>
        <Messages chat={chat} meId={meId} t={t} />
        <Composer canWrite={canWrite} onSend={sendChat} t={t} />
      </section>
    )
  }

  return (
    <div className={cx('fixed bottom-4 left-4 z-40 w-[min(92vw,22rem)]', className)}>
      {open ? (
        <section className="panel flex h-[min(24rem,60vh)] flex-col overflow-hidden shadow-card-lg">
          <div className="flex items-center justify-between border-b-2 border-felt-600 px-4 py-2.5">
            <p className="label">{t('chat.title')}</p>
            <button onClick={() => setOpen(false)} className="text-felt-300 hover:text-paper" aria-label={t('chat.close')}>
              <CloseIcon size={18} />
            </button>
          </div>
          <Messages chat={chat} meId={meId} t={t} />
          <Composer canWrite={canWrite} onSend={sendChat} t={t} />
        </section>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="paper relative flex items-center gap-2 rounded-full px-4 py-2 text-base font-bold hover:bg-paper-dim"
        >
          <ChatIcon size={18} /> {t('chat.title')}
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 animate-ring-pulse place-items-center rounded-full bg-ember px-1 text-xs font-bold text-paper">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}
    </div>
  )
}

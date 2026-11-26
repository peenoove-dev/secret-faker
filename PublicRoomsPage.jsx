import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { EmptyCardIcon, PlusIcon } from '../components/Icons'
import { useRoom } from '../context/RoomContext'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { avatarUrl, get } from '../lib/api'
import { colorFromText, cx, initial } from '../lib/utils'

const REFRESH_MS = 4000

function HostAvatar({ room }) {
  return (
    <div
      className={cx(
        'relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-ink font-display text-xl text-ink',
        colorFromText(room.hostName),
      )}
    >
      {room.hostAvatarV ? (
        <img
          src={avatarUrl(room.code, room.hostId, room.hostAvatarV)}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        initial(room.hostName)
      )}
    </div>
  )
}

/** ค้นหาห้องสาธารณะ: รายชื่อห้องที่ยังเปิดรับและยังไม่เต็ม อัปเดตเองทุก 4 วินาที */
export default function PublicRoomsPage() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { account } = useAuth()
  const { joinRoom } = useRoom()

  const [rooms, setRooms] = useState(null) // null = กำลังโหลด
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [nickname, setNickname] = useState('')
  const [busyCode, setBusyCode] = useState('')
  const [error, setError] = useState({}) // { code?: ข้อความ, nickname?: ข้อความ }

  const load = useCallback(async () => {
    const r = await get('/api/rooms/public')
    if (r.ok) {
      setRooms(r.rooms)
      setFailed(false)
    } else {
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    load()
    const i = setInterval(() => document.visibilityState === 'visible' && load(), REFRESH_MS)
    return () => clearInterval(i)
  }, [load])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!rooms) return []
    return q ? rooms.filter((r) => r.name.toLowerCase().includes(q) || r.hostName.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)) : rooms
  }, [rooms, query])

  const join = async (room) => {
    const name = account ? account.displayName : nickname.trim()
    if (!name) {
      setError({ nickname: t('create.nicknameErr') })
      return
    }
    setBusyCode(room.code)
    setError({})
    const r = await joinRoom({ nickname: name, code: room.code })
    setBusyCode('')
    if (!r.ok) {
      if (r.error === 'nameTaken' || r.error === 'nameEmpty') setError({ nickname: t(`err.${r.error}`) })
      else setError({ code: room.code, msg: t(`err.${r.error}`) })
      load() // ห้องอาจเต็ม/เริ่มเกมแล้ว → รีเฟรชรายการ
      return
    }
    navigate(`/lobby/${r.code}`)
  }

  return (
    <PageShell backTo="/" maxWidth="max-w-xl">
      <div>
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl leading-tight">{t('pub.title')}</h1>
            <p className="mt-1 text-base text-felt-200">{t('pub.subtitle')}</p>
          </div>
          <span className="mb-1.5 flex shrink-0 items-center gap-2 text-base font-semibold text-felt-200">
            <span className="h-2.5 w-2.5 animate-blink rounded-full bg-mint" />
            {t('pub.live')}
          </span>
        </div>

        <div className="panel space-y-4 p-5">
          {!account && (
            <TextField
              label={t('join.nickname')}
              placeholder={t('join.nicknamePh')}
              maxLength={16}
              value={nickname}
              error={error.nickname}
              onChange={(e) => {
                setNickname(e.target.value)
                setError({})
              }}
            />
          )}
          {account && (
            <p className="rounded-lg border-2 border-felt-600 bg-felt-950 px-4 py-3 text-base text-felt-200">
              {t('auth.playingAs')} <b className="text-paper">{account.displayName}</b>
              {error.nickname && <span className="mt-2 block text-[15px] font-semibold text-ember-soft">{error.nickname}</span>}
            </p>
          )}
          <TextField
            label={t('pub.search')}
            placeholder={t('pub.searchPh')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mt-6 space-y-4">
          {rooms === null && !failed && <p className="py-10 text-center text-base text-felt-300">{t('pub.loading')}</p>}
          {failed && (
            <p className="rounded-lg border-2 border-gold bg-gold/10 p-3 text-center text-base font-semibold text-gold-soft">
              {t('pub.failed')}
            </p>
          )}

          {rooms && shown.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-felt-600 p-8 text-center">
              <EmptyCardIcon size={48} className="mx-auto text-felt-300" />
              <p className="mt-3 font-display text-2xl leading-tight">{query ? t('pub.noMatch') : t('pub.empty')}</p>
              <p className="mt-1 text-base text-felt-300">{t('pub.emptyHint')}</p>
              <Link to="/create" className="mt-5 block">
                <Button className="w-full" icon={<PlusIcon size={22} />}>
                  {t('home.create')}
                </Button>
              </Link>
            </div>
          )}

          {shown.map((r, i) => (
            <div key={r.code} className={cx('paper animate-pop-in p-4', i % 2 ? 'rotate-[0.4deg]' : '-rotate-[0.4deg]')}>
              <div className="flex items-center gap-3">
                <HostAvatar room={r} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl leading-tight">{r.name}</p>
                  <p className="truncate text-base text-ink-soft">
                    {t('pub.host', { name: r.hostName })}
                    <span className="ml-2 rounded bg-ink/10 px-1.5 font-display text-sm tracking-widest">{r.code}</span>
                  </p>
                  <div className="mt-2 flex items-center gap-1" aria-label={t('lobby.playersCount', { n: r.count, max: r.maxPlayers })}>
                    {Array.from({ length: r.maxPlayers }, (_, k) => (
                      <span key={k} className={cx('h-2 flex-1 rounded-sm', k < r.count ? 'bg-mint-deep' : 'bg-ink/15')} />
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-base font-bold text-ink-soft">
                    {t('lobby.playersCount', { n: r.count, max: r.maxPlayers })}
                  </span>
                  <Button size="md" className="!h-10 !px-4" disabled={busyCode === r.code} onClick={() => join(r)}>
                    {busyCode === r.code ? '…' : t('pub.join')}
                  </Button>
                </div>
              </div>
              {error.code === r.code && <p className="mt-2 text-[15px] font-semibold text-ember-deep">{error.msg}</p>}
            </div>
          ))}
        </div>

        <p className="mt-7 text-center text-base text-felt-300">
          {t('pub.havecode')}{' '}
          <Link to="/join" className="font-bold text-gold underline decoration-2 underline-offset-4 hover:text-gold-soft">
            {t('home.join')}
          </Link>
        </p>
      </div>
    </PageShell>
  )
}

import { Link, Navigate, useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Logo from '../components/Logo'
import Button from '../components/Button'
import { GlobeIcon, LoginIcon, MaskIcon, PlusIcon, SuitIcon, TrophyIcon } from '../components/Icons'
import { useLang } from '../i18n/LanguageContext'
import { useRoom } from '../context/RoomContext'
import { useAuth } from '../context/AuthContext'
import AccountAvatar from '../components/AccountAvatar'
import Loading from '../components/Loading'

/** พัดไพ่หน้าแรก: แจกไพ่ออกมาครั้งเดียวตอนเปิดหน้า มีใบเดียวที่หงายหน้า (ตัวปลอมแฝงอยู่ในกอง) */
function CardFan() {
  const cards = [-26, -13, 0, 13, 26]
  const faceUp = 3
  return (
    <div className="relative mx-auto h-[270px] w-full max-w-[340px] sm:h-[360px]" aria-hidden>
      {cards.map((rot, i) => {
        const up = i === faceUp
        return (
          <div
            key={rot}
            className={
              'absolute inset-x-0 bottom-3 mx-auto h-[166px] w-[118px] animate-deal sm:h-[220px] sm:w-[156px] ' +
              (up ? 'paper z-10 grid place-items-center text-ember' : 'card-back')
            }
            style={{
              transformOrigin: '50% 135%',
              '--rot': `${rot}deg`,
              '--dx': '0px',
              '--dy': '0px',
              animationDelay: `${i * 90}ms`,
              ...(up ? { boxShadow: '3px 4px 0 0 #04120f, inset 0 0 0 1px rgba(42,31,26,.1)' } : null),
            }}
          >
            {up && (
              <>
                <span className="absolute left-2.5 top-2 flex flex-col items-center font-display text-xl leading-none text-ink">
                  ?
                  <SuitIcon index={0} size={14} className="mt-1" />
                </span>
                <span className="absolute bottom-2 right-2.5 flex rotate-180 flex-col items-center font-display text-xl leading-none text-ink">
                  ?
                  <SuitIcon index={0} size={14} className="mt-1" />
                </span>
                <MaskIcon size={68} strokeWidth={1.6} />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { session, room, lostReason } = useRoom()
  const { account, ready, guest } = useAuth()

  const rejoin = () => navigate(room?.inGame ? `/game/${session.code}` : `/lobby/${session.code}`)

  if (!ready) return <Loading />
  if (!account && !guest) return <Navigate to="/login" replace />

  return (
    <PageShell maxWidth="max-w-5xl">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          {account ? (
            <Link
              to="/profile"
              className="mb-7 inline-flex items-center gap-3 rounded-full border-2 border-felt-600 bg-felt-800 py-1.5 pl-1.5 pr-5 hover:border-felt-500"
            >
              <AccountAvatar account={account} className="h-9 w-9 rounded-full text-base" />
              <span className="text-base font-bold">{account.displayName}</span>
              <span className="text-[15px] text-felt-300">{t('home.profile')}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="mb-7 inline-block text-base font-bold text-gold underline decoration-2 underline-offset-4 hover:text-gold-soft"
            >
              {t('home.login')}
            </Link>
          )}

          <Logo size="lg" />
          <p className="mt-6 max-w-sm text-xl leading-relaxed text-felt-200">{t('home.tagline')}</p>

          {lostReason && (
            <p className="mt-6 rounded-lg border-2 border-gold bg-gold/10 px-4 py-2 text-base font-semibold text-gold-soft">
              {t(`err.${lostReason}`)}
            </p>
          )}

          <div className="mt-9 flex max-w-md flex-col gap-4">
            <Button icon={<PlusIcon size={22} />} onClick={() => navigate('/create')}>
              {t('home.create')}
            </Button>
            <Button variant="paper" icon={<LoginIcon size={22} />} onClick={() => navigate('/join')}>
              {t('home.join')}
            </Button>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="secondary" size="md" icon={<GlobeIcon size={19} />} onClick={() => navigate('/rooms')}>
                {t('home.browse')}
              </Button>
              <Button variant="secondary" size="md" icon={<TrophyIcon size={19} />} onClick={() => navigate('/leaderboard')}>
                {t('home.leaderboard')}
              </Button>
            </div>
            {session && room && (
              <Button variant="secondary" onClick={rejoin} className="!justify-between">
                <span className="truncate">{room.name}</span>
                <span className="rounded-md bg-felt-950 px-2 py-0.5 font-display text-base tracking-widest text-gold">
                  {session.code}
                </span>
              </Button>
            )}
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-felt-300">
            {t('home.footer')
              .split('·')
              .map((part) => (
                <li key={part} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rotate-45 bg-felt-500" aria-hidden />
                  {part.trim()}
                </li>
              ))}
          </ul>
        </div>

        <CardFan />
      </div>
    </PageShell>
  )
}

import { Link, Navigate, useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Logo from '../components/Logo'
import Button from '../components/Button'
import { LoginIcon, PlusIcon } from '../components/Icons'
import { useLang } from '../i18n/LanguageContext'
import { useRoom } from '../context/RoomContext'
import { useAuth } from '../context/AuthContext'
import AccountAvatar from '../components/AccountAvatar'
import Loading from '../components/Loading'

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { session, room, lostReason } = useRoom()
  const { account, ready, guest } = useAuth()

  const rejoin = () => navigate(room?.inGame ? `/game/${session.code}` : `/lobby/${session.code}`)

  if (!ready) return <Loading />
  if (!account && !guest) return <Navigate to="/login" replace />

  return (
    <PageShell maxWidth="max-w-xl">
      <div className="flex flex-col items-center text-center animate-fade-up">
        {account ? (
          <Link
            to="/profile"
            className="mb-6 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-4 transition hover:border-neon-blue/60"
          >
            <AccountAvatar account={account} className="h-9 w-9 rounded-full text-sm" />
            <span className="text-sm font-bold">{account.displayName}</span>
            <span className="text-xs text-slate-500">{t('home.profile')}</span>
          </Link>
        ) : (
          <Link to="/login" className="mb-6 text-sm font-bold text-neon-blue underline-offset-4 hover:underline">
            {t('home.login')}
          </Link>
        )}
        <Logo size="lg" />
        <p className="mt-6 max-w-sm text-base text-slate-400 sm:text-lg">{t('home.tagline')}</p>

        {lostReason && (
          <p className="mt-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
            {t(`err.${lostReason}`)}
          </p>
        )}

        <div className="mt-10 flex w-full flex-col gap-4 sm:flex-row">
          <Button className="flex-1" icon={<PlusIcon />} onClick={() => navigate('/create')}>
            {t('home.create')}
          </Button>
          <Button className="flex-1" variant="secondary" icon={<LoginIcon />} onClick={() => navigate('/join')}>
            {t('home.join')}
          </Button>
        </div>

        {session && room && (
          <Button className="mt-4 w-full" variant="neon" onClick={rejoin}>
            {room.name} · {session.code}
          </Button>
        )}

        <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-600">
          {t('home.footer')}
        </p>
      </div>
    </PageShell>
  )
}

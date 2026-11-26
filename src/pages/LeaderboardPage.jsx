import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import AccountAvatar from '../components/AccountAvatar'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { get } from '../lib/api'
import { cx } from '../lib/utils'
import { MedalIcon, TrophyIcon } from '../components/Icons'

const TABS = ['points', 'wins', 'winRate', 'spyWins']

function metric(sort, r) {
  switch (sort) {
    case 'wins':
      return r.wins
    case 'spyWins':
      return r.spyWins
    case 'winRate':
      return `${Math.round((r.wins / r.played) * 100)}%`
    default:
      return r.points
  }
}

/** อันดับ 1–3 เป็นเหรียญทึบ (ทอง/เงิน/ทองแดง) ที่เหลือเป็นตัวเลขธรรมดา */
const RANK_STYLE = [
  'bg-gold border-gold-deep text-ink',
  'bg-paper-dim border-paper-edge text-ink',
  'bg-av-7 border-[#9a5a24] text-ink',
]

function Row({ r, sort, mine, t }) {
  return (
    <li
      className={cx(
        'flex items-center gap-3 px-3 py-2.5',
        mine && 'rounded-lg bg-gold/25 ring-2 ring-gold',
      )}
    >
      <span
        className={cx(
          'grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 font-display text-lg leading-none',
          r.rank <= 3 ? RANK_STYLE[r.rank - 1] : 'border-transparent text-ink-soft',
        )}
      >
        {r.rank}
      </span>
      <AccountAvatar account={r} className="h-10 w-10 rounded-lg text-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold leading-tight">
          {r.displayName}
          {mine && <span className="font-normal text-ink-soft"> ({t('common.you')})</span>}
        </p>
        <p className="flex items-center gap-2 truncate text-sm text-ink-soft">
          <span>{t('lb.level', { n: r.level })}</span>
          <span>{t('lb.games', { n: r.played })}</span>
          <span className="inline-flex items-center gap-1">
            <MedalIcon size={14} />
            {r.badges}
          </span>
        </p>
      </div>
      <span className="font-display text-2xl leading-none">{metric(sort, r)}</span>
    </li>
  )
}

/** ตารางอันดับ: คะแนนรวม / ชนะมากสุด / อัตราชนะ (ขั้นต่ำ 5 เกม) / ชนะในบทบาทตัวปลอม */
export default function LeaderboardPage() {
  const { t } = useLang()
  const { token, account } = useAuth()
  const [sort, setSort] = useState('points')
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setFailed(false)
    get(`/api/leaderboard?sort=${sort}`, token).then((r) => {
      if (cancelled) return
      if (r.ok) setData(r)
      else setFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [sort, token])

  const meInTop = data?.me && data.top.some((r) => r.id === data.me.id)

  return (
    <PageShell backTo="/" maxWidth="max-w-xl">
      <div>
        <h1 className="flex items-center gap-3 font-display text-4xl leading-tight">
          <TrophyIcon size={34} className="text-gold" />
          {t('lb.title')}
        </h1>
        <p className="mt-1 text-base text-felt-200">{t('lb.subtitle')}</p>

        <div role="tablist" className="mt-6 grid grid-cols-2 gap-1.5 rounded-xl border-2 border-felt-600 bg-felt-950 p-1 sm:grid-cols-4">
          {TABS.map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={sort === k}
              onClick={() => setSort(k)}
              className={cx(
                'rounded-lg px-2 py-2 text-base font-bold transition-colors',
                sort === k ? 'bg-gold text-ink shadow-[0_2px_0_0_#8a5f0b]' : 'text-felt-200 hover:bg-felt-800 hover:text-paper',
              )}
            >
              {t(`lb.tab.${k}`)}
            </button>
          ))}
        </div>
        {sort === 'winRate' && <p className="mt-2 text-[15px] text-felt-300">{t('lb.minGames')}</p>}

        {/* กระดาษจดคะแนน: มีเส้นบรรทัด */}
        <div className="paper mt-5 p-2">
          {!data && !failed && <p className="py-10 text-center text-base text-ink-soft">{t('pub.loading')}</p>}
          {failed && <p className="py-10 text-center text-base font-semibold text-ember-deep">{t('pub.failed')}</p>}
          {data && data.top.length === 0 && <p className="py-10 text-center text-base text-ink-soft">{t('lb.empty')}</p>}
          <ul className="divide-y-2 divide-ink/10">
            {data?.top.map((r) => (
              <Row key={r.id} r={r} sort={sort} mine={r.id === account?.id} t={t} />
            ))}
          </ul>
          {data?.me && !meInTop && (
            <>
              <p className="py-1 text-center text-xl leading-none tracking-[0.4em] text-ink-faint" aria-hidden>
                ···
              </p>
              <ul>
                <Row r={data.me} sort={sort} mine t={t} />
              </ul>
            </>
          )}
        </div>

        {data && <p className="mt-3 text-center text-base text-felt-300">{t('lb.total', { n: data.total })}</p>}
        {!account && (
          <Link to="/login" className="mt-5 block">
            <Button variant="secondary" className="w-full">
              {t('lb.loginCta')}
            </Button>
          </Link>
        )}
      </div>
    </PageShell>
  )
}

import { Link } from 'react-router-dom'
import Background from './Background'
import LangSwitch from './LangSwitch'
import ConnectionBanner from './ConnectionBanner'
import { ArrowLeftIcon } from './Icons'
import { useLang } from '../i18n/LanguageContext'
import { cx } from '../lib/utils'

/** Common page wrapper: backdrop + centered container + back link + language switch. */
export default function PageShell({ children, backTo, maxWidth = 'max-w-md', className }) {
  const { t } = useLang()
  return (
    <div className="relative min-h-screen">
      <Background />
      <ConnectionBanner />
      <main
        className={cx(
          'mx-auto flex min-h-screen w-full flex-col justify-center px-4 py-8 sm:px-6',
          maxWidth,
          className,
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          {backTo ? (
            <Link
              to={backTo}
              className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-neon-blue"
            >
              <ArrowLeftIcon width={16} height={16} /> {t('common.back')}
            </Link>
          ) : (
            <span />
          )}
          <LangSwitch />
        </div>
        {children}
      </main>
    </div>
  )
}

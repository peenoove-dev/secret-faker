import { Link } from 'react-router-dom'
import Background from './Background'
import LangSwitch from './LangSwitch'
import SoundToggle from './SoundToggle'
import ConnectionBanner from './ConnectionBanner'
import { ArrowLeftIcon } from './Icons'
import { useLang } from '../i18n/LanguageContext'
import { cx } from '../lib/utils'

/** กรอบหน้าทั่วไป: พื้นหลังโต๊ะ + ปุ่มย้อนกลับ + สลับเสียง/ภาษา */
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
        <div className="mb-8 flex items-center justify-between">
          {backTo ? (
            <Link
              to={backTo}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-lg pr-3 text-base font-semibold text-felt-200 hover:text-paper"
            >
              <ArrowLeftIcon size={18} /> {t('common.back')}
            </Link>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <SoundToggle />
            <LangSwitch />
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}

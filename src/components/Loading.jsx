import Background from './Background'
import { useLang } from '../i18n/LanguageContext'

export default function Loading() {
  const { t } = useLang()
  return (
    <div className="relative grid min-h-screen place-items-center">
      <Background />
      <div className="flex flex-col items-center gap-4">
        <span className="card-back block h-[72px] w-[52px] rotate-[-6deg]" aria-hidden />
        <p className="animate-blink text-base font-semibold text-felt-200">{t('lobby.loading')}</p>
      </div>
    </div>
  )
}

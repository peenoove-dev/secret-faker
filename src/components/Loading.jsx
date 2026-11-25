import Background from './Background'
import { useLang } from '../i18n/LanguageContext'

export default function Loading() {
  const { t } = useLang()
  return (
    <div className="relative grid min-h-screen place-items-center">
      <Background />
      <p className="animate-glow-pulse font-mono text-sm text-slate-300">{t('lobby.loading')}</p>
    </div>
  )
}

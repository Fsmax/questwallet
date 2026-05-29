import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { CurrencySwitch } from '../settings/CurrencySwitch'
import { DayResetSelect } from '../settings/DayResetSelect'
import { CategoriesSection } from '../settings/CategoriesSection'
import { RecurringSection } from '../settings/RecurringSection'
import { RemindersSection } from '../settings/RemindersSection'
import { FeedbackSection } from '../settings/FeedbackSection'
import { ExportImportSection } from '../settings/ExportImportSection'
import { DangerSection } from '../settings/DangerSection'
import { SettingsCard, SettingsRow } from '../settings/SettingsCard'

export function SettingsScreen() {
  const auth = useAuth()

  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
        Настройки
      </h1>

      <SettingsCard title="Аккаунт">
        <SettingsRow label={auth.user?.email ?? ''} hint="Текущий аккаунт">
          <button
            onClick={() => auth.signOut()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-white/80 text-sm font-semibold rounded-xl hover:bg-white/10 hover:text-white transition"
          >
            <LogOut size={14} />
            Выйти
          </button>
        </SettingsRow>
      </SettingsCard>

      <CurrencySwitch />
      <DayResetSelect />
      <CategoriesSection />
      <RecurringSection />
      <RemindersSection />
      <FeedbackSection />
      <ExportImportSection />
      <DangerSection />
    </div>
  )
}

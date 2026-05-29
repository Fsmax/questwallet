import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Home,
  Swords,
  Rocket,
  Target,
  Wallet,
  HandCoins,
  Settings as SettingsIcon,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react'
// Экраны грузим лениво — каждый попадает в отдельный чанк, начальный бандл меньше.
const DashboardScreen = lazy(() =>
  import('../screens/DashboardScreen').then((m) => ({ default: m.DashboardScreen })),
)
const QuestsScreen = lazy(() =>
  import('../screens/QuestsScreen').then((m) => ({ default: m.QuestsScreen })),
)
const SkillsScreen = lazy(() =>
  import('../screens/SkillsScreen').then((m) => ({ default: m.SkillsScreen })),
)
const GoalsScreen = lazy(() =>
  import('../screens/GoalsScreen').then((m) => ({ default: m.GoalsScreen })),
)
const WalletScreen = lazy(() =>
  import('../screens/WalletScreen').then((m) => ({ default: m.WalletScreen })),
)
const DebtsScreen = lazy(() =>
  import('../screens/DebtsScreen').then((m) => ({ default: m.DebtsScreen })),
)
const SettingsScreen = lazy(() =>
  import('../screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
)
import { AppStateProvider, useAppState } from '../state/AppStateContext'
import { calcLevel } from '../finance/game'
import { LevelUpToast } from '../game/LevelUpToast'
import { AchievementToast } from '../achievements/AchievementToast'
import { useReminders } from '../game/useReminders'

export type Tab = 'home' | 'quests' | 'skills' | 'goals' | 'wallet' | 'debts' | 'settings'

const MAIN_TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'Главная', Icon: Home },
  { id: 'quests', label: 'Квесты', Icon: Swords },
  { id: 'skills', label: 'Навыки', Icon: Rocket },
  { id: 'goals', label: 'Цели', Icon: Target },
  { id: 'wallet', label: 'Кошелёк', Icon: Wallet },
  { id: 'debts', label: 'Долги', Icon: HandCoins },
]

export function AppShell() {
  return (
    <AppStateProvider>
      <ShellInner />
    </AppStateProvider>
  )
}

function ShellInner() {
  const { state, status, error, notice, clearNotice, achievementUnlocked, clearAchievementToast } =
    useAppState()
  const [tab, setTab] = useState<Tab>('home')
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const prevLevelRef = useRef<number | null>(null)

  useReminders()

  useEffect(() => {
    if (!state) return
    const currentLevel = calcLevel(state.xp).level
    if (prevLevelRef.current === null) {
      prevLevelRef.current = currentLevel
      return
    }
    if (currentLevel > prevLevelRef.current) {
      setLevelUp(currentLevel)
    }
    prevLevelRef.current = currentLevel
  }, [state?.xp, state])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-gold)]" size={32} />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="text-[var(--color-coral)] mb-4" size={40} />
        <h1 className="text-xl font-bold text-white mb-2">Не удалось загрузить данные</h1>
        <p className="text-white/60 mb-6 max-w-sm">{error ?? 'Неизвестная ошибка'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl"
        >
          Обновить
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar tab={tab} setTab={setTab} />

      {/* Колонка контента */}
      <div className="flex flex-col flex-1 min-h-screen w-full lg:pl-64">
        {/* Шапка — только мобильная */}
        <header className="lg:hidden sticky top-0 z-20 backdrop-blur-md bg-[var(--color-bg-deep)]/80 border-b border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-[var(--color-gold)]" size={22} />
              <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-gold)]">
                QuestWallet
              </span>
            </div>
            <button
              onClick={() => setTab('settings')}
              className={`p-2 rounded-full transition ${
                tab === 'settings'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              aria-label="Настройки"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </header>

        {(notice || error) && (
          <div className="mx-auto w-full max-w-[480px] lg:max-w-3xl px-4 lg:px-8 pt-3 space-y-2">
            <NoticeBanner notice={notice} onClose={clearNotice} />
            <ErrorBanner error={error} />
          </div>
        )}
        <LevelUpToast level={levelUp} onClose={() => setLevelUp(null)} />
        <AchievementToast achievementId={achievementUnlocked} onClose={clearAchievementToast} />

        <main className="flex-1 px-4 lg:px-8 py-6 pb-28 lg:pb-12">
          <div className="mx-auto w-full max-w-[480px] lg:max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Suspense
                  fallback={
                    <div className="flex justify-center py-16">
                      <Loader2 className="animate-spin text-[var(--color-gold)]" size={28} />
                    </div>
                  }
                >
                  {tab === 'home' && <DashboardScreen />}
                  {tab === 'quests' && <QuestsScreen />}
                  {tab === 'skills' && <SkillsScreen />}
                  {tab === 'goals' && <GoalsScreen />}
                  {tab === 'wallet' && <WalletScreen />}
                  {tab === 'debts' && <DebtsScreen />}
                  {tab === 'settings' && <SettingsScreen />}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Нижнее меню — только мобильное */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-20 backdrop-blur-md bg-[var(--color-bg-deep)]/90 border-t border-white/10"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex max-w-[480px] mx-auto">
            {MAIN_TABS.map(({ id, label, Icon }) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition ${
                    active ? 'text-[var(--color-gold)]' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  <span className={`text-xs ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}

function Sidebar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 border-r border-white/10 bg-[var(--color-bg-deep)]/60 backdrop-blur-md z-20">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <Sparkles className="text-[var(--color-gold)]" size={26} />
        <span className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-gold)]">
          QuestWallet
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {MAIN_TABS.map(({ id, label, Icon }) => (
          <SidebarItem
            key={id}
            label={label}
            Icon={Icon}
            active={tab === id}
            onClick={() => setTab(id)}
          />
        ))}
      </nav>

      <div className="px-3 pb-6 pt-2 border-t border-white/5 mt-2">
        <SidebarItem
          label="Настройки"
          Icon={SettingsIcon}
          active={tab === 'settings'}
          onClick={() => setTab('settings')}
        />
      </div>
    </aside>
  )
}

function SidebarItem({
  label,
  Icon,
  active,
  onClick,
}: {
  label: string
  Icon: typeof Home
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition ${
        active
          ? 'bg-[var(--color-gold)]/15 text-[var(--color-gold)]'
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      <span>{label}</span>
    </button>
  )
}

function NoticeBanner({ notice, onClose }: { notice: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [notice, onClose])

  if (!notice) return null
  return (
    <div className="px-3 py-2 rounded-lg bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center gap-2">
      <span className="text-sm text-[var(--color-gold)] flex-1">{notice}</span>
      <button onClick={onClose} className="text-[var(--color-gold)]/70 hover:text-[var(--color-gold)]">
        <X size={16} />
      </button>
    </div>
  )
}

function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <div className="px-3 py-2 rounded-lg bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 flex items-center gap-2">
      <AlertCircle className="text-[var(--color-coral)] flex-shrink-0" size={16} />
      <span className="text-sm text-[var(--color-coral)] flex-1">{error}</span>
    </div>
  )
}

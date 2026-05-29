import { motion } from 'framer-motion'
import { useAppState } from '../state/AppStateContext'
import { LevelBadge } from '../dashboard/LevelBadge'
import { BalanceCard } from '../dashboard/BalanceCard'
import { StreakCard } from '../dashboard/StreakCard'
import { DayProgress } from '../dashboard/DayProgress'
import { NearestGoalCard } from '../dashboard/NearestGoalCard'
import { AchievementsGrid } from '../achievements/AchievementsGrid'
import { visibleStreak } from '../finance/game'

export function DashboardScreen() {
  const { state } = useAppState()
  if (!state) return null

  const done = state.tasks.filter((t) => t.doneToday).length
  const total = state.tasks.length
  const activeGoals = state.goals.filter((g) => !g.completedAt)
  const nearest = activeGoals.length
    ? [...activeGoals].sort(
        (a, b) => b.saved / Math.max(b.target, 1) - a.saved / Math.max(a.target, 1),
      )[0]
    : null
  const streak = visibleStreak(state, new Date())

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
      className="space-y-4"
    >
      {/* Уровень + приветствие */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
        className="flex items-center gap-4"
      >
        <LevelBadge xp={state.xp} />
        <div className="flex-1">
          <div className="text-white/60 text-sm">Привет, искатель!</div>
          <div className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
            Продолжаем приключение
          </div>
        </div>
      </motion.div>

      {/* На десктопе — 2 колонки, на мобиле — один поток */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Левая колонка */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          className="space-y-4"
        >
          <BalanceCard balance={state.balance} currency={state.currency} />
          <DayProgress done={done} total={total} />
        </motion.div>

        {/* Правая колонка */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <StreakCard streak={streak} />
            <div className="rounded-2xl p-4 bg-white/5 border border-white/10 flex flex-col justify-center">
              <div className="text-xs uppercase tracking-wide text-white/50 font-semibold">Опыт</div>
              <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-white tabular-nums">
                {state.xp}
              </div>
            </div>
          </div>
          <NearestGoalCard goal={nearest} currency={state.currency} />
        </motion.div>
      </div>

      {/* Достижения */}
      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
        <AchievementsGrid />
      </motion.div>
    </motion.div>
  )
}

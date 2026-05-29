import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AppState, Currency, DebtDirection, RemindersConfig, Transaction } from '../types'
import { useAuth } from '../auth/useAuth'
import {
  loadState,
  createDebouncedSaver,
  appendTransaction,
  resetState as resetStateInCloud,
  ConflictError,
} from '../storage/storage'
import { ensureDefaults } from '../storage/ensureDefaults'
import { SEED_SKILLS } from '../lib/seed'
import { newlyUnlocked } from '../achievements/compute'
import { dailyResetIfNeeded } from '../finance/game'
import { getCurrentDay } from '../lib/dates'
import {
  applyEarn,
  applyCancel,
  applySave,
  applyWithdraw,
  applySpend,
  applyDeposit,
  applyDeleteGoal,
  applyDeleteTask,
  applyEditGoal,
  applyEditTask,
  applyAddTask,
  applyAddGoal,
  applyEarnSkillTask,
  applyCancelSkillTask,
  applyAddSkill,
  applyEditSkill,
  applyDeleteSkill,
  applyAddSkillTask,
  applyEditSkillTask,
  applyDeleteSkillTask,
  FinanceError,
  type DeleteGoalMode,
} from '../finance/finance'
import {
  applyAddCategory,
  applyEditCategory,
  applyDeleteCategory,
  applyAddRecurring,
  applyEditRecurring,
  applyDeleteRecurring,
  applyChargeRecurring,
} from '../finance/expenses'
import {
  applyAddDebt,
  applyRepayDebt,
  applyEditDebt,
  applyDeleteDebt,
} from '../finance/debts'
import { convertState } from '../finance/currency'

export type AppStatus = 'loading' | 'ready' | 'error'

export interface AppStateApi {
  state: AppState | null
  status: AppStatus
  error: string | null
  notice: string | null
  clearNotice: () => void
  achievementUnlocked: string | null
  clearAchievementToast: () => void
  // Финансовые операции (синхронные, обновляют state и шлют в облако с debounce)
  earn: (taskId: string) => void
  cancel: (taskId: string) => void
  save: (goalId: string, amount: number) => void
  withdraw: (goalId: string, amount: number) => void
  spend: (amount: number, label: string, category?: string) => void
  deposit: (amount: number, label?: string) => void
  // Жизненный цикл
  addTask: (input: { title: string; emoji: string; reward: number; xpReward: number }) => void
  editTask: (taskId: string, patch: { title?: string; emoji?: string; reward?: number; xpReward?: number }) => void
  deleteTask: (taskId: string) => void
  addGoal: (input: { title: string; emoji: string; target: number }) => void
  editGoal: (goalId: string, patch: { title?: string; emoji?: string; target?: number; order?: number }) => void
  deleteGoal: (goalId: string, mode: DeleteGoalMode) => void
  // Настройки
  setCurrency: (c: Currency) => void
  convertCurrency: (to: Currency, rate: number) => void
  setDayResetHour: (h: number) => void
  setReminders: (patch: Partial<RemindersConfig>) => void
  markNotified: (kind: 'morning' | 'evening', day: string) => void
  // Навыки
  earnSkillTask: (taskId: string) => void
  cancelSkillTask: (taskId: string) => void
  addSkill: (input: { title: string; emoji: string }) => void
  editSkill: (skillId: string, patch: { title?: string; emoji?: string; order?: number }) => void
  deleteSkill: (skillId: string) => void
  addSkillTask: (skillId: string, input: { title: string; emoji: string; reward: number; xpReward: number }) => void
  editSkillTask: (taskId: string, patch: { title?: string; emoji?: string; reward?: number; xpReward?: number }) => void
  deleteSkillTask: (taskId: string) => void
  loadSeedSkills: () => void
  // Категории расходов
  addCategory: (input: { title: string; emoji: string }) => void
  editCategory: (id: string, patch: { title?: string; emoji?: string; order?: number }) => void
  deleteCategory: (id: string) => void
  // Регулярные расходы
  addRecurring: (input: { title: string; emoji: string; amount: number; dayOfMonth: number; category: string | null }) => void
  editRecurring: (id: string, patch: { title?: string; emoji?: string; amount?: number; dayOfMonth?: number; category?: string | null; order?: number }) => void
  deleteRecurring: (id: string) => void
  chargeRecurring: (id: string) => void
  // Долги
  addDebt: (input: { direction: DebtDirection; person: string; emoji: string; principal: number; note: string; dueDate: string | null }) => void
  repayDebt: (debtId: string, amount: number) => void
  editDebt: (debtId: string, patch: { person?: string; emoji?: string; note?: string; dueDate?: string | null; principal?: number; order?: number }) => void
  deleteDebt: (debtId: string) => void
  // Опасные операции
  replaceState: (incoming: AppState) => void
  factoryReset: () => Promise<void>
}

const Ctx = createContext<AppStateApi | null>(null)

// Контекст + хук + провайдер живут в одном файле сознательно; единственное последствие —
// Fast Refresh иногда полностью перезагрузит модуль. На корректность не влияет.
// eslint-disable-next-line react-refresh/only-export-components
export function useAppState(): AppStateApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const [state, setState] = useState<AppState | null>(null)
  const [version, setVersion] = useState(0)
  const [status, setStatus] = useState<AppStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // Очередь: показываем разблокированные достижения по очереди, а не теряем все кроме первого.
  const [achievementQueue, setAchievementQueue] = useState<string[]>([])

  // «Свежие» значения для колбэков сейвера/таймеров, которые живут вне рендера.
  const stateRef = useRef<AppState | null>(null)
  const versionRef = useRef(0)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  useEffect(() => {
    versionRef.current = version
  }, [version])

  // ----- Debounced saver -----
  const saverRef = useRef<ReturnType<typeof createDebouncedSaver> | null>(null)

  useEffect(() => {
    if (!auth.user) {
      // Сброс при выходе из аккаунта — синхронизация с внешним auth-состоянием.
      /* eslint-disable react-hooks/set-state-in-effect */
      setState(null)
      setVersion(0)
      setStatus('loading')
      /* eslint-enable react-hooks/set-state-in-effect */
      saverRef.current?.cancel()
      saverRef.current = null
      return
    }

    const userId = auth.user.id
    saverRef.current = createDebouncedSaver(
      userId,
      () => versionRef.current,
      (newVersion) => {
        versionRef.current = newVersion
        setVersion(newVersion)
      },
      async (serverVersion) => {
        setNotice('Данные обновлены на другом устройстве. Подтянул свежие.')
        const fresh = await loadState(userId)
        const withReset = dailyResetIfNeeded(fresh.state, new Date())
        setState(withReset)
        setVersion(serverVersion)
        if (withReset !== fresh.state) {
          saverRef.current?.save(withReset)
        }
      },
      (err) => {
        console.error('Save failed', err)
        setError(err instanceof Error ? err.message : 'Не удалось сохранить')
      },
    )

    let cancelled = false
    setStatus('loading')
    setError(null)
    loadState(userId)
      .then(({ state: loaded, version: loadedVersion }) => {
        if (cancelled) return
        const withReset = dailyResetIfNeeded(loaded, new Date())
        setState(withReset)
        setVersion(loadedVersion)
        setStatus('ready')
        if (withReset !== loaded) {
          saverRef.current?.save(withReset)
        }
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Load failed', err)
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные')
        setStatus('error')
      })

    return () => {
      cancelled = true
      void saverRef.current?.flush()
    }
  }, [auth.user])

  // ----- Mutation helpers -----
  const userId = auth.user?.id

  const commit = useCallback((next: AppState) => {
    // Разблокировку достижений считаем здесь, при коммите, а не в отдельном эффекте:
    // так нет каскадного ре-рендера и повторного сохранения в облако.
    const fresh = newlyUnlocked(next)
    const finalState =
      fresh.length > 0
        ? { ...next, unlockedAchievements: [...next.unlockedAchievements, ...fresh] }
        : next
    if (fresh.length > 0) {
      setAchievementQueue((q) => [...q, ...fresh])
    }
    setState(finalState)
    saverRef.current?.save(finalState)
  }, [])

  // Авто-сброс дня каждую минуту: если резет-граница прошла, обнуляем галочки задач без перезагрузки.
  useEffect(() => {
    if (status !== 'ready') return
    const tick = () => {
      const cur = stateRef.current
      if (!cur) return
      const today = getCurrentDay(new Date(), cur.timezone, cur.dayResetHour)
      if (today !== cur.lastResetDate) {
        const next = dailyResetIfNeeded(cur, new Date())
        if (next !== cur) {
          setNotice('Новый день — задания сброшены')
          commit(next)
        }
      }
    }
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [status, commit])

  const commitWithTx = useCallback(
    (next: AppState, tx: Transaction | null) => {
      commit(next)
      if (tx && userId) {
        appendTransaction(userId, tx).catch((err) => {
          console.error('Append transaction failed', err)
        })
      }
    },
    [commit, userId],
  )

  const safe = useCallback(<T,>(fn: () => T): T | null => {
    try {
      return fn()
    } catch (err) {
      if (err instanceof FinanceError || err instanceof ConflictError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Что-то пошло не так')
      }
      return null
    }
  }, [])

  const api = useMemo<AppStateApi>(() => {
    const requireState = () => {
      if (!stateRef.current) throw new Error('State not loaded')
      return stateRef.current
    }
    return {
      state,
      status,
      error,
      notice,
      clearNotice: () => setNotice(null),
      achievementUnlocked: achievementQueue[0] ?? null,
      clearAchievementToast: () => setAchievementQueue((q) => q.slice(1)),

      earn: (taskId) => {
        safe(() => {
          const r = applyEarn(requireState(), taskId, new Date())
          commitWithTx(r.state, r.tx)
        })
      },
      cancel: (taskId) => {
        safe(() => {
          const r = applyCancel(requireState(), taskId)
          commit(r.state)
        })
      },
      save: (goalId, amount) => {
        safe(() => {
          const r = applySave(requireState(), goalId, amount, new Date())
          commitWithTx(r.state, r.tx)
        })
      },
      withdraw: (goalId, amount) => {
        safe(() => {
          const r = applyWithdraw(requireState(), goalId, amount, new Date())
          commitWithTx(r.state, r.tx)
        })
      },
      spend: (amount, label, category) => {
        safe(() => {
          const r = applySpend(requireState(), amount, label, new Date(), category)
          commitWithTx(r.state, r.tx)
        })
      },
      deposit: (amount, label) => {
        safe(() => {
          const r = applyDeposit(requireState(), amount, new Date(), label)
          commitWithTx(r.state, r.tx)
        })
      },
      addTask: (input) => {
        safe(() => commit(applyAddTask(requireState(), input)))
      },
      editTask: (taskId, patch) => {
        safe(() => commit(applyEditTask(requireState(), taskId, patch)))
      },
      deleteTask: (taskId) => {
        safe(() => commit(applyDeleteTask(requireState(), taskId)))
      },
      addGoal: (input) => {
        safe(() => commit(applyAddGoal(requireState(), input, new Date())))
      },
      editGoal: (goalId, patch) => {
        safe(() => commit(applyEditGoal(requireState(), goalId, patch, new Date())))
      },
      deleteGoal: (goalId, mode) => {
        safe(() => {
          const r = applyDeleteGoal(requireState(), goalId, mode, new Date())
          commitWithTx(r.state, r.tx)
        })
      },

      earnSkillTask: (taskId) => {
        safe(() => {
          const r = applyEarnSkillTask(requireState(), taskId, new Date())
          commitWithTx(r.state, r.tx)
        })
      },
      cancelSkillTask: (taskId) => {
        safe(() => {
          const r = applyCancelSkillTask(requireState(), taskId)
          commit(r.state)
        })
      },
      addSkill: (input) => {
        safe(() => commit(applyAddSkill(requireState(), input, new Date())))
      },
      editSkill: (skillId, patch) => {
        safe(() => commit(applyEditSkill(requireState(), skillId, patch)))
      },
      deleteSkill: (skillId) => {
        safe(() => commit(applyDeleteSkill(requireState(), skillId)))
      },
      addSkillTask: (skillId, input) => {
        safe(() => commit(applyAddSkillTask(requireState(), skillId, input)))
      },
      editSkillTask: (taskId, patch) => {
        safe(() => commit(applyEditSkillTask(requireState(), taskId, patch)))
      },
      deleteSkillTask: (taskId) => {
        safe(() => commit(applyDeleteSkillTask(requireState(), taskId)))
      },
      loadSeedSkills: () => {
        safe(() => {
          let next = requireState()
          const now = new Date()
          for (const s of SEED_SKILLS) {
            next = applyAddSkill(next, { title: s.title, emoji: s.emoji }, now)
            const newSkill = next.skills[next.skills.length - 1]
            for (const t of s.tasks) {
              next = applyAddSkillTask(next, newSkill.id, t)
            }
          }
          commit(next)
        })
      },

      addCategory: (input) => {
        safe(() => commit(applyAddCategory(requireState(), input)))
      },
      editCategory: (id, patch) => {
        safe(() => commit(applyEditCategory(requireState(), id, patch)))
      },
      deleteCategory: (id) => {
        safe(() => commit(applyDeleteCategory(requireState(), id)))
      },

      addRecurring: (input) => {
        safe(() => commit(applyAddRecurring(requireState(), input, new Date())))
      },
      editRecurring: (id, patch) => {
        safe(() => commit(applyEditRecurring(requireState(), id, patch)))
      },
      deleteRecurring: (id) => {
        safe(() => commit(applyDeleteRecurring(requireState(), id)))
      },
      chargeRecurring: (id) => {
        safe(() => {
          const r = applyChargeRecurring(requireState(), id, new Date())
          commitWithTx(r.state, r.tx)
        })
      },

      addDebt: (input) => {
        safe(() => {
          const r = applyAddDebt(requireState(), input, new Date())
          commitWithTx(r.state, r.tx)
        })
      },
      repayDebt: (debtId, amount) => {
        safe(() => {
          const r = applyRepayDebt(requireState(), debtId, amount, new Date())
          commitWithTx(r.state, r.tx)
        })
      },
      editDebt: (debtId, patch) => {
        safe(() => commit(applyEditDebt(requireState(), debtId, patch, new Date())))
      },
      deleteDebt: (debtId) => {
        safe(() => commit(applyDeleteDebt(requireState(), debtId)))
      },

      setCurrency: (currency) => {
        safe(() => commit({ ...requireState(), currency }))
      },
      convertCurrency: (to, rate) => {
        safe(() => commit(convertState(requireState(), to, rate)))
      },
      setDayResetHour: (dayResetHour) => {
        safe(() => commit({ ...requireState(), dayResetHour }))
      },
      setReminders: (patch) => {
        safe(() => {
          const cur = requireState()
          commit({ ...cur, reminders: { ...cur.reminders, ...patch } })
        })
      },
      markNotified: (kind, day) => {
        safe(() => {
          const cur = requireState()
          commit({
            ...cur,
            lastNotifiedDate: { ...cur.lastNotifiedDate, [kind]: day },
          })
        })
      },
      replaceState: (incoming) => {
        safe(() => commit(ensureDefaults(incoming)))
      },
      factoryReset: async () => {
        if (!userId) return
        try {
          saverRef.current?.cancel()
          const fresh = await resetStateInCloud(userId)
          setState(fresh.state)
          setVersion(fresh.version)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Не удалось сбросить')
        }
      },
    }
  }, [state, status, error, notice, achievementQueue, commit, commitWithTx, safe, userId])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

import { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { SettingsCard, SettingsRow } from './SettingsCard'
import { Toggle } from './Toggle'

type PermStatus = 'unknown' | 'granted' | 'denied' | 'default' | 'unsupported'

function detectPerm(): PermStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission as PermStatus
}

export function RemindersSection() {
  const { state, setReminders } = useAppState()
  const [perm, setPerm] = useState<PermStatus>(detectPerm)

  if (!state) return null
  const r = state.reminders

  const handleEnable = async () => {
    if (perm === 'unsupported') return
    if (r.enabled) {
      setReminders({ enabled: false })
      return
    }
    if (perm === 'granted') {
      setReminders({ enabled: true })
      return
    }
    if (perm === 'denied') {
      return
    }
    const result = await Notification.requestPermission()
    setPerm(result as PermStatus)
    if (result === 'granted') setReminders({ enabled: true })
  }

  return (
    <SettingsCard title="Напоминания">
      <SettingsRow
        label="Напоминать о квестах"
        hint={
          perm === 'unsupported'
            ? 'Браузер не поддерживает уведомления'
            : perm === 'denied'
              ? 'Разрешение запрещено — включи в настройках браузера'
              : r.enabled
                ? 'Включено'
                : 'Выключено'
        }
      >
        <Toggle
          on={r.enabled}
          onToggle={handleEnable}
          label="Включить напоминания"
        />
      </SettingsRow>

      {r.enabled && (
        <>
          <SettingsRow label="Утреннее" hint="Список квестов на сегодня">
            <TimeInput
              value={r.morningTime}
              onChange={(t) => setReminders({ morningTime: t })}
            />
          </SettingsRow>

          <SettingsRow label="Вечернее" hint="Если есть невыполненные">
            <div className="flex items-center gap-3">
              {r.eveningEnabled && (
                <TimeInput
                  value={r.eveningTime}
                  onChange={(t) => setReminders({ eveningTime: t })}
                />
              )}
              <Toggle
                on={r.eveningEnabled}
                onToggle={() => setReminders({ eveningEnabled: !r.eveningEnabled })}
                label="Вечернее напоминание"
              />
            </div>
          </SettingsRow>
        </>
      )}

      {perm === 'denied' && (
        <div className="mt-3 p-3 rounded-lg bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 text-xs text-[var(--color-coral)]">
          <BellOff size={14} className="inline mr-1" />
          Уведомления отключены в браузере. Открой настройки сайта → разрешить уведомления.
        </div>
      )}

      {perm === 'granted' && r.enabled && (
        <div className="mt-3 p-3 rounded-lg bg-[var(--color-emerald-quest)]/10 border border-[var(--color-emerald-quest)]/30 text-xs text-[var(--color-emerald-quest)]">
          <Bell size={14} className="inline mr-1" />
          Будем напоминать при открытии приложения после {r.morningTime}
          {r.eveningEnabled && <> и после {r.eveningTime}</>}.
        </div>
      )}
    </SettingsCard>
  )
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white font-bold tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none"
    />
  )
}

import { useAppState } from '../state/AppStateContext'
import { SettingsCard, SettingsRow } from './SettingsCard'

const OPTIONS = [0, 3, 4, 5, 6]

export function DayResetSelect() {
  const { state, setDayResetHour } = useAppState()
  if (!state) return null

  return (
    <SettingsCard title="Когда начинается новый день">
      <SettingsRow
        label="Час сброса"
        hint="Всё, что между 00:00 и этим часом, считается вчерашним днём"
      >
        <select
          value={state.dayResetHour}
          onChange={(e) => setDayResetHour(Number(e.target.value))}
          className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white font-bold tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none"
        >
          {OPTIONS.map((h) => (
            <option key={h} value={h} className="bg-[var(--color-bg-elev)]">
              {h.toString().padStart(2, '0')}:00
            </option>
          ))}
        </select>
      </SettingsRow>
    </SettingsCard>
  )
}

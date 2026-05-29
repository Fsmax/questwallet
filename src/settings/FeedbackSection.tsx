import { useState } from 'react'
import { Volume2, Vibrate } from 'lucide-react'
import { SettingsCard, SettingsRow } from './SettingsCard'
import { Toggle } from './Toggle'
import {
  isSoundEnabled,
  setSoundEnabled,
  isHapticEnabled,
  setHapticEnabled,
} from '../lib/feedback'

export function FeedbackSection() {
  const [sound, setSound] = useState(isSoundEnabled())
  const [haptic, setHaptic] = useState(isHapticEnabled())

  const hasVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

  return (
    <SettingsCard title="Звук и вибрация">
      <SettingsRow label="Звук" hint="Монетки, уровни, цели">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-white/40" />
          <Toggle
            on={sound}
            onToggle={() => {
              const v = !sound
              setSound(v)
              setSoundEnabled(v)
            }}
            label="Звук"
          />
        </div>
      </SettingsRow>

      {hasVibrate && (
        <SettingsRow label="Вибрация" hint="Тактильный отклик на телефоне">
          <div className="flex items-center gap-2">
            <Vibrate size={16} className="text-white/40" />
            <Toggle
              on={haptic}
              onToggle={() => {
                const v = !haptic
                setHaptic(v)
                setHapticEnabled(v)
              }}
              label="Вибрация"
            />
          </div>
        </SettingsRow>
      )}
    </SettingsCard>
  )
}

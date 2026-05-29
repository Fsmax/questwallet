// Звук и тактильный отклик. Настройки хранятся локально (per-device), без синхронизации.

const SOUND_KEY = 'questwallet_sound'
const HAPTIC_KEY = 'questwallet_haptic'

function readFlag(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return def
    return v === '1'
  } catch {
    return def
  }
}

let soundEnabled = readFlag(SOUND_KEY, true)
let hapticEnabled = readFlag(HAPTIC_KEY, true)

export function isSoundEnabled() {
  return soundEnabled
}
export function isHapticEnabled() {
  return hapticEnabled
}
export function setSoundEnabled(v: boolean) {
  soundEnabled = v
  try {
    localStorage.setItem(SOUND_KEY, v ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (v) playCoin() // короткое подтверждение при включении
}
export function setHapticEnabled(v: boolean) {
  hapticEnabled = v
  try {
    localStorage.setItem(HAPTIC_KEY, v ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (v) vibrate(20)
}

let audioCtx: AudioContext | null = null
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      audioCtx = new Ctor()
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, duration: number, gain = 0.18, type: OscillatorType = 'triangle') {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = ctx.currentTime + start
  env.gain.setValueAtTime(0, t0)
  env.gain.linearRampToValueAtTime(gain, t0 + 0.01)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(env)
  env.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

/** Звон монеты: два восходящих тона (как при подборе монеты в играх). */
export function playCoin() {
  if (!soundEnabled) return
  tone(988, 0, 0.08, 0.16) // B5
  tone(1319, 0.07, 0.18, 0.16) // E6
}

/** Победный аккорд при достижении цели. */
export function playGoal() {
  if (!soundEnabled) return
  tone(523, 0, 0.15, 0.15) // C5
  tone(659, 0.1, 0.15, 0.15) // E5
  tone(784, 0.2, 0.25, 0.15) // G5
  tone(1047, 0.32, 0.35, 0.15) // C6
}

/** Фанфары при повышении уровня. */
export function playLevelUp() {
  if (!soundEnabled) return
  tone(659, 0, 0.12, 0.16) // E5
  tone(784, 0.1, 0.12, 0.16) // G5
  tone(1047, 0.22, 0.3, 0.18) // C6
}

export function vibrate(pattern: number | number[]) {
  if (!hapticEnabled) return
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {
    /* ignore */
  }
}

/** Комбо для выполнения задания. */
export function feedbackComplete() {
  playCoin()
  vibrate(25)
}
export function feedbackGoal() {
  playGoal()
  vibrate([0, 40, 30, 60])
}
export function feedbackLevelUp() {
  playLevelUp()
  vibrate([0, 30, 40, 50])
}

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'

const DISMISS_KEY = 'questwallet_welcome_dismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Подсказка для новых аккаунтов: с чего начать. Показывается, пока кошелёк пуст
 * и пользователь её не закрыл (флаг хранится локально).
 */
export function WelcomeCard() {
  const [dismissed, setDismissed] = useState(readDismissed)
  if (dismissed) return null

  const close = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative rounded-2xl p-4 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30">
      <button
        onClick={close}
        className="absolute top-3 right-3 text-[var(--color-gold)]/60 hover:text-[var(--color-gold)] transition"
        aria-label="Закрыть"
      >
        <X size={16} />
      </button>
      <div className="flex items-center gap-2 mb-1.5">
        <Sparkles size={18} className="text-[var(--color-gold)]" />
        <h3 className="font-bold text-white">С чего начать</h3>
      </div>
      <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
        <li>
          Внеси свои деньги: <strong className="text-white">Кошелёк → Пополнить</strong>
        </li>
        <li>Выполняй квесты и навыки — получай баллы и качай уровень</li>
        <li>Заведи цели, долги и регулярные платежи</li>
      </ul>
    </div>
  )
}

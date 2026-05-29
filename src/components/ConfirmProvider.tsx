import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Modal } from './Modal'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const Ctx = createContext<ConfirmFn | null>(null)

// Контекст + хук + провайдер в одном файле (как у AppStateContext) — только ради Fast Refresh.
// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmFn {
  const fn = useContext(Ctx)
  if (!fn) throw new Error('useConfirm must be used inside ConfirmProvider')
  return fn
}

/**
 * Заменяет нативный window.confirm() на модалку в стиле приложения.
 * `const confirm = useConfirm()` → `if (await confirm({ message, danger: true })) { ... }`.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setOpts(null)
  }, [])

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Modal open={opts !== null} onClose={() => close(false)} title={opts?.title ?? 'Подтверждение'}>
        {opts && (
          <div className="space-y-5">
            <p className="text-sm text-white/80 leading-relaxed">{opts.message}</p>
            <div className="flex gap-2">
              <button
                onClick={() => close(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-white/80 font-semibold rounded-xl hover:bg-white/10 transition"
              >
                {opts.cancelLabel ?? 'Отмена'}
              </button>
              <button
                onClick={() => close(true)}
                className={`flex-1 py-3 font-bold rounded-xl transition active:scale-[0.98] ${
                  opts.danger
                    ? 'bg-[var(--color-coral)] text-white hover:brightness-110'
                    : 'bg-[var(--color-gold)] text-[var(--color-bg-deep)] hover:brightness-110'
                }`}
              >
                {opts.confirmLabel ?? 'Удалить'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Ctx.Provider>
  )
}

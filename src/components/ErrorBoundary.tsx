import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Ловит ошибки рендера, чтобы вместо белого экрана показать понятное сообщение
 * с кнопкой перезагрузки.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error caught by ErrorBoundary', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <AlertTriangle className="text-[var(--color-coral)] mb-4" size={40} />
          <h1 className="text-xl font-bold text-white mb-2">Что-то сломалось</h1>
          <p className="text-white/60 mb-6 max-w-sm">
            Приложение наткнулось на ошибку. Перезагрузка обычно помогает.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl"
          >
            Перезагрузить
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

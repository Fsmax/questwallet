import { Loader2 } from 'lucide-react'
import { useAuth } from './auth/useAuth'
import { AuthScreen } from './auth/AuthScreen'
import { AppShell } from './layout/AppShell'

function App() {
  const auth = useAuth()

  if (auth.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-gold)]" size={32} />
      </div>
    )
  }

  if (auth.status === 'anonymous') {
    return <AuthScreen />
  }

  return <AppShell />
}

export default App

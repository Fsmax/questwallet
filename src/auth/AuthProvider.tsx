import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthApi, type AuthStatus } from './authContext'

/**
 * Единая точка работы с auth: одна подписка на onAuthStateChange и один источник
 * сессии для всего приложения (раньше каждый вызов useAuth заводил свою подписку).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setStatus(data.session ? 'authenticated' : 'anonymous')
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setStatus(newSession ? 'authenticated' : 'anonymous')
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthApi>(
    () => ({
      session,
      status,
      user: session?.user ?? null,
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signUp: (email, password) => supabase.auth.signUp({ email, password }),
      signOut: () => supabase.auth.signOut(),
      resetPassword: (email) =>
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/?reset=1`,
        }),
      updatePassword: (newPassword) => supabase.auth.updateUser({ password: newPassword }),
    }),
    [session, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export function useAuth() {
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

  return {
    session,
    status,
    user: session?.user ?? null,
    signIn: (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email: string, password: string) =>
      supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email: string) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?reset=1`,
      }),
    updatePassword: (newPassword: string) =>
      supabase.auth.updateUser({ password: newPassword }),
  }
}

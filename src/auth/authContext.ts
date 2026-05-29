import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthApi {
  session: Session | null
  status: AuthStatus
  user: User | null
  signIn: (email: string, password: string) => ReturnType<typeof supabase.auth.signInWithPassword>
  signUp: (email: string, password: string) => ReturnType<typeof supabase.auth.signUp>
  signOut: () => ReturnType<typeof supabase.auth.signOut>
  resetPassword: (email: string) => ReturnType<typeof supabase.auth.resetPasswordForEmail>
  updatePassword: (newPassword: string) => ReturnType<typeof supabase.auth.updateUser>
}

export const AuthContext = createContext<AuthApi | null>(null)

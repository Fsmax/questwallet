import { useContext } from 'react'
import { AuthContext, type AuthApi } from './authContext'

export type { AuthStatus } from './authContext'

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

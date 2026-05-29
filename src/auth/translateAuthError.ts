import type { AuthError } from '@supabase/supabase-js'

export function translateAuthError(error: AuthError | Error | null): string | null {
  if (!error) return null
  const msg = error.message ?? ''

  if (/invalid login credentials/i.test(msg)) {
    return 'Неверный email или пароль'
  }
  if (/user already registered/i.test(msg) || /already exists/i.test(msg)) {
    return 'Этот email уже зарегистрирован. Войти?'
  }
  if (/password.*at least/i.test(msg) || /password.*short/i.test(msg)) {
    return 'Пароль слишком короткий (минимум 8 символов)'
  }
  if (/email.*invalid/i.test(msg) || /invalid.*email/i.test(msg)) {
    return 'Неверный формат email'
  }
  if (/email not confirmed/i.test(msg)) {
    return 'Email не подтверждён. Проверь почту'
  }
  if (/rate limit/i.test(msg) || /too many/i.test(msg)) {
    return 'Слишком много попыток. Подожди минуту и попробуй снова'
  }
  if (/failed to fetch/i.test(msg) || /network/i.test(msg) || /load failed/i.test(msg)) {
    return 'Нет связи с сервером. Проверь интернет'
  }

  return msg || 'Что-то пошло не так. Попробуй ещё раз'
}

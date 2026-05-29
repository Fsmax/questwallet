import { useEffect, useState } from 'react'
import { Sparkles, Mail, Lock, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from './useAuth'
import { translateAuthError } from './translateAuthError'

type Mode = 'signin' | 'signup' | 'reset-request' | 'reset-confirm' | 'reset-sent'

export function AuthScreen() {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Если в URL ?reset=1 — переключиться в режим установки нового пароля
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset') === '1') {
      setMode('reset-confirm')
    }
  }, [])

  const reset = () => {
    setError(null)
    setInfo(null)
    setLoading(false)
  }

  const switchMode = (newMode: Mode) => {
    reset()
    setPassword('')
    setPasswordConfirm('')
    setMode(newMode)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setLoading(true)
    const { error } = await auth.signIn(email, password)
    setLoading(false)
    if (error) setError(translateAuthError(error))
    // Успех — onAuthStateChange в useAuth переключит UI на основное приложение
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    if (password.length < 8) {
      setError('Пароль должен быть минимум 8 символов')
      return
    }
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают')
      return
    }
    setLoading(true)
    const { error } = await auth.signUp(email, password)
    setLoading(false)
    if (error) setError(translateAuthError(error))
  }

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setLoading(true)
    const { error } = await auth.resetPassword(email)
    setLoading(false)
    if (error) {
      setError(translateAuthError(error))
    } else {
      switchMode('reset-sent')
    }
  }

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    if (password.length < 8) {
      setError('Пароль должен быть минимум 8 символов')
      return
    }
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают')
      return
    }
    setLoading(true)
    const { error } = await auth.updatePassword(password)
    setLoading(false)
    if (error) {
      setError(translateAuthError(error))
    } else {
      // Подчищаем ?reset=1 из URL
      window.history.replaceState({}, '', window.location.pathname)
      setInfo('Пароль обновлён. Сейчас войдём…')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Sparkles className="text-[var(--color-gold)]" size={32} />
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--color-gold)]">
            QuestWallet
          </h1>
        </div>

        {/* Карточка */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {mode === 'signin' && (
            <SignInForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              error={error}
              onSubmit={handleSignIn}
              onSignUp={() => switchMode('signup')}
              onReset={() => switchMode('reset-request')}
            />
          )}

          {mode === 'signup' && (
            <SignUpForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              passwordConfirm={passwordConfirm}
              setPasswordConfirm={setPasswordConfirm}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              error={error}
              onSubmit={handleSignUp}
              onSignIn={() => switchMode('signin')}
            />
          )}

          {mode === 'reset-request' && (
            <ResetRequestForm
              email={email}
              setEmail={setEmail}
              loading={loading}
              error={error}
              onSubmit={handleResetRequest}
              onBack={() => switchMode('signin')}
            />
          )}

          {mode === 'reset-sent' && (
            <ResetSent
              email={email}
              onBack={() => switchMode('signin')}
            />
          )}

          {mode === 'reset-confirm' && (
            <ResetConfirmForm
              password={password}
              setPassword={setPassword}
              passwordConfirm={passwordConfirm}
              setPasswordConfirm={setPasswordConfirm}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              error={error}
              info={info}
              onSubmit={handleResetConfirm}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ============= Подкомпоненты =============

function FormError({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <div className="text-sm text-[var(--color-coral)] bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 rounded-lg px-3 py-2">
      {text}
    </div>
  )
}

function FormInfo({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <div className="text-sm text-[var(--color-emerald-quest)] bg-[var(--color-emerald-quest)]/10 border border-[var(--color-emerald-quest)]/30 rounded-lg px-3 py-2">
      {text}
    </div>
  )
}

function EmailInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-white/70 font-semibold mb-1.5 block">Email</span>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
        <input
          type="email"
          required
          autoComplete="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-white placeholder:text-white/30 focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          placeholder="you@example.com"
        />
      </div>
    </label>
  )
}

function PasswordInput({
  value,
  onChange,
  show,
  toggleShow,
  label = 'Пароль',
  autoComplete = 'current-password',
}: {
  value: string
  onChange: (v: string) => void
  show: boolean
  toggleShow: () => void
  label?: string
  autoComplete?: string
}) {
  return (
    <label className="block">
      <span className="text-sm text-white/70 font-semibold mb-1.5 block">{label}</span>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
        <input
          type={show ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder:text-white/30 focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  )
}

function SubmitButton({
  children,
  loading,
}: {
  children: React.ReactNode
  loading: boolean
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold py-3 rounded-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
    >
      {loading && <Loader2 className="animate-spin" size={18} />}
      {children}
    </button>
  )
}

// ----- SignIn -----
function SignInForm(props: {
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  loading: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
  onSignUp: () => void
  onReset: () => void
}) {
  return (
    <form onSubmit={props.onSubmit} className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white text-center mb-6">
        Вход
      </h2>
      <EmailInput value={props.email} onChange={props.setEmail} />
      <PasswordInput
        value={props.password}
        onChange={props.setPassword}
        show={props.showPassword}
        toggleShow={() => props.setShowPassword(!props.showPassword)}
      />
      <FormError text={props.error} />
      <SubmitButton loading={props.loading}>Войти</SubmitButton>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-white/60 pt-2">
        <button type="button" onClick={props.onReset} className="hover:text-white/90 transition">
          Забыли пароль?
        </button>
        <button type="button" onClick={props.onSignUp} className="hover:text-white/90 transition">
          Нет аккаунта? <span className="text-[var(--color-gold)]">Зарегистрироваться</span>
        </button>
      </div>
    </form>
  )
}

// ----- SignUp -----
function SignUpForm(props: {
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  passwordConfirm: string
  setPasswordConfirm: (v: string) => void
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  loading: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
  onSignIn: () => void
}) {
  const strength = passwordStrength(props.password)
  return (
    <form onSubmit={props.onSubmit} className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white text-center mb-6">
        Регистрация
      </h2>
      <EmailInput value={props.email} onChange={props.setEmail} />
      <div className="space-y-2">
        <PasswordInput
          value={props.password}
          onChange={props.setPassword}
          show={props.showPassword}
          toggleShow={() => props.setShowPassword(!props.showPassword)}
          autoComplete="new-password"
        />
        {props.password.length > 0 && (
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded ${
                  i < strength.score ? strength.color : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <PasswordInput
        value={props.passwordConfirm}
        onChange={props.setPasswordConfirm}
        show={props.showPassword}
        toggleShow={() => props.setShowPassword(!props.showPassword)}
        label="Подтверди пароль"
        autoComplete="new-password"
      />
      <FormError text={props.error} />
      <SubmitButton loading={props.loading}>Создать аккаунт</SubmitButton>
      <div className="text-sm text-white/60 text-center pt-2">
        <button type="button" onClick={props.onSignIn} className="hover:text-white/90 transition">
          Уже есть аккаунт? <span className="text-[var(--color-gold)]">Войти</span>
        </button>
      </div>
    </form>
  )
}

function passwordStrength(p: string): { score: number; color: string } {
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) score++
  const colors = [
    'bg-[var(--color-coral)]',
    'bg-[var(--color-coral)]',
    'bg-[var(--color-gold)]',
    'bg-[var(--color-emerald-quest)]',
  ]
  return { score, color: colors[Math.max(0, score - 1)] }
}

// ----- ResetRequest -----
function ResetRequestForm(props: {
  email: string
  setEmail: (v: string) => void
  loading: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
}) {
  return (
    <form onSubmit={props.onSubmit} className="space-y-4">
      <button
        type="button"
        onClick={props.onBack}
        className="flex items-center gap-1 text-sm text-white/60 hover:text-white/90 transition mb-2"
      >
        <ArrowLeft size={16} /> Ко входу
      </button>
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white text-center mb-2">
        Сброс пароля
      </h2>
      <p className="text-sm text-white/60 text-center mb-4">
        Введи email — пришлём ссылку для установки нового пароля
      </p>
      <EmailInput value={props.email} onChange={props.setEmail} />
      <FormError text={props.error} />
      <SubmitButton loading={props.loading}>Отправить ссылку</SubmitButton>
    </form>
  )
}

// ----- ResetSent -----
function ResetSent({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <div className="text-5xl">📬</div>
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
        Письмо отправлено
      </h2>
      <p className="text-sm text-white/70">
        Ссылка для сброса пароля отправлена на <strong className="text-white">{email}</strong>.
        Проверь почту (и папку «Спам»).
      </p>
      <button
        type="button"
        onClick={onBack}
        className="w-full bg-white/5 border border-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition"
      >
        Вернуться ко входу
      </button>
    </div>
  )
}

// ----- ResetConfirm -----
function ResetConfirmForm(props: {
  password: string
  setPassword: (v: string) => void
  passwordConfirm: string
  setPasswordConfirm: (v: string) => void
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  loading: boolean
  error: string | null
  info: string | null
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={props.onSubmit} className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white text-center mb-2">
        Новый пароль
      </h2>
      <p className="text-sm text-white/60 text-center mb-4">
        Придумай новый пароль (минимум 8 символов)
      </p>
      <PasswordInput
        value={props.password}
        onChange={props.setPassword}
        show={props.showPassword}
        toggleShow={() => props.setShowPassword(!props.showPassword)}
        label="Новый пароль"
        autoComplete="new-password"
      />
      <PasswordInput
        value={props.passwordConfirm}
        onChange={props.setPasswordConfirm}
        show={props.showPassword}
        toggleShow={() => props.setShowPassword(!props.showPassword)}
        label="Подтверди пароль"
        autoComplete="new-password"
      />
      <FormError text={props.error} />
      <FormInfo text={props.info} />
      <SubmitButton loading={props.loading}>Сохранить</SubmitButton>
    </form>
  )
}
